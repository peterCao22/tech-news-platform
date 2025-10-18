/**
 * Story 4.3: 历史内容分析与趋势 - 每日阅读记录服务
 * 
 * 功能：
 * - 查询指定日期的阅读记录
 * - 按分类筛选
 * - 统计信息
 * - 导出功能
 */

import { prisma } from '@tech-news-platform/database';

/**
 * 每日阅读记录项
 */
export interface DailyReadingItem {
  id: string;
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
    } | null;
  };
  readAt: Date; // 最后阅读时间
  duration: number; // 阅读时长(秒)
  scrollDepth: number; // 滚动深度 0-1
  isCompleted: boolean; // 是否读完
  readCount: number; // 当天阅读次数
  isBookmarked: boolean;
  isLiked: boolean;
}

/**
 * 每日阅读统计
 */
export interface DailyReadingStats {
  date: string;
  totalCount: number;
  filteredCount: number;
  items: DailyReadingItem[];
  categoryDistribution: Record<string, number>;
}

/**
 * 导出格式
 */
export type ExportFormat = 'json' | 'csv' | 'markdown';

export class DailyReadingService {
  /**
   * 获取指定日期的阅读记录
   */
  async getDailyReading(
    userId: string,
    date: string, // YYYY-MM-DD格式
    category?: string
  ): Promise<DailyReadingStats> {
    // 解析日期范围（当天00:00 到 23:59:59）
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 构建查询条件
    const whereCondition: any = {
      userId,
      lastReadAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // 如果指定了分类，添加分类过滤
    if (category) {
      whereCondition.content = {
        category,
      };
    }

    // 查询阅读历史记录
    const readingRecords = await prisma.userReadingHistory.findMany({
      where: whereCondition,
      include: {
        content: {
          include: {
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
        lastReadAt: 'desc', // 按最后阅读时间降序
      },
    });

    // 查询当天的所有阅读记录（用于总数统计）
    const totalCount = await prisma.userReadingHistory.count({
      where: {
        userId,
        lastReadAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 构建分类分布统计
    const categoryDistribution: Record<string, number> = {};
    const allRecords = await prisma.userReadingHistory.findMany({
      where: {
        userId,
        lastReadAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        content: {
          select: {
            category: true,
          },
        },
      },
    });

    allRecords.forEach((record) => {
      const cat = record.content.category || '未分类';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    // 转换为返回格式
    const items: DailyReadingItem[] = readingRecords.map((record) => ({
      id: record.id,
      content: {
        id: record.content.id,
        title: record.content.title,
        description: record.content.description,
        url: record.content.url,
        category: record.content.category,
        score: record.content.score,
        source: record.content.source,
      },
      readAt: record.lastReadAt,
      duration: record.totalDuration,
      scrollDepth: record.maxScrollDepth,
      isCompleted: record.isCompleted,
      readCount: record.readCount,
      isBookmarked: record.isBookmarked,
      isLiked: record.isLiked,
    }));

    return {
      date,
      totalCount,
      filteredCount: items.length,
      items,
      categoryDistribution,
    };
  }

  /**
   * 获取阅读统计信息（不包含详细列表）
   */
  async getReadingStatistics(
    userId: string,
    date: string
  ): Promise<{
    date: string;
    totalCount: number;
    totalDuration: number;
    completedCount: number;
    categoryDistribution: Record<string, number>;
  }> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 查询当天所有阅读记录
    const records = await prisma.userReadingHistory.findMany({
      where: {
        userId,
        lastReadAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        content: {
          select: {
            category: true,
          },
        },
      },
    });

    // 计算统计
    const totalCount = records.length;
    const totalDuration = records.reduce((sum, r) => sum + r.totalDuration, 0);
    const completedCount = records.filter((r) => r.isCompleted).length;

    // 分类分布
    const categoryDistribution: Record<string, number> = {};
    records.forEach((record) => {
      const cat = record.content.category || '未分类';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    return {
      date,
      totalCount,
      totalDuration,
      completedCount,
      categoryDistribution,
    };
  }

  /**
   * 导出每日阅读清单
   */
  async exportDailyReading(
    userId: string,
    date: string,
    format: ExportFormat = 'json'
  ): Promise<string> {
    const data = await this.getDailyReading(userId, date);

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'csv':
        return this.exportAsCSV(data);

      case 'markdown':
        return this.exportAsMarkdown(data);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * 导出为CSV格式
   */
  private exportAsCSV(data: DailyReadingStats): string {
    const lines: string[] = [];

    // CSV头部
    lines.push(
      'Title,Category,Source,Score,Read At,Duration (min),Scroll Depth,Completed,Bookmarked,Liked,URL'
    );

    // CSV数据行
    data.items.forEach((item) => {
      const durationMin = Math.round(item.duration / 60);
      const scrollPercent = Math.round(item.scrollDepth * 100);

      lines.push(
        [
          `"${item.content.title.replace(/"/g, '""')}"`,
          `"${item.content.category || 'N/A'}"`,
          `"${item.content.source?.name || 'N/A'}"`,
          item.content.score,
          item.readAt.toISOString(),
          durationMin,
          `${scrollPercent}%`,
          item.isCompleted ? 'Yes' : 'No',
          item.isBookmarked ? 'Yes' : 'No',
          item.isLiked ? 'Yes' : 'No',
          `"${item.content.url}"`,
        ].join(',')
      );
    });

    return lines.join('\n');
  }

  /**
   * 导出为Markdown格式
   */
  private exportAsMarkdown(data: DailyReadingStats): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# 阅读记录 - ${data.date}`);
    lines.push('');

    // 统计摘要
    lines.push('## 统计摘要');
    lines.push('');
    lines.push(`- **总阅读数**: ${data.totalCount}`);
    lines.push(`- **分类分布**:`);
    Object.entries(data.categoryDistribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        lines.push(`  - ${category}: ${count}`);
      });
    lines.push('');

    // 阅读列表
    lines.push('## 阅读列表');
    lines.push('');

    data.items.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.content.title}`);
      lines.push('');
      lines.push(`- **分类**: ${item.content.category || 'N/A'}`);
      lines.push(`- **来源**: ${item.content.source?.name || 'N/A'}`);
      lines.push(`- **评分**: ${item.content.score}`);
      lines.push(
        `- **阅读时长**: ${Math.round(item.duration / 60)} 分钟`
      );
      lines.push(
        `- **阅读深度**: ${Math.round(item.scrollDepth * 100)}%`
      );
      lines.push(`- **读完**: ${item.isCompleted ? '是' : '否'}`);
      if (item.isBookmarked) {
        lines.push(`- **已收藏**`);
      }
      if (item.isLiked) {
        lines.push(`- **已点赞**`);
      }
      lines.push(`- **链接**: ${item.content.url}`);
      lines.push('');
    });

    return lines.join('\n');
  }
}

export const dailyReadingService = new DailyReadingService();

