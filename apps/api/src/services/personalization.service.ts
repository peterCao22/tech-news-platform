/**
 * Story 4.1: Personalization Engine Service
 * 个性化引擎服务
 * 
 * 功能：
 * - 基于用户偏好调整内容评分
 * - 生成个性化内容列表
 * - 生成个性化TOP10
 * - 评分解释和透明度
 */

import { prisma, ContentStatus } from '@tech-news-platform/database';
import type { Content, UserPreference } from '@tech-news-platform/database';
import { implicitPreferenceService } from './implicit-preference.service';

/**
 * 评分调整详情
 */
interface ScoreAdjustment {
  reason: string;
  adjustment: number;
  details?: string;
}

/**
 * 个性化内容结果
 */
interface PersonalizedContent extends Content {
  baseScore: number;
  personalizedScore: number;
  scoreAdjustments: ScoreAdjustment[];
}

/**
 * 个性化引擎服务
 */
export class PersonalizationService {
  
  /**
   * 应用个性化评分（整合显式和隐式偏好）
   */
  async applyPersonalization(
    contents: Content[],
    userId: string
  ): Promise<PersonalizedContent[]> {
    try {
      // 获取用户显式偏好
      const preference = await prisma.userPreference.findUnique({
        where: { userId },
        include: {
          interests: {
            where: { isActive: true }
          },
          followedCompanies: {
            where: { isActive: true }
          },
          sourceWeights: true
        }
      });

      // 获取用户隐式偏好
      const implicitPreferences = await implicitPreferenceService.getUserImplicitPreferences(userId);

      // 如果没有任何偏好，返回原始内容
      if (!preference && implicitPreferences.length === 0) {
        return contents.map(content => ({
          ...content,
          baseScore: content.score || 0,
          personalizedScore: content.score || 0,
          scoreAdjustments: []
        }));
      }

      // 对每个内容应用个性化
      const personalizedContents = await Promise.all(
        contents.map(async content => 
          await this.personalizeContent(content, preference, implicitPreferences)
        )
      );

      // 按个性化评分排序
      return personalizedContents.sort((a, b) => 
        b.personalizedScore - a.personalizedScore
      );
    } catch (error) {
      console.error('应用个性化失败:', error);
      throw new Error('应用个性化失败');
    }
  }

  /**
   * 对单个内容应用个性化（整合显式和隐式偏好）
   */
  private async personalizeContent(
    content: Content,
    preference: (UserPreference & {
      interests: any[];
      followedCompanies: any[];
      sourceWeights: any[];
    }) | null,
    implicitPreferences: any[]
  ): Promise<PersonalizedContent> {
    const baseScore = content.score || 0;
    let adjustedScore = baseScore;
    const adjustments: ScoreAdjustment[] = [];

    // 1. 显式兴趣匹配加权
    if (preference) {
      const interestBoost = this.calculateInterestBoost(content, preference.interests);
      if (interestBoost.adjustment !== 0) {
        adjustedScore += interestBoost.adjustment;
        adjustments.push(interestBoost);
      }

      // 2. 关注公司/股票加权
      const followingBoost = this.calculateFollowingBoost(content, preference.followedCompanies);
      if (followingBoost.adjustment !== 0) {
        adjustedScore += followingBoost.adjustment;
        adjustments.push(followingBoost);
      }

      // 3. 信息源权重加权
      const sourceBoost = this.calculateSourceWeightBoost(content, preference.sourceWeights);
      if (sourceBoost.adjustment !== 0) {
        adjustedScore += sourceBoost.adjustment;
        adjustments.push(sourceBoost);
      }
    }

    // 4. 隐式偏好加权（从用户行为中学习）
    const implicitBoost = this.calculateImplicitPreferenceBoost(content, implicitPreferences);
    if (implicitBoost.adjustment !== 0) {
      adjustedScore += implicitBoost.adjustment;
      adjustments.push(implicitBoost);
    }

    // 5. 内容类型偏好（可选扩展）
    // 如果内容有类型标签，可以根据用户的contentTypes偏好进行调整

    // 6. 时间衰减（可选，保持内容新鲜度）
    const timeFactor = this.calculateTimeFactor(content.publishedAt);
    if (timeFactor !== 1.0) {
      const timeAdjustment = adjustedScore * (timeFactor - 1.0);
      adjustedScore = adjustedScore * timeFactor;
      adjustments.push({
        reason: '时间新鲜度',
        adjustment: timeAdjustment,
        details: `新鲜度因子: ${timeFactor.toFixed(2)}`
      });
    }

    // 确保分数在合理范围内 (0-100)
    adjustedScore = Math.max(0, Math.min(100, adjustedScore));

    return {
      ...content,
      baseScore,
      personalizedScore: adjustedScore,
      scoreAdjustments: adjustments
    };
  }

  /**
   * 计算兴趣匹配加权
   */
  private calculateInterestBoost(
    content: Content,
    interests: Array<{ category: string; name: string; weight: number }>
  ): ScoreAdjustment {
    let totalBoost = 0;
    const matchedInterests: string[] = [];

    const searchText = `${content.title} ${content.description || ''}`.toLowerCase();

    for (const interest of interests) {
      const keyword = interest.name.toLowerCase();
      
      // 检查关键词是否在标题或描述中
      if (searchText.includes(keyword)) {
        // 基础加权 = 5分 * 用户设置的权重
        const boost = 5.0 * interest.weight;
        totalBoost += boost;
        matchedInterests.push(interest.name);
      }
    }

    if (matchedInterests.length > 0) {
      return {
        reason: '匹配兴趣领域',
        adjustment: totalBoost,
        details: `匹配: ${matchedInterests.join(', ')}`
      };
    }

    return { reason: '', adjustment: 0 };
  }

  /**
   * 计算关注公司/股票加权
   */
  private calculateFollowingBoost(
    content: Content,
    followings: Array<{ 
      followType: string; 
      name: string; 
      identifier: string | null; 
      weight: number 
    }>
  ): ScoreAdjustment {
    let totalBoost = 0;
    const matchedFollowings: string[] = [];

    const searchText = `${content.title} ${content.description || ''}`.toLowerCase();

    for (const following of followings) {
      const name = following.name.toLowerCase();
      const identifier = following.identifier?.toLowerCase() || '';

      // 检查公司名称或股票代码是否在内容中
      if (searchText.includes(name) || (identifier && searchText.includes(identifier))) {
        // 基础加权 = 8分 * 用户设置的权重
        const boost = 8.0 * following.weight;
        totalBoost += boost;
        matchedFollowings.push(following.name);
      }
    }

    if (matchedFollowings.length > 0) {
      return {
        reason: '关注的公司/股票',
        adjustment: totalBoost,
        details: `匹配: ${matchedFollowings.join(', ')}`
      };
    }

    return { reason: '', adjustment: 0 };
  }

  /**
   * 计算信息源权重加权
   */
  private calculateSourceWeightBoost(
    content: Content,
    sourceWeights: Array<{ sourceId: string; weight: number; reason?: string | null }>
  ): ScoreAdjustment {
    if (!content.sourceId) {
      return { reason: '', adjustment: 0 };
    }

    const sourceWeight = sourceWeights.find(sw => sw.sourceId === content.sourceId);

    if (sourceWeight && sourceWeight.weight !== 1.0) {
      // 权重调整 = 基础分 * (权重 - 1.0) * 0.2
      // 例如：权重1.5，基础分80，调整 = 80 * 0.5 * 0.2 = 8分
      const baseScore = content.score || 0;
      const adjustment = baseScore * (sourceWeight.weight - 1.0) * 0.2;

      return {
        reason: '信息源权重',
        adjustment,
        details: `权重: ${sourceWeight.weight.toFixed(1)}x${sourceWeight.reason ? ` (${sourceWeight.reason})` : ''}`
      };
    }

    return { reason: '', adjustment: 0 };
  }

  /**
   * 计算时间衰减因子
   * 保持内容的新鲜度，越新的内容权重越高
   */
  private calculateTimeFactor(publishedAt: Date | null): number {
    if (!publishedAt) {
      return 1.0;
    }

    const now = new Date();
    const ageInHours = (now.getTime() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);

    // 24小时内的内容，权重 1.0-1.1
    if (ageInHours < 24) {
      return 1.1 - (ageInHours / 24) * 0.1;
    }

    // 24-72小时的内容，权重 0.9-1.0
    if (ageInHours < 72) {
      return 1.0 - ((ageInHours - 24) / 48) * 0.1;
    }

    // 72-168小时(7天)的内容，权重 0.8-0.9
    if (ageInHours < 168) {
      return 0.9 - ((ageInHours - 72) / 96) * 0.1;
    }

    // 7天以上的内容，权重固定0.8
    return 0.8;
  }

  /**
   * 获取个性化内容列表
   */
  async getPersonalizedContent(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      category?: string;
      minScore?: number;
    }
  ): Promise<{
    items: PersonalizedContent[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      // 获取内容
      const where: any = {
        status: ContentStatus.PROCESSED,
        ...(options?.category && { category: options.category }),
        ...(options?.minScore && { score: { gte: options.minScore } })
      };

      const [contents, total] = await Promise.all([
        prisma.content.findMany({
          where,
          include: {
            source: {
              select: {
                id: true,
                name: true,
                type: true,
                url: true
              }
            }
          },
          take: limit * 2, // 取2倍数量，以便个性化后仍有足够内容
          orderBy: { publishedAt: 'desc' }
        }),
        prisma.content.count({ where })
      ]);

      // 应用个性化
      const personalizedContents = await this.applyPersonalization(contents, userId);

      // 分页
      const paginatedContents = personalizedContents.slice(skip, skip + limit);

      return {
        items: paginatedContents,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取个性化内容失败:', error);
      throw new Error('获取个性化内容失败');
    }
  }

  /**
   * 生成个性化TOP10
   */
  async generatePersonalizedTop10(
    userId: string,
    date?: Date
  ): Promise<PersonalizedContent[]> {
    try {
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`[个性化TOP10] 查询日期范围: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

      // 获取当天的高分内容
      let contents = await prisma.content.findMany({
        where: {
          status: ContentStatus.PROCESSED,
          publishedAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          score: {
            gte: 70 // 只考虑高分内容
          }
        },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              type: true,
              url: true
            }
          }
        },
        take: 50, // 取前50条高分内容
        orderBy: { score: 'desc' }
      });

      console.log(`[个性化TOP10] 查询到 ${contents.length} 条当天内容`);

      // 如果当天内容不足10条，扩展到最近3天
      if (contents.length < 10) {
        console.log(`[个性化TOP10] 当天内容不足，扩展到最近3天`);
        const threeDaysAgo = new Date(startOfDay);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        contents = await prisma.content.findMany({
          where: {
            status: ContentStatus.PROCESSED,
            publishedAt: {
              gte: threeDaysAgo,
              lte: endOfDay
            },
            score: {
              gte: 60 // 降低评分门槛
            }
          },
          include: {
            source: {
              select: {
                id: true,
                name: true,
                type: true,
                url: true
              }
            }
          },
          take: 50,
          orderBy: { score: 'desc' }
        });

        console.log(`[个性化TOP10] 扩展后查询到 ${contents.length} 条内容`);
      }

      if (contents.length === 0) {
        console.log(`[个性化TOP10] 没有找到任何内容`);
        return [];
      }

      // 应用个性化
      const personalizedContents = await this.applyPersonalization(contents, userId);

      console.log(`[个性化TOP10] 个性化处理后 ${personalizedContents.length} 条内容`);

      // 返回前10条，并确保多样性
      const top10 = this.ensureDiversity(personalizedContents, 10);

      console.log(`[个性化TOP10] 最终生成 ${top10.length} 条TOP10内容`);

      return top10;
    } catch (error) {
      console.error('[个性化TOP10] 生成失败:', error);
      throw error;
    }
  }

  /**
   * 确保TOP10的多样性
   * 避免过滤泡沫，确保不同类别和来源的内容
   */
  private ensureDiversity(
    contents: PersonalizedContent[],
    targetCount: number
  ): PersonalizedContent[] {
    const selected: PersonalizedContent[] = [];
    const sourceCount = new Map<string, number>();
    const categoryCount = new Map<string, number>();

    for (const content of contents) {
      if (selected.length >= targetCount) {
        break;
      }

      const sourceId = content.sourceId || 'unknown';
      const category = content.category || 'general';

      // 检查来源多样性（同一来源最多2条）
      const currentSourceCount = sourceCount.get(sourceId) || 0;
      if (currentSourceCount >= 2) {
        continue;
      }

      // 检查类别多样性（同一类别最多3条）
      const currentCategoryCount = categoryCount.get(category) || 0;
      if (currentCategoryCount >= 3) {
        continue;
      }

      // 添加到结果
      selected.push(content);
      sourceCount.set(sourceId, currentSourceCount + 1);
      categoryCount.set(category, currentCategoryCount + 1);
    }

    // 如果不够10条，补充剩余内容
    if (selected.length < targetCount) {
      for (const content of contents) {
        if (selected.length >= targetCount) {
          break;
        }
        if (!selected.includes(content)) {
          selected.push(content);
        }
      }
    }

    return selected;
  }

  /**
   * 计算隐式偏好加权
   * 基于用户行为自动学习的偏好
   */
  private calculateImplicitPreferenceBoost(
    content: Content,
    implicitPreferences: any[]
  ): ScoreAdjustment {
    if (implicitPreferences.length === 0) {
      return { reason: '隐式偏好', adjustment: 0 };
    }

    let totalBoost = 0;
    const matchedPreferences: string[] = [];

    // 提取内容的分类、来源、标签
    const contentCategory = content.category || '';
    const contentTags = content.tags || [];
    
    // 1. 匹配分类偏好
    const categoryPrefs = implicitPreferences.filter(p => p.preferenceType === 'category');
    for (const pref of categoryPrefs) {
      if (contentCategory === pref.preferenceKey) {
        // 隐式偏好的boost = weight * confidence * 5（最高5分）
        const boost = pref.weight * pref.confidence * 5;
        totalBoost += boost;
        matchedPreferences.push(`类别:${pref.preferenceKey}(+${boost.toFixed(1)})`);
      }
    }

    // 2. 匹配话题偏好（从tags匹配）
    const topicPrefs = implicitPreferences.filter(p => p.preferenceType === 'topic');
    for (const pref of topicPrefs) {
      if (contentTags.includes(pref.preferenceKey)) {
        const boost = pref.weight * pref.confidence * 3; // 话题boost最高3分
        totalBoost += boost;
        matchedPreferences.push(`话题:${pref.preferenceKey}(+${boost.toFixed(1)})`);
      }
    }

    // 3. 匹配公司偏好（从tags匹配）
    const companyPrefs = implicitPreferences.filter(p => p.preferenceType === 'company');
    for (const pref of companyPrefs) {
      const hasMatch = contentTags.some(tag => 
        tag.toLowerCase().includes(pref.preferenceKey.toLowerCase())
      );
      if (hasMatch) {
        const boost = pref.weight * pref.confidence * 8; // 公司boost最高8分
        totalBoost += boost;
        matchedPreferences.push(`公司:${pref.preferenceKey}(+${boost.toFixed(1)})`);
      }
    }

    // 4. 匹配信息源偏好（需要content包含source信息）
    // 这里暂时跳过，因为content类型中source可能是ID而不是name
    // 可以在applyPersonalization中提前加载source信息

    if (matchedPreferences.length === 0) {
      return { reason: '隐式偏好', adjustment: 0 };
    }

    return {
      reason: '隐式偏好匹配',
      adjustment: Math.min(totalBoost, 20), // 最多+20分
      details: matchedPreferences.join(', ')
    };
  }

  /**
   * 获取个性化推荐原因说明
   */
  getPersonalizationExplanation(content: PersonalizedContent): string {
    if (content.scoreAdjustments.length === 0) {
      return '基于内容基础评分推荐';
    }

    const reasons = content.scoreAdjustments
      .filter(adj => adj.adjustment > 0)
      .map(adj => {
        if (adj.details) {
          return `${adj.reason} (${adj.details})`;
        }
        return adj.reason;
      })
      .join(', ');

    return `推荐原因: ${reasons}`;
  }
}

// 导出服务实例
export const personalizationService = new PersonalizationService();

