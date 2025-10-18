/**
 * Story 4.3: 历史内容分析与趋势 - 趋势分析服务
 * 
 * 功能：
 * - 关键词趋势分析
 * - 分类趋势分析
 * - 话题变化趋势
 * - 热门内容趋势
 * - 趋势数据统计与聚合
 */

import { prisma, ContentStatus } from '@tech-news-platform/database';

/**
 * 趋势方向
 */
export type TrendDirection = 'rising' | 'falling' | 'stable';

/**
 * 关键词趋势项
 */
export interface KeywordTrendItem {
  keyword: string;
  currentCount: number;
  previousCount: number;
  change: number; // 变化量
  changePercent: number; // 变化百分比
  trend: TrendDirection;
  avgScore: number;
  categories: string[];
}

/**
 * 分类趋势项
 */
export interface CategoryTrendItem {
  category: string;
  currentCount: number;
  previousCount: number;
  change: number;
  changePercent: number;
  trend: TrendDirection;
  avgScore: number;
  topKeywords: string[];
}

/**
 * 时间范围趋势数据
 */
export interface TrendPeriodData {
  period: {
    start: string;
    end: string;
    days: number;
  };
  keywordTrends: KeywordTrendItem[];
  categoryTrends: CategoryTrendItem[];
  summary: {
    totalKeywords: number;
    risingKeywords: number;
    fallingKeywords: number;
    totalCategories: number;
    risingCategories: number;
    fallingCategories: number;
  };
}

export class TrendAnalysisService {
  /**
   * 计算趋势方向
   */
  private calculateTrend(current: number, previous: number): TrendDirection {
    if (previous === 0) {
      return current > 0 ? 'rising' : 'stable';
    }

    const changePercent = ((current - previous) / previous) * 100;

    if (changePercent > 10) return 'rising';
    if (changePercent < -10) return 'falling';
    return 'stable';
  }

  /**
   * 聚合关键词趋势数据
   * 每天执行一次，统计前一天的数据
   */
  async aggregateKeywordTrends(date?: Date): Promise<number> {
    try {
      const targetDate = date || new Date();
      targetDate.setDate(targetDate.getDate() - 1); // 统计前一天

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // 查询当天发布的所有内容
      const contents = await prisma.content.findMany({
        where: {
          status: ContentStatus.PROCESSED,
          publishedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          id: true,
          tags: true,
          category: true,
          score: true,
        },
      });

      // 如果没有内容，返回0（不是错误）
      if (contents.length === 0) {
        console.log(`[TrendAnalysis] ${startOfDay.toISOString().split('T')[0]}: 无内容数据`);
        return 0;
      }

      // 统计关键词
      const keywordStats = new Map<
        string,
        {
          count: number;
          contentIds: string[];
          categories: Set<string>;
          scores: number[];
        }
      >();

      contents.forEach((content) => {
        const keywords = content.tags || [];
        keywords.forEach((keyword) => {
          if (!keyword || keyword.trim() === '') return; // 跳过空关键词

          if (!keywordStats.has(keyword)) {
            keywordStats.set(keyword, {
              count: 0,
              contentIds: [],
              categories: new Set(),
              scores: [],
            });
          }

          const stats = keywordStats.get(keyword)!;
          stats.count++;
          stats.contentIds.push(content.id);
          if (content.category) {
            stats.categories.add(content.category);
          }
          stats.scores.push(content.score);
        });
      });

      // 保存到数据库
      let savedCount = 0;
      for (const [keyword, stats] of keywordStats.entries()) {
        try {
          const avgScore =
            stats.scores.length > 0
              ? stats.scores.reduce((sum, s) => sum + s, 0) / stats.scores.length
              : 0;

          await prisma.keywordTrend.upsert({
            where: {
              keyword_date: {
                keyword,
                date: startOfDay,
              },
            },
            update: {
              count: stats.count,
              contentIds: stats.contentIds,
              avgScore,
              categories: Array.from(stats.categories),
            },
            create: {
              keyword,
              date: startOfDay,
              count: stats.count,
              contentIds: stats.contentIds,
              avgScore,
              categories: Array.from(stats.categories),
            },
          });

          savedCount++;
        } catch (error) {
          console.error(`[TrendAnalysis] 保存关键词 "${keyword}" 失败:`, error);
        }
      }

      return savedCount;
    } catch (error) {
      console.error('[TrendAnalysis] 聚合关键词趋势失败:', error);
      throw error;
    }
  }

  /**
   * 聚合分类趋势数据
   */
  async aggregateCategoryTrends(date?: Date): Promise<number> {
    try {
      const targetDate = date || new Date();
      targetDate.setDate(targetDate.getDate() - 1);

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // 查询当天发布的所有内容，按分类分组
      const contents = await prisma.content.findMany({
        where: {
          status: ContentStatus.PROCESSED,
          publishedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          category: {
            not: null,
          },
        },
        select: {
          category: true,
          tags: true,
          score: true,
        },
      });

      // 如果没有内容，返回0（不是错误）
      if (contents.length === 0) {
        console.log(`[TrendAnalysis] ${startOfDay.toISOString().split('T')[0]}: 无分类数据`);
        return 0;
      }

      // 统计分类
      const categoryStats = new Map<
        string,
        {
          count: number;
          keywords: Map<string, number>;
          scores: number[];
        }
      >();

      contents.forEach((content) => {
        const category = content.category!;
        if (!categoryStats.has(category)) {
          categoryStats.set(category, {
            count: 0,
            keywords: new Map(),
            scores: [],
          });
        }

        const stats = categoryStats.get(category)!;
        stats.count++;
        stats.scores.push(content.score);

        // 统计关键词
        (content.tags || []).forEach((keyword) => {
          if (keyword && keyword.trim() !== '') {
            stats.keywords.set(keyword, (stats.keywords.get(keyword) || 0) + 1);
          }
        });
      });

      // 保存到数据库
      let savedCount = 0;
      for (const [category, stats] of categoryStats.entries()) {
        try {
          const avgScore =
            stats.scores.length > 0
              ? stats.scores.reduce((sum, s) => sum + s, 0) / stats.scores.length
              : 0;

          // 获取TOP10关键词
          const topKeywords = Array.from(stats.keywords.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([keyword]) => keyword);

          await prisma.categoryTrend.upsert({
            where: {
              category_date: {
                category,
                date: startOfDay,
              },
            },
            update: {
              count: stats.count,
              avgScore,
              topKeywords,
            },
            create: {
              category,
              date: startOfDay,
              count: stats.count,
              avgScore,
              topKeywords,
            },
          });

          savedCount++;
        } catch (error) {
          console.error(`[TrendAnalysis] 保存分类 "${category}" 失败:`, error);
        }
      }

      return savedCount;
    } catch (error) {
      console.error('[TrendAnalysis] 聚合分类趋势失败:', error);
      throw error;
    }
  }

  /**
   * 获取关键词趋势（对比两个时间段）
   */
  async getKeywordTrends(
    period: '7d' | '30d',
    limit: number = 20
  ): Promise<KeywordTrendItem[]> {
    const days = period === '7d' ? 7 : 30;

    // 当前时间段
    const currentEnd = new Date();
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - days);

    // 前一个时间段
    const previousEnd = new Date(currentStart);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - days);

    // 查询当前时间段的关键词趋势
    const currentTrends = await prisma.keywordTrend.findMany({
      where: {
        date: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
    });

    // 查询前一个时间段的关键词趋势
    const previousTrends = await prisma.keywordTrend.findMany({
      where: {
        date: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    });

    // 聚合统计
    const currentStats = this.aggregateTrendData(currentTrends);
    const previousStats = this.aggregateTrendData(previousTrends);

    // 计算变化
    const allKeywords = new Set([
      ...currentStats.keys(),
      ...previousStats.keys(),
    ]);

    const trends: KeywordTrendItem[] = [];

    allKeywords.forEach((keyword) => {
      const current = currentStats.get(keyword) || {
        count: 0,
        avgScore: 0,
        categories: [],
      };
      const previous = previousStats.get(keyword) || {
        count: 0,
        avgScore: 0,
        categories: [],
      };

      const change = current.count - previous.count;
      const changePercent =
        previous.count > 0 ? (change / previous.count) * 100 : 0;

      trends.push({
        keyword,
        currentCount: current.count,
        previousCount: previous.count,
        change,
        changePercent,
        trend: this.calculateTrend(current.count, previous.count),
        avgScore: current.avgScore,
        categories: current.categories,
      });
    });

    // 按变化幅度排序，取TOP N
    return trends
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, limit);
  }

  /**
   * 获取分类趋势
   */
  async getCategoryTrends(
    period: '7d' | '30d',
    limit: number = 10
  ): Promise<CategoryTrendItem[]> {
    const days = period === '7d' ? 7 : 30;

    const currentEnd = new Date();
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - days);

    const previousEnd = new Date(currentStart);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - days);

    // 查询当前和前一个时间段的分类趋势
    const currentTrends = await prisma.categoryTrend.findMany({
      where: {
        date: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
    });

    const previousTrends = await prisma.categoryTrend.findMany({
      where: {
        date: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    });

    // 聚合统计
    const currentStats = this.aggregateCategoryTrendData(currentTrends);
    const previousStats = this.aggregateCategoryTrendData(previousTrends);

    const allCategories = new Set([
      ...currentStats.keys(),
      ...previousStats.keys(),
    ]);

    const trends: CategoryTrendItem[] = [];

    allCategories.forEach((category) => {
      const current = currentStats.get(category) || {
        count: 0,
        avgScore: 0,
        topKeywords: [],
      };
      const previous = previousStats.get(category) || {
        count: 0,
        avgScore: 0,
        topKeywords: [],
      };

      const change = current.count - previous.count;
      const changePercent =
        previous.count > 0 ? (change / previous.count) * 100 : 0;

      trends.push({
        category,
        currentCount: current.count,
        previousCount: previous.count,
        change,
        changePercent,
        trend: this.calculateTrend(current.count, previous.count),
        avgScore: current.avgScore,
        topKeywords: current.topKeywords,
      });
    });

    return trends
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, limit);
  }

  /**
   * 获取完整的趋势分析报告
   */
  async getTrendReport(
    period: '7d' | '30d'
  ): Promise<TrendPeriodData> {
    const days = period === '7d' ? 7 : 30;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const keywordTrends = await this.getKeywordTrends(period, 30);
    const categoryTrends = await this.getCategoryTrends(period, 15);

    // 计算摘要
    const risingKeywords = keywordTrends.filter((t) => t.trend === 'rising').length;
    const fallingKeywords = keywordTrends.filter((t) => t.trend === 'falling').length;
    const risingCategories = categoryTrends.filter((t) => t.trend === 'rising').length;
    const fallingCategories = categoryTrends.filter((t) => t.trend === 'falling').length;

    return {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        days,
      },
      keywordTrends,
      categoryTrends,
      summary: {
        totalKeywords: keywordTrends.length,
        risingKeywords,
        fallingKeywords,
        totalCategories: categoryTrends.length,
        risingCategories,
        fallingCategories,
      },
    };
  }

  /**
   * 聚合关键词趋势数据（辅助方法）
   */
  private aggregateTrendData(
    trends: any[]
  ): Map<string, { count: number; avgScore: number; categories: string[] }> {
    const stats = new Map<
      string,
      { count: number; totalScore: number; scoreCount: number; categories: Set<string> }
    >();

    trends.forEach((trend) => {
      if (!stats.has(trend.keyword)) {
        stats.set(trend.keyword, {
          count: 0,
          totalScore: 0,
          scoreCount: 0,
          categories: new Set(),
        });
      }

      const stat = stats.get(trend.keyword)!;
      stat.count += trend.count;
      if (trend.avgScore) {
        stat.totalScore += trend.avgScore * trend.count;
        stat.scoreCount += trend.count;
      }
      if (trend.categories) {
        trend.categories.forEach((cat: string) => stat.categories.add(cat));
      }
    });

    const result = new Map();
    stats.forEach((stat, keyword) => {
      result.set(keyword, {
        count: stat.count,
        avgScore: stat.scoreCount > 0 ? stat.totalScore / stat.scoreCount : 0,
        categories: Array.from(stat.categories),
      });
    });

    return result;
  }

  /**
   * 聚合分类趋势数据（辅助方法）
   */
  private aggregateCategoryTrendData(
    trends: any[]
  ): Map<string, { count: number; avgScore: number; topKeywords: string[] }> {
    const stats = new Map<
      string,
      { count: number; totalScore: number; scoreCount: number; keywords: Map<string, number> }
    >();

    trends.forEach((trend) => {
      if (!stats.has(trend.category)) {
        stats.set(trend.category, {
          count: 0,
          totalScore: 0,
          scoreCount: 0,
          keywords: new Map(),
        });
      }

      const stat = stats.get(trend.category)!;
      stat.count += trend.count;
      stat.totalScore += trend.avgScore * trend.count;
      stat.scoreCount += trend.count;

      // 合并关键词
      if (trend.topKeywords) {
        trend.topKeywords.forEach((keyword: string) => {
          stat.keywords.set(keyword, (stat.keywords.get(keyword) || 0) + 1);
        });
      }
    });

    const result = new Map();
    stats.forEach((stat, category) => {
      const topKeywords = Array.from(stat.keywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword]) => keyword);

      result.set(category, {
        count: stat.count,
        avgScore: stat.scoreCount > 0 ? stat.totalScore / stat.scoreCount : 0,
        topKeywords,
      });
    });

    return result;
  }
}

export const trendAnalysisService = new TrendAnalysisService();

