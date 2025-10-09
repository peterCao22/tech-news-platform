/**
 * 内容评分与排序服务
 * Story 2.5: 内容评分与排序算法
 */

import { db } from '@tech-news-platform/database';
import { logger } from '../utils/logger';

/**
 * 评分维度接口
 */
export interface ScoreDimensions {
  timeliness: number;      // 时效性 0-100
  authority: number;       // 权威性 0-100
  quality: number;         // 质量 0-100
  relevance: number;       // 相关性 0-100
  aiImportance: number;    // AI评分 0-100
  engagement: number;      // 用户行为 0-100
}

/**
 * 综合评分结果
 */
export interface ContentScore extends ScoreDimensions {
  totalScore: number;      // 综合评分 0-100
  explanation: string;     // 评分解释
}

/**
 * 内容评分结果（包含数据库字段）
 */
export interface ContentScoreResult {
  contentId: string;
  totalScore: number;
  scores: ScoreDimensions;
  explanation?: string;
  calculatedAt: Date;
}

/**
 * 评分权重配置
 */
export interface ScoringWeights {
  timeliness: number;
  authority: number;
  quality: number;
  relevance: number;
  aiImportance: number;
  engagement: number;
}

/**
 * 内容元数据
 */
export interface ContentMetadata {
  id: string;
  title: string;
  content?: string;
  description?: string;
  sourceUrl?: string;
  publishedAt?: Date;
  createdAt: Date;
  source?: {
    name: string;
    url?: string;
  };
  metadata?: any;
  category?: string;
  tags?: string[];
  author?: string;
  // AI分析结果
  claudeAnalysis?: {
    importance?: number;  // 1-10
    sentiment?: string;
  };
  // 用户行为数据
  viewCount?: number;
  shareCount?: number;
  bookmarkCount?: number;
}

/**
 * 来源权威性评级（6个等级）
 */
class SourceAuthorityRater {
  // Tier 1: 顶级权威机构 (95-100分)
  private tier1Sources: Record<string, number> = {
    // 学术机构
    'mit.edu': 100,
    'stanford.edu': 100,
    'berkeley.edu': 98,
    'arxiv.org': 97,
    'nature.com': 95,
    'science.org': 95,
    
    // 金融权威
    'bloomberg.com': 99,
    'reuters.com': 98,
    'wsj.com': 98,
    'ft.com': 97,
    
    // 科技巨头官方
    'openai.com': 98,
    'google.ai': 98,
    'blog.google': 97,
    'microsoft.com': 97,
    'nvidia.com': 96,
    'anthropic.com': 96
  };

  // Tier 2: 知名科技媒体 (85-94分)
  private tier2Sources: Record<string, number> = {
    'techcrunch.com': 92,
    'wired.com': 91,
    'arstechnica.com': 90,
    'theverge.com': 89,
    'technologyreview.com': 94,
    'venturebeat.com': 88,
    'zdnet.com': 87,
    'cnet.com': 86
  };

  // Tier 3: 专业科技博客与社区 (75-84分)
  private tier3Sources: Record<string, number> = {
    'news.ycombinator.com': 83,
    'medium.com': 78,
    'techmeme.com': 82,
    'slashdot.org': 80,
    'reddit.com': 76,
    'github.blog': 81,
    'stackoverflow.blog': 80
  };

  // Tier 4: AI专题简报 (80-90分)
  private tier4Sources: Record<string, number> = {
    'bensbites.co': 85,
    'therundown.ai': 84,
    'tldr.tech': 83,
    'importai.com': 86,
    'substack.com': 82  // TheSequence等
  };

  // Tier 5: 金融数据提供商 (85-95分)
  private tier5Sources: Record<string, number> = {
    'polygon.io': 88,
    'finnhub.io': 87,
    'alphavantage.co': 86,
    'finance.yahoo.com': 85,
    'marketwatch.com': 86,
    'seekingalpha.com': 84
  };

  // Tier 6: 一般来源 (60-74分)
  private tier6Sources: Record<string, number> = {
    'news.google.com': 70,
    'twitter.com': 65,
    'linkedin.com': 68
  };

  /**
   * 从URL提取域名
   */
  private extractDomain(url?: string): string {
    if (!url) return 'unknown';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * 获取来源权威性评分
   */
  getScore(sourceUrl?: string, sourceName?: string): number {
    const domain = this.extractDomain(sourceUrl || sourceName);

    // 按优先级查找
    const score = this.tier1Sources[domain] ||
                  this.tier2Sources[domain] ||
                  this.tier3Sources[domain] ||
                  this.tier4Sources[domain] ||
                  this.tier5Sources[domain] ||
                  this.tier6Sources[domain] ||
                  50; // 默认分数

    logger.debug('来源权威性评分', { domain, score });
    return score;
  }

  /**
   * 应用权威性加成
   */
  applyBonus(baseScore: number, metadata?: any): number {
    let bonus = 0;

    // 如果是原创内容 +5
    if (metadata?.isOriginal) bonus += 5;

    // 如果有作者认证 +3
    if (metadata?.authorVerified) bonus += 3;

    // 如果引用了学术论文 +5
    if (metadata?.hasCitations) bonus += 5;

    return Math.min(100, baseScore + bonus);
  }
}

/**
 * 内容评分服务
 */
export class ContentScoringService {
  private defaultWeights: ScoringWeights = {
    timeliness: 0.20,
    authority: 0.25,
    quality: 0.20,
    relevance: 0.15,
    aiImportance: 0.15,
    engagement: 0.05
  };

  private sourceRater = new SourceAuthorityRater();

  /**
   * 计算综合评分
   */
  async calculateScore(
    content: ContentMetadata,
    weights?: Partial<ScoringWeights>
  ): Promise<ContentScore> {
    const finalWeights = { ...this.defaultWeights, ...weights };

    // 计算各维度评分
    const dimensions: ScoreDimensions = {
      timeliness: this.calculateTimelinessScore(content),
      authority: this.calculateAuthorityScore(content),
      quality: this.calculateQualityScore(content),
      relevance: this.calculateRelevanceScore(content),
      aiImportance: this.calculateAIImportanceScore(content),
      engagement: this.calculateEngagementScore(content)
    };

    // 应用权重计算总分
    const totalScore = 
      dimensions.timeliness * finalWeights.timeliness +
      dimensions.authority * finalWeights.authority +
      dimensions.quality * finalWeights.quality +
      dimensions.relevance * finalWeights.relevance +
      dimensions.aiImportance * finalWeights.aiImportance +
      dimensions.engagement * finalWeights.engagement;

    // 生成评分解释
    const explanation = this.generateExplanation(dimensions, finalWeights);

    logger.info('内容评分完成', {
      contentId: content.id,
      totalScore: totalScore.toFixed(2),
      dimensions
    });

    return {
      ...dimensions,
      totalScore: Math.round(totalScore * 100) / 100,
      explanation
    };
  }

  /**
   * 批量计算评分
   */
  async batchCalculateScore(
    contents: ContentMetadata[],
    weights?: Partial<ScoringWeights>
  ): Promise<Map<string, ContentScore>> {
    const results = new Map<string, ContentScore>();

    for (const content of contents) {
      const score = await this.calculateScore(content, weights);
      results.set(content.id, score);
    }

    logger.info('批量评分完成', { count: contents.length });
    return results;
  }

  /**
   * 计算时效性评分（指数衰减）
   */
  private calculateTimelinessScore(content: ContentMetadata): number {
    const publishDate = content.publishedAt || content.createdAt;
    const now = new Date();
    const hoursAge = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);

    // 使用指数衰减函数
    // λ = 0.01 (衰减系数)
    const lambda = 0.01;
    const score = 100 * Math.exp(-lambda * hoursAge);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算来源权威性评分
   */
  private calculateAuthorityScore(content: ContentMetadata): number {
    const baseScore = this.sourceRater.getScore(
      content.sourceUrl || content.source?.url,
      content.source?.name
    );

    return this.sourceRater.applyBonus(baseScore, content.metadata);
  }

  /**
   * 计算内容质量评分
   */
  private calculateQualityScore(content: ContentMetadata): number {
    let score = 0;

    // 1. 标题质量 (20%)
    const titleScore = this.evaluateTitleQuality(content.title);
    score += titleScore * 0.2;

    // 2. 内容长度 (20%)
    const contentText = content.content || content.description || '';
    const lengthScore = this.evaluateContentLength(contentText);
    score += lengthScore * 0.2;

    // 3. 可读性 (20%)
    const readabilityScore = this.evaluateReadability(contentText);
    score += readabilityScore * 0.2;

    // 4. 媒体存在 (20%)
    const mediaScore = content.metadata?.hasImage ? 100 : 50;
    score += mediaScore * 0.2;

    // 5. 结构质量 (20%)
    const structureScore = this.evaluateStructure(content);
    score += structureScore * 0.2;

    return Math.round(score);
  }

  /**
   * 计算相关性评分
   */
  private calculateRelevanceScore(content: ContentMetadata): number {
    let score = 0;

    // 1. 分类匹配 (40%)
    const categoryScore = this.evaluateCategoryRelevance(content.category);
    score += categoryScore * 0.4;

    // 2. 关键词匹配 (40%)
    const keywordScore = this.evaluateKeywordRelevance(content);
    score += keywordScore * 0.4;

    // 3. 标签匹配 (20%)
    const tagScore = this.evaluateTagRelevance(content.tags);
    score += tagScore * 0.2;

    return Math.round(score);
  }

  /**
   * 计算AI重要性评分
   */
  private calculateAIImportanceScore(content: ContentMetadata): number {
    if (!content.claudeAnalysis?.importance) {
      return 50; // 默认中等重要性
    }

    // Claude返回1-10分，转换为0-100
    return content.claudeAnalysis.importance * 10;
  }

  /**
   * 计算用户行为评分
   */
  private calculateEngagementScore(content: ContentMetadata): number {
    const viewCount = content.viewCount || 0;
    const shareCount = content.shareCount || 0;
    const bookmarkCount = content.bookmarkCount || 0;

    // 简单的归一化处理
    const maxView = 1000;
    const maxShare = 100;
    const maxBookmark = 50;

    const normalizedView = Math.min(viewCount / maxView, 1);
    const normalizedShare = Math.min(shareCount / maxShare, 1);
    const normalizedBookmark = Math.min(bookmarkCount / maxBookmark, 1);

    const score = (
      normalizedView * 0.3 +
      normalizedShare * 0.4 +
      normalizedBookmark * 0.3
    ) * 100;

    return Math.round(score);
  }

  /**
   * 评估标题质量
   */
  private evaluateTitleQuality(title: string): number {
    let score = 50; // 基础分

    // 长度适中 (30-100字符)
    if (title.length >= 30 && title.length <= 100) score += 20;
    else if (title.length < 15 || title.length > 150) score -= 20;

    // 包含数字或关键词
    if (/\d+/.test(title)) score += 10;
    if (/AI|artificial intelligence|machine learning|deep learning/i.test(title)) score += 10;

    // 避免全大写或过多标点
    if (title === title.toUpperCase()) score -= 20;
    if ((title.match(/[!?]/g) || []).length > 2) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 评估内容长度
   */
  private evaluateContentLength(content: string): number {
    const length = content.length;

    // 理想长度：500-2000字符
    if (length >= 500 && length <= 2000) return 100;
    if (length >= 300 && length < 500) return 80;
    if (length > 2000 && length <= 5000) return 80;
    if (length < 300) return 50;
    return 60;
  }

  /**
   * 评估可读性
   */
  private evaluateReadability(content: string): number {
    if (!content) return 50;

    // 简单的可读性指标
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;

    // 理想：每句10-20个词
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) return 100;
    if (avgWordsPerSentence >= 8 && avgWordsPerSentence < 25) return 80;
    return 60;
  }

  /**
   * 评估结构质量
   */
  private evaluateStructure(content: ContentMetadata): number {
    let score = 50;

    // 有作者信息 +20
    if (content.author) score += 20;

    // 有分类 +15
    if (content.category) score += 15;

    // 有标签 +15
    if (content.tags && content.tags.length > 0) score += 15;

    return Math.min(100, score);
  }

  /**
   * 评估分类相关性
   */
  private evaluateCategoryRelevance(category?: string): number {
    if (!category) return 50;

    // 高相关性分类
    const highRelevance = ['AI', 'Technology', 'Stock', 'Investment'];
    if (highRelevance.some(c => category.toLowerCase().includes(c.toLowerCase()))) {
      return 100;
    }

    // 中等相关性
    return 70;
  }

  /**
   * 评估关键词相关性
   */
  private evaluateKeywordRelevance(content: ContentMetadata): number {
    const text = `${content.title} ${content.description || ''} ${content.content || ''}`.toLowerCase();

    const keywords = [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning',
      'openai', 'anthropic', 'google', 'microsoft', 'nvidia',
      'stock', 'investment', 'market', 'ipo', 'funding'
    ];

    const matchCount = keywords.filter(kw => text.includes(kw)).length;
    const score = (matchCount / keywords.length) * 100;

    return Math.round(score);
  }

  /**
   * 评估标签相关性
   */
  private evaluateTagRelevance(tags?: string[]): number {
    if (!tags || tags.length === 0) return 50;

    const relevantTags = ['AI', 'Technology', 'Stock', 'Finance', 'Innovation'];
    const matchCount = tags.filter(tag => 
      relevantTags.some(rt => tag.toLowerCase().includes(rt.toLowerCase()))
    ).length;

    return Math.min(100, 50 + (matchCount / relevantTags.length) * 50);
  }

  /**
   * 生成评分解释
   */
  private generateExplanation(
    dimensions: ScoreDimensions,
    weights: ScoringWeights
  ): string {
    const parts: string[] = [];

    // 找出最高和最低的维度
    const entries = Object.entries(dimensions) as [keyof ScoreDimensions, number][];
    const sorted = entries.sort((a, b) => b[1] - a[1]);

    const dimensionNames: Record<keyof ScoreDimensions, string> = {
      timeliness: '时效性',
      authority: '来源权威性',
      quality: '内容质量',
      relevance: '相关性',
      aiImportance: 'AI重要性',
      engagement: '用户行为'
    };

    parts.push(`最强项：${dimensionNames[sorted[0][0]]}(${sorted[0][1].toFixed(1)}分)`);
    parts.push(`次强项：${dimensionNames[sorted[1][0]]}(${sorted[1][1].toFixed(1)}分)`);

    // 权重说明
    const highestWeight = Object.entries(weights).sort((a, b) => b[1] - a[1])[0];
    parts.push(`主要权重：${dimensionNames[highestWeight[0] as keyof ScoreDimensions]}(${(highestWeight[1] * 100).toFixed(0)}%)`);

    return parts.join(' | ');
  }

  /**
   * 个性化评分
   */
  async personalizeScore(
    baseScore: ContentScore,
    content: ContentMetadata,
    userPreferences?: any
  ): Promise<number> {
    if (!userPreferences) return baseScore.totalScore;

    let bonus = 0;

    // 用户关注的分类 +10%
    if (userPreferences.categories?.includes(content.category)) {
      bonus += 0.1;
    }

    // 用户关注的公司 +15%
    const contentText = `${content.title} ${content.description || ''}`.toLowerCase();
    if (userPreferences.companies?.some((c: string) => contentText.includes(c.toLowerCase()))) {
      bonus += 0.15;
    }

    // 用户偏好的来源 +10%
    if (userPreferences.sources?.includes(content.source?.name)) {
      bonus += 0.1;
    }

    const personalizedScore = baseScore.totalScore * (1 + bonus);
    return Math.min(100, personalizedScore);
  }

  /**
   * 公共API：计算单个内容评分
   */
  async scoreContent(contentId: string, forceRecalculate: boolean = false): Promise<ContentScoreResult> {
    const content = await db.content.findUnique({
      where: { id: contentId },
      include: { source: true }
    });

    if (!content) {
      throw new Error(`内容不存在: ${contentId}`);
    }

    // 检查是否已有评分且不强制重算
    if (!forceRecalculate) {
      const existingScore = await db.contentScore.findUnique({
        where: { contentId }
      });
      if (existingScore) {
        return {
          contentId,
          totalScore: existingScore.totalScore,
          scores: {
            timeliness: existingScore.timelinessScore,
            authority: existingScore.authorityScore,
            quality: existingScore.qualityScore,
            relevance: existingScore.relevanceScore,
            aiImportance: existingScore.aiImportanceScore,
            engagement: existingScore.engagementScore
          },
          explanation: existingScore.explanation || undefined,
          calculatedAt: existingScore.calculatedAt
        };
      }
    }

    // 计算新评分
    const score = await this.calculateScore(content as any);

    // 保存到数据库
    const saved = await db.contentScore.upsert({
      where: { contentId },
      create: {
        contentId,
        totalScore: score.totalScore,
        timelinessScore: score.timeliness,
        authorityScore: score.authority,
        qualityScore: score.quality,
        relevanceScore: score.relevance,
        aiImportanceScore: score.aiImportance,
        engagementScore: score.engagement,
        explanation: score.explanation
      },
      update: {
        totalScore: score.totalScore,
        timelinessScore: score.timeliness,
        authorityScore: score.authority,
        qualityScore: score.quality,
        relevanceScore: score.relevance,
        aiImportanceScore: score.aiImportance,
        engagementScore: score.engagement,
        explanation: score.explanation,
        calculatedAt: new Date()
      }
    });

    return {
      contentId,
      totalScore: score.totalScore,
      scores: {
        timeliness: score.timeliness,
        authority: score.authority,
        quality: score.quality,
        relevance: score.relevance,
        aiImportance: score.aiImportance,
        engagement: score.engagement
      },
      explanation: score.explanation,
      calculatedAt: saved.calculatedAt
    };
  }

  /**
   * 公共API：批量计算内容评分
   */
  async batchScoreContent(contentIds: string[], forceRecalculate: boolean = false): Promise<ContentScoreResult[]> {
    const results: ContentScoreResult[] = [];

    for (const contentId of contentIds) {
      try {
        const score = await this.scoreContent(contentId, forceRecalculate);
        results.push(score);
      } catch (error: any) {
        logger.error('批量评分失败', { contentId, error: error.message });
      }
    }

    return results;
  }

  /**
   * 公共API：获取排序后的内容列表
   */
  async getRankedContent(
    limit: number = 20,
    offset: number = 0,
    filters?: {
      minScore?: number;
      category?: string;
      tags?: string[];
      publishedAfter?: Date;
    },
    sortBy: 'totalScore' | 'timeliness' | 'authority' | 'quality' = 'totalScore'
  ): Promise<{
    content: Array<any>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.publishedAfter) {
      where.publishedAt = { gte: filters.publishedAfter };
    }

    // 只包含已评分的内容
    where.contentScore = { isNot: null };

    if (filters?.minScore) {
      where.contentScore = {
        ...where.contentScore,
        totalScore: { gte: filters.minScore }
      };
    }

    // 获取总数
    const total = await db.content.count({ where });

    // 获取内容
    const orderByField = sortBy === 'totalScore' ? 'totalScore' :
                        sortBy === 'timeliness' ? 'timelinessScore' :
                        sortBy === 'authority' ? 'authorityScore' : 'qualityScore';

    const content = await db.content.findMany({
      where,
      include: {
        source: true
      },
      orderBy: {
        score: 'desc'  // 使用 Content 表中的 score 字段
      },
      take: limit,
      skip: offset
    });

    // 手动关联评分数据
    const contentIds = content.map(c => c.id);
    const scores = await db.contentScore.findMany({
      where: { contentId: { in: contentIds } }
    });
    
    const scoreMap = new Map(scores.map(s => [s.contentId, s]));
    const enrichedContent = content.map(c => ({
      ...c,
      contentScore: scoreMap.get(c.id) || null
    }));

    return {
      content: enrichedContent,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 公共API：获取内容评分
   */
  async getContentScore(contentId: string): Promise<ContentScoreResult | null> {
    const score = await db.contentScore.findUnique({
      where: { contentId }
    });

    if (!score) {
      return null;
    }

    return {
      contentId,
      totalScore: score.totalScore,
      scores: {
        timeliness: score.timelinessScore,
        authority: score.authorityScore,
        quality: score.qualityScore,
        relevance: score.relevanceScore,
        aiImportance: score.aiImportanceScore,
        engagement: score.engagementScore
      },
      explanation: score.explanation || undefined,
      calculatedAt: score.calculatedAt
    };
  }

  /**
   * 公共API：重新计算所有内容评分
   */
  async recalculateAllScores(batchSize: number = 100): Promise<void> {
    logger.info('开始重新计算所有内容评分', { batchSize });

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const content = await db.content.findMany({
        where: {
          status: { notIn: ['ARCHIVED', 'REJECTED'] }
        },
        include: { source: true },
        take: batchSize,
        skip: offset
      });

      if (content.length === 0) {
        hasMore = false;
        break;
      }

      // 批量计算评分
      for (const item of content) {
        try {
          await this.scoreContent(item.id, true);
        } catch (error: any) {
          logger.error('重新计算评分失败', { contentId: item.id, error: error.message });
        }
      }

      offset += batchSize;
      logger.info('批量评分进度', { processed: offset });
    }

    logger.info('所有内容评分重新计算完成');
  }
}

// 导出单例
export const contentScoringService = new ContentScoringService();

