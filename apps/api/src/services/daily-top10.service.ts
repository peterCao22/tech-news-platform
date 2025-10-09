/**
 * 每日TOP10生成服务
 * Story 2.6: 每日TOP10自动生成
 */

import { db } from '@tech-news-platform/database';
import { logger } from '../utils/logger';
import { contentScoringService } from './content-scoring.service';
import { contentDeduplicationService } from './content-deduplication.service';

/**
 * TOP10候选内容
 */
interface Top10Candidate {
  id: string;
  title: string;
  description?: string;
  content?: string;
  sourceId: string;
  source?: {
    name: string;
  };
  category?: string;
  publishedAt?: Date;
  createdAt: Date;
  score: number;
  scoreBreakdown: {
    timeliness: number;
    authority: number;
    quality: number;
    relevance: number;
    aiImportance: number;
    engagement: number;
  };
  explanation?: string;
}

/**
 * 分类配额配置
 */
interface CategoryQuotas {
  [category: string]: {
    min: number;
    max: number;
  };
}

/**
 * TOP10统计信息
 */
interface Top10Stats {
  totalCandidates: number;
  selectedCount: number;
  categoryDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  averageScore: number;
  scoreRange: { min: number; max: number };
}

/**
 * 每日TOP10生成服务
 */
export class DailyTop10Service {
  // 默认分类配额
  private defaultCategoryQuotas: CategoryQuotas = {
    'AI': { min: 3, max: 4 },
    'Technology': { min: 3, max: 4 },
    'Stock': { min: 2, max: 3 }
  };

  // 单一来源限制
  private readonly sourceLimit = 3;

  // 最小评分阈值
  private readonly minScoreThreshold = 50;

  /**
   * 生成每日TOP10
   */
  async generateDailyTop10(
    date: Date = new Date(),
    forceRegenerate: boolean = false
  ): Promise<any> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    logger.info('开始生成每日TOP10', { date: startDate });

    try {
      // 检查是否已存在
      if (!forceRegenerate) {
        const existing = await db.dailyTop10.findUnique({
          where: { date: startDate },
          include: {
            items: {
              include: {
                content: {
                  include: { source: true }
                }
              },
              orderBy: { position: 'asc' }
            }
          }
        });

        if (existing) {
          logger.info('TOP10已存在，返回现有数据', { top10Id: existing.id });
          return existing;
        }
      }

      const generationStart = Date.now();

      // 步骤1: 获取候选内容
      const candidates = await this.getCandidateContent(startDate, endDate);
      logger.info('获取候选内容', { count: candidates.length });

      if (candidates.length === 0) {
        throw new Error('没有足够的候选内容');
      }

      // 步骤2: 应用评分排序
      const scored = await this.scoreAndRankCandidates(candidates);
      logger.info('内容评分完成', { scored: scored.length });

      // 步骤3: 确保多样性
      const diversified = await this.ensureDiversity(scored);
      logger.info('多样性检查完成', { selected: diversified.length });

      // 步骤4: 选择TOP10
      const top10Content = diversified.slice(0, 10);

      // 步骤5: 生成统计信息
      const stats = this.calculateStats(candidates, top10Content);

      // 步骤6: 生成摘要报告
      const summaryReport = await this.generateSummaryReport(top10Content, stats);

      // 步骤7: 保存到数据库
      const generationTime = Date.now() - generationStart;
      const top10Record = await this.saveTop10ToDatabase(
        startDate,
        top10Content,
        summaryReport,
        stats,
        generationTime
      );

      logger.info('每日TOP10生成完成', {
        top10Id: top10Record.id,
        itemCount: top10Content.length,
        generationTime
      });

      return top10Record;
    } catch (error: any) {
      logger.error('生成每日TOP10失败', { error: error.message, date: startDate });
      throw error;
    }
  }

  /**
   * 获取候选内容（过去24小时）
   */
  private async getCandidateContent(
    startDate: Date,
    endDate: Date
  ): Promise<Top10Candidate[]> {
    // 获取时间范围内的内容
    const content = await db.content.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        source: true,
        contentScore: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // 转换为候选格式
    const candidates: Top10Candidate[] = content
      .filter(c => c.contentScore && c.contentScore.totalScore >= this.minScoreThreshold)
      .map(c => ({
        id: c.id,
        title: c.title,
        description: c.description || undefined,
        content: c.content || undefined,
        sourceId: c.sourceId,
        source: c.source,
        category: c.category || undefined,
        publishedAt: c.publishedAt || undefined,
        createdAt: c.createdAt,
        score: c.contentScore!.totalScore,
        scoreBreakdown: {
          timeliness: c.contentScore!.timelinessScore,
          authority: c.contentScore!.authorityScore,
          quality: c.contentScore!.qualityScore,
          relevance: c.contentScore!.relevanceScore,
          aiImportance: c.contentScore!.aiImportanceScore,
          engagement: c.contentScore!.engagementScore
        },
        explanation: c.contentScore?.explanation || undefined
      }));

    return candidates;
  }

  /**
   * 评分并排序候选内容
   */
  private async scoreAndRankCandidates(
    candidates: Top10Candidate[]
  ): Promise<Top10Candidate[]> {
    // 按综合评分降序排序
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * 确保内容多样性
   */
  private async ensureDiversity(
    candidates: Top10Candidate[]
  ): Promise<Top10Candidate[]> {
    const selected: Top10Candidate[] = [];
    const categoryCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};

    for (const candidate of candidates) {
      if (selected.length >= 10) break;

      // 检查来源限制
      const sourceName = candidate.source?.name || 'Unknown';
      if (sourceCount[sourceName] >= this.sourceLimit) {
        logger.debug('跳过：来源已达上限', { source: sourceName });
        continue;
      }

      // 检查分类配额
      const category = this.normalizeCategory(candidate.category);
      const quota = this.defaultCategoryQuotas[category];
      
      if (quota && categoryCount[category] >= quota.max) {
        logger.debug('跳过：分类已达上限', { category });
        continue;
      }

      // 检查重复
      const isDuplicate = await this.checkDuplication(candidate, selected);
      if (isDuplicate) {
        logger.debug('跳过：内容重复', { contentId: candidate.id });
        continue;
      }

      // 添加到选中列表
      selected.push(candidate);
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      sourceCount[sourceName] = (sourceCount[sourceName] || 0) + 1;
    }

    // 检查分类最小配额
    for (const [category, quota] of Object.entries(this.defaultCategoryQuotas)) {
      const count = categoryCount[category] || 0;
      if (count < quota.min) {
        logger.warn('分类未达到最小配额', {
          category,
          current: count,
          required: quota.min
        });
      }
    }

    logger.info('多样性筛选完成', {
      selected: selected.length,
      categories: categoryCount,
      sources: sourceCount
    });

    return selected;
  }

  /**
   * 规范化分类名称
   */
  private normalizeCategory(category?: string): string {
    if (!category) return 'Technology';
    
    const normalized = category.toUpperCase();
    if (normalized.includes('AI') || normalized.includes('ARTIFICIAL')) return 'AI';
    if (normalized.includes('STOCK') || normalized.includes('INVEST')) return 'Stock';
    return 'Technology';
  }

  /**
   * 检查内容是否重复
   */
  private async checkDuplication(
    candidate: Top10Candidate,
    selected: Top10Candidate[]
  ): Promise<boolean> {
    for (const item of selected) {
      try {
        const similarity = await contentDeduplicationService.calculateSimilarity(
          candidate.id,
          item.id
        );
        
        if (similarity >= 80) {
          return true;
        }
      } catch (error) {
        logger.error('检查重复失败', { error });
      }
    }
    return false;
  }

  /**
   * 计算统计信息
   */
  private calculateStats(
    allCandidates: Top10Candidate[],
    selected: Top10Candidate[]
  ): Top10Stats {
    const categoryDist: Record<string, number> = {};
    const sourceDist: Record<string, number> = {};
    let totalScore = 0;
    let minScore = Infinity;
    let maxScore = -Infinity;

    for (const item of selected) {
      const category = this.normalizeCategory(item.category);
      categoryDist[category] = (categoryDist[category] || 0) + 1;

      const source = item.source?.name || 'Unknown';
      sourceDist[source] = (sourceDist[source] || 0) + 1;

      totalScore += item.score;
      minScore = Math.min(minScore, item.score);
      maxScore = Math.max(maxScore, item.score);
    }

    return {
      totalCandidates: allCandidates.length,
      selectedCount: selected.length,
      categoryDistribution: categoryDist,
      sourceDistribution: sourceDist,
      averageScore: totalScore / selected.length,
      scoreRange: { min: minScore, max: maxScore }
    };
  }

  /**
   * 生成摘要报告
   */
  private async generateSummaryReport(
    top10: Top10Candidate[],
    stats: Top10Stats
  ): Promise<string> {
    const lines: string[] = [];

    // 标题
    lines.push('# 每日科技新闻 TOP 10 摘要');
    lines.push('');

    // 整体概览
    lines.push('## 📊 整体概览');
    lines.push(`- 候选内容总数: ${stats.totalCandidates}条`);
    lines.push(`- 精选内容: ${stats.selectedCount}条`);
    lines.push(`- 平均评分: ${stats.averageScore.toFixed(2)}分`);
    lines.push(`- 评分范围: ${stats.scoreRange.min.toFixed(2)} - ${stats.scoreRange.max.toFixed(2)}`);
    lines.push('');

    // 分类分布
    lines.push('## 📑 分类分布');
    for (const [category, count] of Object.entries(stats.categoryDistribution)) {
      lines.push(`- ${category}: ${count}条`);
    }
    lines.push('');

    // 来源分布
    lines.push('## 📰 来源分布');
    const sortedSources = Object.entries(stats.sourceDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    for (const [source, count] of sortedSources) {
      lines.push(`- ${source}: ${count}条`);
    }
    lines.push('');

    // TOP 10列表
    lines.push('## 🏆 TOP 10 内容');
    top10.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.title}`);
      lines.push(`- **来源**: ${item.source?.name || 'Unknown'}`);
      lines.push(`- **分类**: ${item.category || 'Technology'}`);
      lines.push(`- **评分**: ${item.score.toFixed(2)}分`);
      if (item.explanation) {
        lines.push(`- **评分说明**: ${item.explanation}`);
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * 保存TOP10到数据库
   */
  private async saveTop10ToDatabase(
    date: Date,
    top10: Top10Candidate[],
    summaryReport: string,
    stats: Top10Stats,
    generationTime: number
  ): Promise<any> {
    // 创建或更新TOP10记录
    const top10Record = await db.dailyTop10.upsert({
      where: { date },
      create: {
        date,
        status: 'DRAFT',
        summaryReport,
        categoryStats: stats.categoryDistribution as any,
        totalCandidates: stats.totalCandidates,
        generationTime,
        generatedBy: 'AUTO'
      },
      update: {
        summaryReport,
        categoryStats: stats.categoryDistribution as any,
        totalCandidates: stats.totalCandidates,
        generationTime,
        generatedBy: 'AUTO',
        updatedAt: new Date()
      }
    });

    // 删除旧的TOP10项目
    await db.top10Item.deleteMany({
      where: { top10Id: top10Record.id }
    });

    // 创建新的TOP10项目
    const items = await Promise.all(
      top10.map((item, index) =>
        db.top10Item.create({
          data: {
            top10Id: top10Record.id,
            contentId: item.id,
            position: index + 1,
            score: item.score,
            reason: item.explanation,
            highlights: item.description?.substring(0, 200)
          }
        })
      )
    );

    // 返回完整数据
    return await db.dailyTop10.findUnique({
      where: { id: top10Record.id },
      include: {
        items: {
          include: {
            content: {
              include: { source: true }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });
  }

  /**
   * 获取今日TOP10
   */
  async getTodayTop10(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await db.dailyTop10.findUnique({
      where: { date: today },
      include: {
        items: {
          include: {
            content: {
              include: { source: true }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });
  }

  /**
   * 获取指定日期的TOP10
   */
  async getTop10ByDate(date: Date): Promise<any> {
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    return await db.dailyTop10.findUnique({
      where: { date: searchDate },
      include: {
        items: {
          include: {
            content: {
              include: { source: true }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });
  }

  /**
   * 获取TOP10历史
   */
  async getTop10History(
    startDate?: Date,
    endDate?: Date,
    limit: number = 30
  ): Promise<{ items: any[]; total: number; hasMore: boolean }> {
    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [items, total] = await Promise.all([
      db.dailyTop10.findMany({
        where,
        include: {
          items: {
            include: {
              content: {
                include: { source: true }
              }
            },
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { date: 'desc' },
        take: limit
      }),
      db.dailyTop10.count({ where })
    ]);

    return {
      items,
      total,
      hasMore: total > limit
    };
  }

  /**
   * 发布TOP10
   */
  async publishTop10(id: string): Promise<any> {
    return await db.dailyTop10.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      },
      include: {
        items: {
          include: {
            content: {
              include: { source: true }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });
  }
}

// 导出单例
export const dailyTop10Service = new DailyTop10Service();

