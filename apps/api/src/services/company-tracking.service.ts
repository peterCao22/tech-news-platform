/**
 * Story 4.3: 历史内容分析与趋势 - 公司追踪服务
 * 
 * 功能：
 * - 追踪特定公司/股票的新闻历史
 * - 时间线视图
 * - 情感趋势分析
 * - 重要事件标记
 */

import { prisma, ContentStatus } from '@tech-news-platform/database';

/**
 * 公司新闻时间线项
 */
export interface CompanyNewsItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  score: number;
  publishedAt: Date;
  category: string | null;
  tags: string[];
  source: {
    id: string;
    name: string;
  } | null;
  isRead?: boolean; // 用户是否已读（可选）
  readCount?: number;
}

/**
 * 公司新闻统计
 */
export interface CompanyNewsStats {
  totalCount: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  categories: Record<string, number>;
  sources: Record<string, number>;
  timeline: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * 完整的公司追踪结果
 */
export interface CompanyTrackingResult {
  company: {
    name: string;
    identifier: string;
  };
  period: {
    start: string;
    end: string;
    days: number;
  };
  stats: CompanyNewsStats;
  news: CompanyNewsItem[];
}

export class CompanyTrackingService {
  /**
   * 追踪公司新闻历史
   * 
   * @param companyName 公司名称或股票代码
   * @param period 时间范围 (7d, 30d, 90d)
   * @param userId 用户ID（用于标记是否已读）
   */
  async trackCompanyNews(
    companyName: string,
    period: '7d' | '30d' = '30d',
    userId?: string
  ): Promise<CompanyTrackingResult> {
    const days = period === '7d' ? 7 : 30;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    // 查询包含该公司名称或股票代码的新闻
    // 在title, description, tags中搜索
    const contents = await prisma.content.findMany({
      where: {
        status: ContentStatus.PROCESSED,
        publishedAt: {
          gte: start,
          lte: end,
        },
        OR: [
          {
            title: {
              contains: companyName,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: companyName,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              has: companyName,
            },
          },
        ],
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // 如果提供了userId，查询用户的阅读记录
    let readingMap = new Map<string, number>();
    if (userId) {
      const readings = await prisma.userReadingHistory.findMany({
        where: {
          userId,
          contentId: {
            in: contents.map((c) => c.id),
          },
        },
        select: {
          contentId: true,
          readCount: true,
        },
      });

      readingMap = new Map(readings.map((r) => [r.contentId, r.readCount]));
    }

    // 转换为新闻列表
    const news: CompanyNewsItem[] = contents.map((content) => ({
      id: content.id,
      title: content.title,
      description: content.description,
      url: content.url,
      score: content.score,
      publishedAt: content.publishedAt!,
      category: content.category,
      tags: content.tags || [],
      source: content.source,
      isRead: userId ? readingMap.has(content.id) : undefined,
      readCount: userId ? readingMap.get(content.id) || 0 : undefined,
    }));

    // 计算统计信息
    const stats = this.calculateStats(contents);

    return {
      company: {
        name: companyName,
        identifier: companyName,
      },
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        days,
      },
      stats,
      news,
    };
  }

  /**
   * 获取用户关注公司列表的新闻
   */
  async getFollowedCompaniesNews(
    userId: string,
    period: '7d' | '30d' = '7d'
  ): Promise<
    Array<{
      company: {
        name: string;
        identifier: string;
        weight: number;
      };
      latestNews: CompanyNewsItem[];
      newsCount: number;
      unreadCount: number;
    }>
  > {
    // 查询用户关注的公司
    const followings = await prisma.userFollowing.findMany({
      where: {
        userId,
        isActive: true,
        followType: {
          in: ['COMPANY', 'STOCK'],
        },
      },
      orderBy: {
        weight: 'desc',
      },
    });

    const results = await Promise.all(
      followings.map(async (following) => {
        const trackingResult = await this.trackCompanyNews(
          following.name,
          period,
          userId
        );

        const unreadCount = trackingResult.news.filter(
          (n) => !n.isRead
        ).length;

        return {
          company: {
            name: following.name,
            identifier: following.identifier,
            weight: following.weight,
          },
          latestNews: trackingResult.news.slice(0, 5), // 只返回最新5条
          newsCount: trackingResult.news.length,
          unreadCount,
        };
      })
    );

    // 按未读数量和权重排序
    return results.sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      return b.company.weight - a.company.weight;
    });
  }

  /**
   * 比较多个公司的新闻趋势
   */
  async compareCompanies(
    companies: string[],
    period: '7d' | '30d' = '30d'
  ): Promise<
    Array<{
      company: string;
      stats: CompanyNewsStats;
      recentNews: CompanyNewsItem[];
    }>
  > {
    const results = await Promise.all(
      companies.map(async (company) => {
        const trackingResult = await this.trackCompanyNews(company, period);
        return {
          company,
          stats: trackingResult.stats,
          recentNews: trackingResult.news.slice(0, 3),
        };
      })
    );

    // 按新闻数量排序
    return results.sort((a, b) => b.stats.totalCount - a.stats.totalCount);
  }

  /**
   * 计算统计信息（私有方法）
   */
  private calculateStats(contents: any[]): CompanyNewsStats {
    if (contents.length === 0) {
      return {
        totalCount: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        categories: {},
        sources: {},
        timeline: [],
      };
    }

    // 基础统计
    const scores = contents.map((c) => c.score);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // 分类分布
    const categories: Record<string, number> = {};
    contents.forEach((content) => {
      if (content.category) {
        categories[content.category] =
          (categories[content.category] || 0) + 1;
      }
    });

    // 来源分布
    const sources: Record<string, number> = {};
    contents.forEach((content) => {
      if (content.source) {
        sources[content.source.name] =
          (sources[content.source.name] || 0) + 1;
      }
    });

    // 时间线统计（按天）
    const timelineMap = new Map<string, number>();
    contents.forEach((content) => {
      if (content.publishedAt) {
        const dateKey = content.publishedAt.toISOString().split('T')[0];
        timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);
      }
    });

    const timeline = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalCount: contents.length,
      avgScore: Math.round(avgScore * 100) / 100,
      maxScore,
      minScore,
      categories,
      sources,
      timeline,
    };
  }
}

export const companyTrackingService = new CompanyTrackingService();

