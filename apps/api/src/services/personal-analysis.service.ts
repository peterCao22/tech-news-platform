/**
 * Story 4.3: 历史内容分析与趋势 - 个人阅读分析服务
 * 
 * 功能：
 * - 获取用户个人阅读TOP10
 * - 获取平台热门TOP10
 * - 对比分析（个人vs平台）
 * - 计算兴趣匹配度
 */

import { prisma, ContentStatus } from '@tech-news-platform/database';

/**
 * 时间范围选项
 */
export type TimePeriod = '7d' | '30d';

/**
 * 个人阅读TOP10项
 */
export interface MyTop10Item {
  rank: number;
  content: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    category: string | null;
    score: number;
    source: {
      id: string;
      name: string;
      url: string;
    } | null;
    publishedAt: Date | null;
  };
  readCount: number;
  totalDuration: number;
  lastReadAt: Date;
  isCompleted: boolean;
  platformRank: number | null; // 在平台TOP10中的排名
}

/**
 * 平台热门TOP10项
 */
export interface PlatformTop10Item {
  rank: number;
  content: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    category: string | null;
    score: number;
    source: {
      id: string;
      name: string;
      url: string;
    } | null;
    publishedAt: Date | null;
  };
  myReadCount: number; // 我读了几次
  myRank: number | null; // 在我的TOP10中的排名
}

/**
 * 对比分析结果
 */
export interface ComparisonAnalysis {
  overlap: number; // 重叠内容数量
  myUnique: number; // 我独特关注的数量
  missedHot: number; // 我错过的热门数量
  matchScore: number; // 兴趣匹配度 0-100
  overlapItems: Array<{
    contentId: string;
    title: string;
    myRank: number;
    platformRank: number;
  }>;
}

/**
 * 完整的对比结果
 */
export interface PersonalVsPlatformResult {
  period: {
    value: TimePeriod;
    days: number;
    start: string;
    end: string;
  };
  myTop10: MyTop10Item[];
  platformTop10: PlatformTop10Item[];
  analysis: ComparisonAnalysis;
}

export class PersonalAnalysisService {
  /**
   * 获取日期范围
   */
  private getDateRange(period: TimePeriod): { start: Date; end: Date; days: number } {
    const end = new Date();
    const days = period === '7d' ? 7 : 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    return { start, end, days };
  }

  /**
   * 获取我的阅读TOP10
   * 按阅读次数排序，次要按总阅读时长排序
   */
  async getMyTop10Reading(userId: string, period: TimePeriod): Promise<MyTop10Item[]> {
    const { start, end } = this.getDateRange(period);

    // 查询用户在指定时间范围内的阅读历史
    const readingHistory = await prisma.userReadingHistory.findMany({
      where: {
        userId,
        lastReadAt: {
          gte: start,
          lte: end,
        },
        readCount: {
          gt: 0,
        },
      },
      include: {
        content: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
        },
      },
      orderBy: [
        { readCount: 'desc' },
        { totalDuration: 'desc' },
      ],
      take: 10,
    });

    return readingHistory.map((item, index) => ({
      rank: index + 1,
      content: {
        id: item.content.id,
        title: item.content.title,
        description: item.content.description,
        url: item.content.url,
        category: item.content.category,
        score: item.content.score,
        source: item.content.source,
        publishedAt: item.content.publishedAt,
      },
      readCount: item.readCount,
      totalDuration: item.totalDuration,
      lastReadAt: item.lastReadAt,
      isCompleted: item.isCompleted,
      platformRank: null, // 后续填充
    }));
  }

  /**
   * 获取平台热门TOP10
   * 按评分排序
   */
  async getPlatformTop10(period: TimePeriod): Promise<PlatformTop10Item[]> {
    const { start, end } = this.getDateRange(period);

    // 查询平台热门内容
    const hotContents = await prisma.content.findMany({
      where: {
        status: ContentStatus.PROCESSED,
        publishedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
    });

    return hotContents.map((content, index) => ({
      rank: index + 1,
      content: {
        id: content.id,
        title: content.title,
        description: content.description,
        url: content.url,
        category: content.category,
        score: content.score,
        source: content.source,
        publishedAt: content.publishedAt,
      },
      myReadCount: 0, // 后续填充
      myRank: null, // 后续填充
    }));
  }

  /**
   * 计算兴趣匹配度
   * 基于重叠内容的排名相似度
   */
  private calculateMatchScore(
    myTop10: MyTop10Item[],
    platformTop10: PlatformTop10Item[],
    overlapCount: number
  ): number {
    if (overlapCount === 0) return 0;

    // 计算排名相似度
    let totalRankDiff = 0;
    const overlapItems: any[] = [];

    myTop10.forEach((myItem) => {
      const platformItem = platformTop10.find(
        (p) => p.content.id === myItem.content.id
      );

      if (platformItem) {
        const rankDiff = Math.abs(myItem.rank - platformItem.rank);
        totalRankDiff += rankDiff;
        overlapItems.push({
          contentId: myItem.content.id,
          title: myItem.content.title,
          myRank: myItem.rank,
          platformRank: platformItem.rank,
        });
      }
    });

    // 计算匹配分数
    // 1. 基础分数：重叠比例 (0-50分)
    const overlapScore = (overlapCount / 10) * 50;

    // 2. 排名相似度分数 (0-50分)
    // 排名差越小，分数越高
    const avgRankDiff = totalRankDiff / overlapCount;
    const maxRankDiff = 9; // 最大排名差（1-10）
    const rankSimilarityScore = Math.max(0, (1 - avgRankDiff / maxRankDiff)) * 50;

    return Math.round(overlapScore + rankSimilarityScore);
  }

  /**
   * 对比个人vs平台分析
   */
  async comparePersonalVsPlatform(
    userId: string,
    period: TimePeriod
  ): Promise<PersonalVsPlatformResult> {
    const { start, end, days } = this.getDateRange(period);

    // 并行获取个人TOP10和平台TOP10
    const [myTop10Raw, platformTop10Raw] = await Promise.all([
      this.getMyTop10Reading(userId, period),
      this.getPlatformTop10(period),
    ]);

    // 创建contentId映射
    const myContentIds = new Set(myTop10Raw.map((item) => item.content.id));
    const platformContentIds = new Set(
      platformTop10Raw.map((item) => item.content.id)
    );

    // 查询用户对平台热门内容的阅读情况
    const myReadings = await prisma.userReadingHistory.findMany({
      where: {
        userId,
        contentId: {
          in: Array.from(platformContentIds),
        },
      },
      select: {
        contentId: true,
        readCount: true,
      },
    });

    const myReadingsMap = new Map(
      myReadings.map((r) => [r.contentId, r.readCount])
    );

    // 填充 platformRank 和 myReadCount, myRank
    const myTop10 = myTop10Raw.map((item) => {
      const platformItem = platformTop10Raw.find(
        (p) => p.content.id === item.content.id
      );
      return {
        ...item,
        platformRank: platformItem ? platformItem.rank : null,
      };
    });

    const platformTop10 = platformTop10Raw.map((item) => {
      const myItem = myTop10Raw.find((m) => m.content.id === item.content.id);
      return {
        ...item,
        myReadCount: myReadingsMap.get(item.content.id) || 0,
        myRank: myItem ? myItem.rank : null,
      };
    });

    // 计算对比分析
    const overlapContentIds = new Set(
      [...myContentIds].filter((id) => platformContentIds.has(id))
    );

    const overlap = overlapContentIds.size;
    const myUnique = myContentIds.size - overlap;
    const missedHot = platformContentIds.size - overlap;

    const overlapItems = myTop10
      .filter((item) => overlapContentIds.has(item.content.id))
      .map((item) => ({
        contentId: item.content.id,
        title: item.content.title,
        myRank: item.rank,
        platformRank: item.platformRank!,
      }));

    const matchScore = this.calculateMatchScore(myTop10, platformTop10, overlap);

    const analysis: ComparisonAnalysis = {
      overlap,
      myUnique,
      missedHot,
      matchScore,
      overlapItems,
    };

    return {
      period: {
        value: period,
        days,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      myTop10,
      platformTop10,
      analysis,
    };
  }
}

export const personalAnalysisService = new PersonalAnalysisService();

