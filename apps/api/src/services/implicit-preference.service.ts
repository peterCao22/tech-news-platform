/**
 * Story 4.4: Implicit Preference Service
 * 隐式偏好学习服务
 * 
 * 从用户行为数据中自动学习用户真实偏好
 * 核心算法：基于行为权重、时间衰减和频次统计
 */

import { 
  prisma,
  BehaviorEventType,
  type ImplicitPreference 
} from '@tech-news-platform/database';

// ============================================
// 类型定义
// ============================================

export interface PreferenceScore {
  preferenceType: 'category' | 'source' | 'topic' | 'company';
  preferenceKey: string;
  weight: number;
  confidence: number;
  interactionCount: number;
  lastInteraction: Date;
}

export interface PreferenceComparison {
  explicit: {
    categories: Array<{ key: string; weight: number }>;
    companies: Array<{ key: string; weight: number }>;
    sources: Array<{ key: string; weight: number }>;
  };
  implicit: {
    categories: Array<{ key: string; weight: number; confidence: number }>;
    companies: Array<{ key: string; weight: number; confidence: number }>;
    sources: Array<{ key: string; weight: number; confidence: number }>;
  };
  insights: string[];
}

// 行为权重配置
const BEHAVIOR_WEIGHTS = {
  [BehaviorEventType.VIEW]: 0.1,      // 浏览：最低权重
  [BehaviorEventType.CLICK]: 0.2,     // 点击：低权重
  [BehaviorEventType.READ]: 0.5,      // 阅读：中等权重
  [BehaviorEventType.BOOKMARK]: 0.8,  // 收藏：高权重
  [BehaviorEventType.LIKE]: 0.7,      // 点赞：较高权重
  [BehaviorEventType.SHARE]: 0.9,     // 分享：最高权重
  [BehaviorEventType.SEARCH]: 0.3,    // 搜索：低权重
  [BehaviorEventType.COMMENT]: 0.6,   // 评论：中高权重
};

// 时间衰减配置（天数）
const TIME_DECAY_DAYS = {
  RECENT: 7,      // 最近7天：权重1.0
  MEDIUM: 30,     // 30天内：权重0.7
  OLD: 90,        // 90天内：权重0.4
};

// ============================================
// ImplicitPreferenceService - 隐式偏好服务
// ============================================

class ImplicitPreferenceService {
  /**
   * 从用户行为中学习和更新隐式偏好
   * 这是核心算法，应该定期运行（例如每天凌晨）
   */
  async learnUserPreferences(userId: string): Promise<void> {
    console.log(`[ImplicitPreference] 开始学习用户 ${userId} 的偏好...`);

    try {
      // 1. 获取用户行为数据（最近90天）
      const behaviors = await this.getUserBehaviors(userId, 90);
      
      if (behaviors.length === 0) {
        console.log(`[ImplicitPreference] 用户 ${userId} 没有足够的行为数据`);
        return;
      }

      console.log(`[ImplicitPreference] 获取到 ${behaviors.length} 条行为记录`);

      // 2. 分析分类偏好
      const categoryPreferences = await this.analyzeCategoryPreferences(behaviors);
      await this.savePreferences(userId, 'category', categoryPreferences);

      // 3. 分析信息源偏好
      const sourcePreferences = await this.analyzeSourcePreferences(behaviors);
      await this.savePreferences(userId, 'source', sourcePreferences);

      // 4. 分析话题偏好（从tags提取）
      const topicPreferences = await this.analyzeTopicPreferences(behaviors);
      await this.savePreferences(userId, 'topic', topicPreferences);

      // 5. 分析公司偏好（从内容中提取）
      const companyPreferences = await this.analyzeCompanyPreferences(behaviors);
      await this.savePreferences(userId, 'company', companyPreferences);

      console.log(`[ImplicitPreference] 用户 ${userId} 的偏好学习完成`);
    } catch (error) {
      console.error(`[ImplicitPreference] 学习用户偏好失败:`, error);
      throw error;
    }
  }

  /**
   * 获取用户行为数据
   */
  private async getUserBehaviors(userId: string, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.userBehavior.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
        },
      },
      include: {
        content: {
          select: {
            id: true,
            category: true,
            tags: true,
            sourceId: true,
            source: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * 分析分类偏好
   */
  private async analyzeCategoryPreferences(behaviors: any[]): Promise<PreferenceScore[]> {
    const categoryScores: Map<string, {
      totalWeight: number;
      count: number;
      lastInteraction: Date;
    }> = new Map();

    for (const behavior of behaviors) {
      if (!behavior.content?.category) continue;

      const category = behavior.content.category;
      const behaviorWeight = BEHAVIOR_WEIGHTS[behavior.eventType] || 0.1;
      const timeWeight = this.calculateTimeWeight(behavior.timestamp);
      const score = behaviorWeight * timeWeight;

      // 如果是READ事件，根据停留时长和滚动深度调整权重
      let adjustedScore = score;
      if (behavior.eventType === BehaviorEventType.READ) {
        const durationBoost = this.calculateDurationBoost(behavior.duration);
        const scrollBoost = this.calculateScrollBoost(behavior.scrollDepth);
        adjustedScore = score * (1 + durationBoost + scrollBoost);
      }

      const existing = categoryScores.get(category) || {
        totalWeight: 0,
        count: 0,
        lastInteraction: behavior.timestamp,
      };

      categoryScores.set(category, {
        totalWeight: existing.totalWeight + adjustedScore,
        count: existing.count + 1,
        lastInteraction: behavior.timestamp > existing.lastInteraction 
          ? behavior.timestamp 
          : existing.lastInteraction,
      });
    }

    // 转换为PreferenceScore数组并归一化权重
    return this.normalizeScores(categoryScores);
  }

  /**
   * 分析信息源偏好
   */
  private async analyzeSourcePreferences(behaviors: any[]): Promise<PreferenceScore[]> {
    const sourceScores: Map<string, {
      totalWeight: number;
      count: number;
      lastInteraction: Date;
    }> = new Map();

    for (const behavior of behaviors) {
      if (!behavior.content?.source) continue;

      const sourceName = behavior.content.source.name;
      const behaviorWeight = BEHAVIOR_WEIGHTS[behavior.eventType] || 0.1;
      const timeWeight = this.calculateTimeWeight(behavior.timestamp);
      const score = behaviorWeight * timeWeight;

      const existing = sourceScores.get(sourceName) || {
        totalWeight: 0,
        count: 0,
        lastInteraction: behavior.timestamp,
      };

      sourceScores.set(sourceName, {
        totalWeight: existing.totalWeight + score,
        count: existing.count + 1,
        lastInteraction: behavior.timestamp > existing.lastInteraction 
          ? behavior.timestamp 
          : existing.lastInteraction,
      });
    }

    return this.normalizeScores(sourceScores);
  }

  /**
   * 分析话题偏好（从tags提取）
   */
  private async analyzeTopicPreferences(behaviors: any[]): Promise<PreferenceScore[]> {
    const topicScores: Map<string, {
      totalWeight: number;
      count: number;
      lastInteraction: Date;
    }> = new Map();

    for (const behavior of behaviors) {
      if (!behavior.content?.tags || behavior.content.tags.length === 0) continue;

      const tags = behavior.content.tags;
      const behaviorWeight = BEHAVIOR_WEIGHTS[behavior.eventType] || 0.1;
      const timeWeight = this.calculateTimeWeight(behavior.timestamp);
      const scorePerTag = (behaviorWeight * timeWeight) / tags.length; // 分散权重

      for (const tag of tags) {
        const existing = topicScores.get(tag) || {
          totalWeight: 0,
          count: 0,
          lastInteraction: behavior.timestamp,
        };

        topicScores.set(tag, {
          totalWeight: existing.totalWeight + scorePerTag,
          count: existing.count + 1,
          lastInteraction: behavior.timestamp > existing.lastInteraction 
            ? behavior.timestamp 
            : existing.lastInteraction,
        });
      }
    }

    return this.normalizeScores(topicScores);
  }

  /**
   * 分析公司偏好（从tags和title中提取常见公司名）
   */
  private async analyzeCompanyPreferences(behaviors: any[]): Promise<PreferenceScore[]> {
    const companyKeywords = [
      'OpenAI', 'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Facebook',
      'Tesla', 'NVIDIA', 'Nvidia', 'AMD', 'Intel', 'IBM', 'Oracle',
      'Anthropic', 'DeepMind', 'SpaceX', 'Twitter', 'X Corp',
    ];

    const companyScores: Map<string, {
      totalWeight: number;
      count: number;
      lastInteraction: Date;
    }> = new Map();

    for (const behavior of behaviors) {
      if (!behavior.content) continue;

      const tags = behavior.content.tags || [];
      const behaviorWeight = BEHAVIOR_WEIGHTS[behavior.eventType] || 0.1;
      const timeWeight = this.calculateTimeWeight(behavior.timestamp);
      const score = behaviorWeight * timeWeight;

      // 从tags中提取公司名
      const mentionedCompanies = tags.filter((tag: string) =>
        companyKeywords.some((company) =>
          tag.toLowerCase().includes(company.toLowerCase())
        )
      );

      for (const company of mentionedCompanies) {
        const existing = companyScores.get(company) || {
          totalWeight: 0,
          count: 0,
          lastInteraction: behavior.timestamp,
        };

        companyScores.set(company, {
          totalWeight: existing.totalWeight + score,
          count: existing.count + 1,
          lastInteraction: behavior.timestamp > existing.lastInteraction 
            ? behavior.timestamp 
            : existing.lastInteraction,
        });
      }
    }

    return this.normalizeScores(companyScores);
  }

  /**
   * 计算时间衰减权重
   */
  private calculateTimeWeight(timestamp: Date): number {
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= TIME_DECAY_DAYS.RECENT) {
      return 1.0; // 最近7天：权重1.0
    } else if (daysDiff <= TIME_DECAY_DAYS.MEDIUM) {
      return 0.7; // 30天内：权重0.7
    } else if (daysDiff <= TIME_DECAY_DAYS.OLD) {
      return 0.4; // 90天内：权重0.4
    } else {
      return 0.1; // 90天以上：权重0.1
    }
  }

  /**
   * 计算停留时长增益（READ事件）
   */
  private calculateDurationBoost(duration?: number): number {
    if (!duration) return 0;

    // 停留时长越长，增益越高（最高50%）
    if (duration >= 300) return 0.5;      // 5分钟以上
    if (duration >= 180) return 0.3;      // 3-5分钟
    if (duration >= 60) return 0.2;       // 1-3分钟
    if (duration >= 30) return 0.1;       // 30秒-1分钟
    return 0;
  }

  /**
   * 计算滚动深度增益（READ事件）
   */
  private calculateScrollBoost(scrollDepth?: number): number {
    if (!scrollDepth) return 0;

    // 滚动深度越大，增益越高（最高30%）
    if (scrollDepth >= 0.9) return 0.3;   // 90%以上
    if (scrollDepth >= 0.7) return 0.2;   // 70-90%
    if (scrollDepth >= 0.5) return 0.1;   // 50-70%
    return 0;
  }

  /**
   * 归一化分数并计算置信度
   */
  private normalizeScores(
    scoreMap: Map<string, { totalWeight: number; count: number; lastInteraction: Date }>
  ): PreferenceScore[] {
    if (scoreMap.size === 0) return [];

    // 找到最大权重用于归一化
    let maxWeight = 0;
    for (const data of scoreMap.values()) {
      if (data.totalWeight > maxWeight) {
        maxWeight = data.totalWeight;
      }
    }

    if (maxWeight === 0) return [];

    // 转换为PreferenceScore数组
    const scores: PreferenceScore[] = [];
    for (const [key, data] of scoreMap.entries()) {
      const normalizedWeight = data.totalWeight / maxWeight;
      
      // 置信度基于交互次数和权重
      // 交互次数越多，归一化权重越高，置信度越高
      const countFactor = Math.min(data.count / 10, 1); // 10次交互达到最高
      const weightFactor = normalizedWeight;
      const confidence = (countFactor * 0.6 + weightFactor * 0.4); // 组合计算

      scores.push({
        preferenceType: 'category', // 会在savePreferences中覆盖
        preferenceKey: key,
        weight: normalizedWeight,
        confidence,
        interactionCount: data.count,
        lastInteraction: data.lastInteraction,
      });
    }

    // 按权重排序
    return scores.sort((a, b) => b.weight - a.weight);
  }

  /**
   * 保存偏好到数据库
   */
  private async savePreferences(
    userId: string,
    preferenceType: 'category' | 'source' | 'topic' | 'company',
    preferences: PreferenceScore[]
  ): Promise<void> {
    // 只保存Top 20的偏好
    const topPreferences = preferences.slice(0, 20);

    for (const pref of topPreferences) {
      await prisma.implicitPreference.upsert({
        where: {
          userId_preferenceType_preferenceKey: {
            userId,
            preferenceType,
            preferenceKey: pref.preferenceKey,
          },
        },
        create: {
          userId,
          preferenceType,
          preferenceKey: pref.preferenceKey,
          weight: pref.weight,
          confidence: pref.confidence,
          interactionCount: pref.interactionCount,
          lastInteraction: pref.lastInteraction,
        },
        update: {
          weight: pref.weight,
          confidence: pref.confidence,
          interactionCount: pref.interactionCount,
          lastInteraction: pref.lastInteraction,
          updatedAt: new Date(),
        },
      });
    }

    console.log(`[ImplicitPreference] 保存了 ${topPreferences.length} 个 ${preferenceType} 偏好`);
  }

  /**
   * 获取用户的隐式偏好
   */
  async getUserImplicitPreferences(
    userId: string,
    preferenceType?: 'category' | 'source' | 'topic' | 'company'
  ): Promise<ImplicitPreference[]> {
    const where: any = { userId };
    
    if (preferenceType) {
      where.preferenceType = preferenceType;
    }

    return await prisma.implicitPreference.findMany({
      where,
      orderBy: [
        { weight: 'desc' },
        { confidence: 'desc' },
      ],
      take: 50, // 返回Top 50
    });
  }

  /**
   * 对比显式偏好和隐式偏好
   */
  async comparePreferences(userId: string): Promise<PreferenceComparison> {
    // 获取显式偏好（用户手动设置的）
    const explicitPreference = await prisma.userPreference.findUnique({
      where: { userId },
      include: {
        interests: {
          where: { isActive: true },
          orderBy: { weight: 'desc' },
          take: 10,
        },
        followedCompanies: {
          where: { isActive: true },
          orderBy: { weight: 'desc' },
          take: 10,
        },
        sourceWeights: {
          orderBy: { weight: 'desc' },
          take: 10,
          include: {
            source: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 获取隐式偏好（从行为中学习的）
    const implicitPreferences = await this.getUserImplicitPreferences(userId);

    // 整理数据
    const explicit = {
      categories: (explicitPreference?.interests || []).map((i) => ({
        key: i.name,
        weight: i.weight,
      })),
      companies: (explicitPreference?.followedCompanies || []).map((f) => ({
        key: f.name,
        weight: f.weight,
      })),
      sources: (explicitPreference?.sourceWeights || []).map((sw) => ({
        key: sw.source.name,
        weight: sw.weight,
      })),
    };

    const implicit = {
      categories: implicitPreferences
        .filter((p) => p.preferenceType === 'category')
        .slice(0, 10)
        .map((p) => ({
          key: p.preferenceKey,
          weight: p.weight,
          confidence: p.confidence,
        })),
      companies: implicitPreferences
        .filter((p) => p.preferenceType === 'company')
        .slice(0, 10)
        .map((p) => ({
          key: p.preferenceKey,
          weight: p.weight,
          confidence: p.confidence,
        })),
      sources: implicitPreferences
        .filter((p) => p.preferenceType === 'source')
        .slice(0, 10)
        .map((p) => ({
          key: p.preferenceKey,
          weight: p.weight,
          confidence: p.confidence,
        })),
    };

    // 生成洞察
    const insights: string[] = [];

    // 分析分类偏好差异
    const explicitCategoryKeys = new Set(explicit.categories.map((c) => c.key));
    const implicitCategoryKeys = new Set(implicit.categories.map((c) => c.key));
    
    const onlyInImplicit = implicit.categories.filter(
      (c) => !explicitCategoryKeys.has(c.key) && c.confidence > 0.7
    );
    
    if (onlyInImplicit.length > 0) {
      insights.push(
        `您实际上对 ${onlyInImplicit.map((c) => c.key).join('、')} 也很感兴趣，但未在设置中添加`
      );
    }

    // 分析公司偏好
    if (implicit.companies.length > 0 && explicit.companies.length === 0) {
      insights.push(
        `您可能对 ${implicit.companies.slice(0, 3).map((c) => c.key).join('、')} 等公司感兴趣`
      );
    }

    return { explicit, implicit, insights };
  }

  /**
   * 清除用户的隐式偏好数据
   */
  async clearUserImplicitPreferences(userId: string): Promise<{ deleted: number }> {
    const result = await prisma.implicitPreference.deleteMany({
      where: { userId },
    });

    return { deleted: result.count };
  }
}

// 导出服务实例
export const implicitPreferenceService = new ImplicitPreferenceService();

