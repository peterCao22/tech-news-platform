/**
 * Rule Engine Service
 * Story 3.2: Intelligent Filter Rules
 * 
 * 负责应用筛选规则到内容，计算加权后的评分
 */

import { prisma, RuleType, RuleStatus } from '@tech-news-platform/database';

interface RuleConfig {
  keywords?: string[];
  weight?: number;
  sources?: string[];
  sourceIds?: string[];
  categories?: string[];
  conditions?: {
    minScore?: number;
    maxScore?: number;
    titleOnly?: boolean;
    contentOnly?: boolean;
    caseSensitive?: boolean;
  };
}

interface ScoreAdjustment {
  ruleId: string;
  ruleName: string;
  ruleType: RuleType;
  originalScore: number;
  adjustment: number;
  newScore: number;
  reason: string;
}

interface ContentWithScore {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  category?: string | null;
  sourceId: string;
  score?: number | null;
  [key: string]: any;
}

export class RuleEngine {
  /**
   * 应用所有激活的规则到内容列表
   */
  async applyRules(contents: ContentWithScore[]): Promise<{
    contents: ContentWithScore[];
    adjustments: Map<string, ScoreAdjustment[]>;
  }> {
    // 获取所有激活的规则，按优先级排序
    const rules = await prisma.filterRule.findMany({
      where: {
        status: RuleStatus.ACTIVE,
        isPublished: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    if (rules.length === 0) {
      return {
        contents,
        adjustments: new Map(),
      };
    }

    // 记录每个内容的评分调整
    const adjustments = new Map<string, ScoreAdjustment[]>();

    // 处理后的内容
    const processedContents = contents.map(content => {
      let currentScore = content.score || 0;
      const contentAdjustments: ScoreAdjustment[] = [];

      // 依次应用每个规则
      for (const rule of rules) {
        const config = rule.config as RuleConfig;
        const originalScore = currentScore;

        // 检查黑名单（直接阻止）
        if (rule.ruleType === RuleType.SOURCE_BLACKLIST) {
          if (this.matchesBlacklist(content, config)) {
            currentScore = 0;
            contentAdjustments.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              originalScore,
              adjustment: -originalScore,
              newScore: 0,
              reason: `内容来源在黑名单中`,
            });
            break; // 黑名单直接阻止，不再应用其他规则
          }
        }

        // 应用关键词加权规则
        if (rule.ruleType === RuleType.KEYWORD_BOOST) {
          const boost = this.applyKeywordBoost(content, config);
          if (boost > 0) {
            currentScore += boost;
            contentAdjustments.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              originalScore,
              adjustment: boost,
              newScore: currentScore,
              reason: `匹配关键词加权规则`,
            });
          }
        }

        // 应用关键词降权规则
        if (rule.ruleType === RuleType.KEYWORD_PENALTY) {
          const penalty = this.applyKeywordPenalty(content, config);
          if (penalty < 0) {
            currentScore += penalty;
            contentAdjustments.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              originalScore,
              adjustment: penalty,
              newScore: currentScore,
              reason: `匹配关键词降权规则`,
            });
          }
        }

        // 应用来源白名单规则
        if (rule.ruleType === RuleType.SOURCE_WHITELIST) {
          const boost = this.applyWhitelistBoost(content, config);
          if (boost > 0) {
            currentScore += boost;
            contentAdjustments.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              originalScore,
              adjustment: boost,
              newScore: currentScore,
              reason: `来源在白名单中`,
            });
          }
        }

        // 应用分类加权规则
        if (rule.ruleType === RuleType.CATEGORY_BOOST) {
          const boost = this.applyCategoryBoost(content, config);
          if (boost > 0) {
            currentScore += boost;
            contentAdjustments.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              originalScore,
              adjustment: boost,
              newScore: currentScore,
              reason: `分类匹配加权规则`,
            });
          }
        }

        // 应用分类降权规则
        if (rule.ruleType === RuleType.CATEGORY_PENALTY) {
          const penalty = this.applyCategoryPenalty(content, config);
          if (penalty < 0) {
            currentScore += penalty;
            contentAdjustments.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              originalScore,
              adjustment: penalty,
              newScore: currentScore,
              reason: `分类匹配降权规则`,
            });
          }
        }

        // 应用自定义规则
        if (rule.ruleType === RuleType.CUSTOM) {
          const adjustment = this.applyCustomRule(content, config);
          if (adjustment !== 0) {
            currentScore += adjustment;
            contentAdjustments.push({
              ruleId: rule.id,
              ruleName: rule.name,
              ruleType: rule.ruleType,
              originalScore,
              adjustment,
              newScore: currentScore,
              reason: `自定义规则应用`,
            });
          }
        }
      }

      // 确保评分不为负数
      currentScore = Math.max(0, currentScore);

      // 记录此内容的所有调整
      if (contentAdjustments.length > 0) {
        adjustments.set(content.id, contentAdjustments);
      }

      return {
        ...content,
        score: currentScore,
      };
    });

    return {
      contents: processedContents,
      adjustments,
    };
  }

  /**
   * 检查内容是否匹配黑名单
   */
  private matchesBlacklist(content: ContentWithScore, config: RuleConfig): boolean {
    // 检查来源ID
    if (config.sourceIds && config.sourceIds.includes(content.sourceId)) {
      return true;
    }

    // 检查来源名称（需要从数据库获取，这里简化处理）
    // 实际应用中可以在内容对象中包含source信息

    return false;
  }

  /**
   * 应用关键词加权
   */
  private applyKeywordBoost(content: ContentWithScore, config: RuleConfig): number {
    if (!config.keywords || config.keywords.length === 0) {
      return 0;
    }

    const weight = config.weight || 1.0;
    const conditions = config.conditions || {};
    const caseSensitive = conditions.caseSensitive || false;

    const text = this.getSearchableText(content, conditions);
    const searchText = caseSensitive ? text : text.toLowerCase();

    let matchCount = 0;
    for (const keyword of config.keywords) {
      const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
      if (searchText.includes(searchKeyword)) {
        matchCount++;
      }
    }

    if (matchCount === 0) {
      return 0;
    }

    // 基础加权：匹配数量 * 权重
    const baseBoost = matchCount * weight;

    // 如果有最小分数限制，只对符合条件的内容加权
    if (conditions.minScore && content.score && content.score < conditions.minScore) {
      return 0;
    }

    return baseBoost;
  }

  /**
   * 应用关键词降权
   */
  private applyKeywordPenalty(content: ContentWithScore, config: RuleConfig): number {
    if (!config.keywords || config.keywords.length === 0) {
      return 0;
    }

    const weight = config.weight || 1.0;
    const conditions = config.conditions || {};
    const caseSensitive = conditions.caseSensitive || false;

    const text = this.getSearchableText(content, conditions);
    const searchText = caseSensitive ? text : text.toLowerCase();

    let matchCount = 0;
    for (const keyword of config.keywords) {
      const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
      if (searchText.includes(searchKeyword)) {
        matchCount++;
      }
    }

    if (matchCount === 0) {
      return 0;
    }

    // 基础降权：匹配数量 * 权重（负值）
    return -matchCount * weight;
  }

  /**
   * 应用白名单加权
   */
  private applyWhitelistBoost(content: ContentWithScore, config: RuleConfig): number {
    // 检查来源ID是否在白名单中
    if (config.sourceIds && config.sourceIds.includes(content.sourceId)) {
      return config.weight || 1.0;
    }

    return 0;
  }

  /**
   * 应用分类加权
   */
  private applyCategoryBoost(content: ContentWithScore, config: RuleConfig): number {
    if (!config.categories || config.categories.length === 0) {
      return 0;
    }

    if (content.category && config.categories.includes(content.category)) {
      return config.weight || 1.0;
    }

    return 0;
  }

  /**
   * 应用分类降权
   */
  private applyCategoryPenalty(content: ContentWithScore, config: RuleConfig): number {
    if (!config.categories || config.categories.length === 0) {
      return 0;
    }

    if (content.category && config.categories.includes(content.category)) {
      return -(config.weight || 1.0);
    }

    return 0;
  }

  /**
   * 应用自定义规则（扩展点）
   */
  private applyCustomRule(content: ContentWithScore, config: RuleConfig): number {
    // 自定义规则的实现，可以根据具体需求扩展
    // 这里只是一个示例框架
    return 0;
  }

  /**
   * 获取可搜索的文本
   */
  private getSearchableText(content: ContentWithScore, conditions: any): string {
    if (conditions.titleOnly) {
      return content.title || '';
    }

    if (conditions.contentOnly) {
      return content.content || '';
    }

    // 默认搜索标题、描述和内容
    return [
      content.title || '',
      content.description || '',
      content.content || '',
    ].join(' ');
  }

  /**
   * 测试规则对特定内容的影响
   */
  async testRule(
    ruleConfig: RuleConfig,
    ruleType: RuleType,
    contentIds?: string[],
    limit: number = 50
  ): Promise<{
    totalTested: number;
    affected: number;
    results: Array<{
      contentId: string;
      title: string;
      originalScore: number;
      newScore: number;
      scoreDelta: number;
      reason: string;
    }>;
  }> {
    // 获取测试内容
    const whereClause: any = {};
    if (contentIds && contentIds.length > 0) {
      whereClause.id = { in: contentIds };
    }

    const contents = await prisma.content.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        category: true,
        sourceId: true,
        score: true,
      },
    });

    const results: Array<{
      contentId: string;
      title: string;
      originalScore: number;
      newScore: number;
      scoreDelta: number;
      reason: string;
    }> = [];

    let affectedCount = 0;

    for (const content of contents) {
      const originalScore = content.score || 0;
      let newScore = originalScore;
      let reason = '';

      // 根据规则类型应用测试
      switch (ruleType) {
        case RuleType.KEYWORD_BOOST:
          const boost = this.applyKeywordBoost(content as any, ruleConfig);
          newScore += boost;
          reason = boost > 0 ? `关键词加权 +${boost.toFixed(2)}` : '无匹配';
          break;

        case RuleType.KEYWORD_PENALTY:
          const penalty = this.applyKeywordPenalty(content as any, ruleConfig);
          newScore += penalty;
          reason = penalty < 0 ? `关键词降权 ${penalty.toFixed(2)}` : '无匹配';
          break;

        case RuleType.SOURCE_WHITELIST:
          const whitelistBoost = this.applyWhitelistBoost(content as any, ruleConfig);
          newScore += whitelistBoost;
          reason = whitelistBoost > 0 ? `白名单加权 +${whitelistBoost.toFixed(2)}` : '不在白名单';
          break;

        case RuleType.SOURCE_BLACKLIST:
          const isBlacklisted = this.matchesBlacklist(content as any, ruleConfig);
          if (isBlacklisted) {
            newScore = 0;
            reason = '黑名单阻止';
          } else {
            reason = '不在黑名单';
          }
          break;

        case RuleType.CATEGORY_BOOST:
          const categoryBoost = this.applyCategoryBoost(content as any, ruleConfig);
          newScore += categoryBoost;
          reason = categoryBoost > 0 ? `分类加权 +${categoryBoost.toFixed(2)}` : '分类不匹配';
          break;

        case RuleType.CATEGORY_PENALTY:
          const categoryPenalty = this.applyCategoryPenalty(content as any, ruleConfig);
          newScore += categoryPenalty;
          reason = categoryPenalty < 0 ? `分类降权 ${categoryPenalty.toFixed(2)}` : '分类不匹配';
          break;
      }

      newScore = Math.max(0, newScore);
      const scoreDelta = newScore - originalScore;

      if (scoreDelta !== 0) {
        affectedCount++;
      }

      results.push({
        contentId: content.id,
        title: content.title,
        originalScore,
        newScore,
        scoreDelta,
        reason,
      });
    }

    return {
      totalTested: contents.length,
      affected: affectedCount,
      results,
    };
  }

  /**
   * 从数据库获取激活的白名单来源
   */
  async getActiveWhitelistSources(): Promise<string[]> {
    const whitelistItems = await prisma.sourceList.findMany({
      where: {
        listType: 'WHITELIST',
        isActive: true,
      },
      select: {
        sourceId: true,
      },
    });

    return whitelistItems
      .map(item => item.sourceId)
      .filter((id): id is string => id !== null);
  }

  /**
   * 从数据库获取激活的黑名单来源
   */
  async getActiveBlacklistSources(): Promise<string[]> {
    const blacklistItems = await prisma.sourceList.findMany({
      where: {
        listType: 'BLACKLIST',
        isActive: true,
      },
      select: {
        sourceId: true,
      },
    });

    return blacklistItems
      .map(item => item.sourceId)
      .filter((id): id is string => id !== null);
  }
}

export const ruleEngine = new RuleEngine();

