/**
 * Story 4.4: User Behavior Analytics Service
 * 用户行为分析服务
 * 
 * 负责追踪、存储和分析用户行为数据，包括：
 * - 行为事件追踪（浏览、点击、阅读、分享、收藏、点赞）
 * - 阅读历史管理
 * - 用户参与度统计
 * - 隐式偏好生成
 */

import { 
  prisma, 
  BehaviorEventType,
  type UserBehavior,
  type UserReadingHistory,
  type UserEngagement,
  type ImplicitPreference
} from '@tech-news-platform/database';

// ============================================
// 类型定义
// ============================================

export interface BehaviorEvent {
  eventType: BehaviorEventType;
  contentId?: string;
  duration?: number;      // 秒
  scrollDepth?: number;   // 0-1
  deviceType?: string;
  source?: string;
  metadata?: any;
  timestamp?: Date;
  sessionId?: string;
}

export interface ReadingHistoryUpdate {
  duration: number;
  scrollDepth: number;
  isCompleted: boolean;
}

export interface BehaviorStats {
  totalViews: number;
  totalReads: number;
  totalClicks: number;
  totalShares: number;
  totalBookmarks: number;
  totalLikes: number;
  totalReadingTime: number;
  avgSessionTime: number;
  categoryDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  topContents: Array<{
    contentId: string;
    title: string;
    category?: string;
    views: number;
    duration: number;
  }>;
  recentActivities: UserBehavior[];
}

export interface PreferenceInsight {
  preferenceType: 'category' | 'source' | 'topic' | 'company';
  preferenceKey: string;
  weight: number;
  confidence: number;
  interactionCount: number;
}

// ============================================
// BehaviorTrackingService - 行为追踪服务
// ============================================

class BehaviorTrackingService {
  /**
   * 批量追踪用户行为事件
   */
  async trackBehaviors(
    userId: string,
    events: BehaviorEvent[]
  ): Promise<{ tracked: number }> {
    const now = new Date();
    
    const behaviorRecords = events.map((event) => ({
      userId,
      eventType: event.eventType,
      contentId: event.contentId || null,
      duration: event.duration || null,
      scrollDepth: event.scrollDepth || null,
      deviceType: event.deviceType || null,
      source: event.source || null,
      metadata: event.metadata || null,
      timestamp: event.timestamp || now,
      sessionId: event.sessionId || null,
    }));

    // 批量插入
    await prisma.userBehavior.createMany({
      data: behaviorRecords,
      skipDuplicates: true,
    });

    // 异步更新用户参与度统计
    this.updateEngagementAsync(userId, events).catch((error) => {
      console.error('更新参与度统计失败:', error);
    });

    return { tracked: events.length };
  }

  /**
   * 追踪单个行为事件
   */
  async trackBehavior(
    userId: string,
    event: BehaviorEvent
  ): Promise<UserBehavior> {
    const behavior = await prisma.userBehavior.create({
      data: {
        userId,
        eventType: event.eventType,
        contentId: event.contentId || null,
        duration: event.duration || null,
        scrollDepth: event.scrollDepth || null,
        deviceType: event.deviceType || null,
        source: event.source || null,
        metadata: event.metadata || null,
        timestamp: event.timestamp || new Date(),
        sessionId: event.sessionId || null,
      },
    });

    // 异步更新参与度统计
    this.updateEngagementAsync(userId, [event]).catch((error) => {
      console.error('更新参与度统计失败:', error);
    });

    return behavior;
  }

  /**
   * 异步更新用户参与度统计
   */
  private async updateEngagementAsync(
    userId: string,
    events: BehaviorEvent[]
  ): Promise<void> {
    for (const event of events) {
      await this.incrementEngagementCounters(userId, event);
    }
  }

  /**
   * 增加参与度计数器
   */
  private async incrementEngagementCounters(
    userId: string,
    event: BehaviorEvent
  ): Promise<void> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    switch (event.eventType) {
      case BehaviorEventType.VIEW:
        updateData.totalViews = { increment: 1 };
        break;
      case BehaviorEventType.READ:
        updateData.totalReads = { increment: 1 };
        if (event.duration) {
          updateData.totalReadingTime = { increment: event.duration };
        }
        break;
      case BehaviorEventType.CLICK:
        updateData.totalClicks = { increment: 1 };
        break;
      case BehaviorEventType.SHARE:
        updateData.totalShares = { increment: 1 };
        break;
      case BehaviorEventType.BOOKMARK:
        updateData.totalBookmarks = { increment: 1 };
        break;
      case BehaviorEventType.LIKE:
        updateData.totalLikes = { increment: 1 };
        break;
    }

    await prisma.userEngagement.upsert({
      where: { userId },
      create: {
        userId,
        ...this.getInitialEngagementData(event),
      },
      update: updateData,
    });
  }

  /**
   * 获取初始参与度数据
   */
  private getInitialEngagementData(event: BehaviorEvent): any {
    const data: any = {
      totalViews: 0,
      totalReads: 0,
      totalClicks: 0,
      totalShares: 0,
      totalBookmarks: 0,
      totalLikes: 0,
      totalReadingTime: 0,
      avgSessionTime: 0,
    };

    switch (event.eventType) {
      case BehaviorEventType.VIEW:
        data.totalViews = 1;
        break;
      case BehaviorEventType.READ:
        data.totalReads = 1;
        data.totalReadingTime = event.duration || 0;
        break;
      case BehaviorEventType.CLICK:
        data.totalClicks = 1;
        break;
      case BehaviorEventType.SHARE:
        data.totalShares = 1;
        break;
      case BehaviorEventType.BOOKMARK:
        data.totalBookmarks = 1;
        break;
      case BehaviorEventType.LIKE:
        data.totalLikes = 1;
        break;
    }

    return data;
  }

  /**
   * 获取用户行为历史
   */
  async getUserBehaviors(
    userId: string,
    options: {
      eventType?: BehaviorEventType;
      contentId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    items: UserBehavior[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { eventType, contentId, startDate, endDate, page = 1, limit = 20 } = options;

    const where: any = { userId };

    if (eventType) {
      where.eventType = eventType;
    }

    if (contentId) {
      where.contentId = contentId;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.userBehavior.findMany({
        where,
        include: {
          content: {
            select: {
              id: true,
              title: true,
              category: true,
              url: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userBehavior.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// ============================================
// ReadingHistoryService - 阅读历史服务
// ============================================

class ReadingHistoryService {
  /**
   * 更新阅读历史
   */
  async updateReadingHistory(
    userId: string,
    contentId: string,
    update: ReadingHistoryUpdate
  ): Promise<UserReadingHistory> {
    const existing = await prisma.userReadingHistory.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
    });

    if (existing) {
      // 更新现有记录
      return await prisma.userReadingHistory.update({
        where: {
          userId_contentId: {
            userId,
            contentId,
          },
        },
        data: {
          readCount: { increment: 1 },
          totalDuration: { increment: update.duration },
          maxScrollDepth: Math.max(existing.maxScrollDepth, update.scrollDepth),
          isCompleted: update.isCompleted || existing.isCompleted,
          lastReadAt: new Date(),
        },
      });
    } else {
      // 创建新记录
      return await prisma.userReadingHistory.create({
        data: {
          userId,
          contentId,
          readCount: 1,
          totalDuration: update.duration,
          maxScrollDepth: update.scrollDepth,
          isCompleted: update.isCompleted,
        },
      });
    }
  }

  /**
   * 收藏内容
   */
  async bookmarkContent(userId: string, contentId: string): Promise<UserReadingHistory> {
    return await this.updateFeedback(userId, contentId, { isBookmarked: true });
  }

  /**
   * 取消收藏
   */
  async unbookmarkContent(userId: string, contentId: string): Promise<UserReadingHistory> {
    return await this.updateFeedback(userId, contentId, { isBookmarked: false });
  }

  /**
   * 点赞内容
   */
  async likeContent(userId: string, contentId: string): Promise<UserReadingHistory> {
    return await this.updateFeedback(userId, contentId, { isLiked: true });
  }

  /**
   * 取消点赞
   */
  async unlikeContent(userId: string, contentId: string): Promise<UserReadingHistory> {
    return await this.updateFeedback(userId, contentId, { isLiked: false });
  }

  /**
   * 分享内容
   */
  async shareContent(userId: string, contentId: string): Promise<UserReadingHistory> {
    return await this.updateFeedback(userId, contentId, { isShared: true });
  }

  /**
   * 更新用户反馈
   */
  private async updateFeedback(
    userId: string,
    contentId: string,
    feedback: Partial<{
      isBookmarked: boolean;
      isLiked: boolean;
      isShared: boolean;
    }>
  ): Promise<UserReadingHistory> {
    return await prisma.userReadingHistory.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
      create: {
        userId,
        contentId,
        readCount: 0,
        totalDuration: 0,
        maxScrollDepth: 0,
        isCompleted: false,
        ...feedback,
      },
      update: feedback,
    });
  }

  /**
   * 获取阅读历史
   */
  async getReadingHistory(
    userId: string,
    options: {
      isBookmarked?: boolean;
      isLiked?: boolean;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    items: UserReadingHistory[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { isBookmarked, isLiked, startDate, endDate, page = 1, limit = 20 } = options;

    const where: any = { userId };

    if (isBookmarked !== undefined) {
      where.isBookmarked = isBookmarked;
    }

    if (isLiked !== undefined) {
      where.isLiked = isLiked;
    }

    if (startDate || endDate) {
      where.lastReadAt = {};
      if (startDate) {
        where.lastReadAt.gte = startDate;
      }
      if (endDate) {
        where.lastReadAt.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.userReadingHistory.findMany({
        where,
        include: {
          content: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              url: true,
              imageUrl: true,
              publishedAt: true,
              score: true,
            },
          },
        },
        orderBy: { lastReadAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userReadingHistory.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 清除阅读历史
   */
  async clearReadingHistory(userId: string): Promise<{ deleted: number }> {
    const result = await prisma.userReadingHistory.deleteMany({
      where: { userId },
    });

    return { deleted: result.count };
  }
}

// ============================================
// EngagementService - 参与度统计服务
// ============================================

class EngagementService {
  /**
   * 获取用户参与度统计
   */
  async getUserEngagement(userId: string): Promise<UserEngagement | null> {
    return await prisma.userEngagement.findUnique({
      where: { userId },
    });
  }

  /**
   * 获取用户行为统计
   */
  async getBehaviorStats(
    userId: string,
    period: 'day' | 'week' | 'month' | 'all' = 'all'
  ): Promise<BehaviorStats> {
    const startDate = this.getStartDate(period);

    // 获取基础统计
    const engagement = await prisma.userEngagement.findUnique({
      where: { userId },
    });

    // 获取时间段内的行为数据
    const behaviors = await prisma.userBehavior.findMany({
      where: {
        userId,
        ...(startDate && { timestamp: { gte: startDate } }),
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // 计算分类分布
    const categoryDistribution: Record<string, number> = {};
    const sourceDistribution: Record<string, number> = {};
    const contentViews: Record<string, { title: string; category?: string; views: number; duration: number }> = {};

    for (const behavior of behaviors) {
      // 分类分布
      if (behavior.content?.category) {
        categoryDistribution[behavior.content.category] = 
          (categoryDistribution[behavior.content.category] || 0) + 1;
      }

      // 内容浏览统计
      if (behavior.contentId && behavior.content) {
        if (!contentViews[behavior.contentId]) {
          contentViews[behavior.contentId] = {
            title: behavior.content.title,
            category: behavior.content.category || undefined,
            views: 0,
            duration: 0,
          };
        }
        contentViews[behavior.contentId].views += 1;
        contentViews[behavior.contentId].duration += behavior.duration || 0;
      }
    }

    // 热门内容TOP 10
    const topContents = Object.entries(contentViews)
      .map(([contentId, data]) => ({ contentId, ...data }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // 最近活动（最近20条）
    const recentActivities = behaviors.slice(0, 20);

    // 计算时间段内的统计
    const viewCount = behaviors.filter((b) => b.eventType === BehaviorEventType.VIEW).length;
    const readCount = behaviors.filter((b) => b.eventType === BehaviorEventType.READ).length;
    const clickCount = behaviors.filter((b) => b.eventType === BehaviorEventType.CLICK).length;
    const shareCount = behaviors.filter((b) => b.eventType === BehaviorEventType.SHARE).length;
    const bookmarkCount = behaviors.filter((b) => b.eventType === BehaviorEventType.BOOKMARK).length;
    const likeCount = behaviors.filter((b) => b.eventType === BehaviorEventType.LIKE).length;

    const totalReadingTime = behaviors
      .filter((b) => b.eventType === BehaviorEventType.READ)
      .reduce((sum, b) => sum + (b.duration || 0), 0);

    return {
      totalViews: engagement?.totalViews || viewCount,
      totalReads: engagement?.totalReads || readCount,
      totalClicks: engagement?.totalClicks || clickCount,
      totalShares: engagement?.totalShares || shareCount,
      totalBookmarks: engagement?.totalBookmarks || bookmarkCount,
      totalLikes: engagement?.totalLikes || likeCount,
      totalReadingTime: engagement?.totalReadingTime || totalReadingTime,
      avgSessionTime: engagement?.avgSessionTime || 0,
      categoryDistribution,
      sourceDistribution,
      topContents,
      recentActivities,
    };
  }

  /**
   * 更新每日活跃连续天数
   */
  async updateDailyActiveStreak(userId: string): Promise<void> {
    const engagement = await prisma.userEngagement.findUnique({
      where: { userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!engagement) {
      await prisma.userEngagement.create({
        data: {
          userId,
          totalViews: 0,
          totalReads: 0,
          totalClicks: 0,
          totalShares: 0,
          totalBookmarks: 0,
          totalLikes: 0,
          totalReadingTime: 0,
          avgSessionTime: 0,
          dailyActiveStreak: 1,
          lastActiveDate: today,
        },
      });
      return;
    }

    const lastActiveDate = engagement.lastActiveDate;
    if (!lastActiveDate) {
      await prisma.userEngagement.update({
        where: { userId },
        data: {
          dailyActiveStreak: 1,
          lastActiveDate: today,
        },
      });
      return;
    }

    const lastActiveDay = new Date(lastActiveDate);
    lastActiveDay.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // 今天已经活跃过，不更新
      return;
    } else if (daysDiff === 1) {
      // 连续活跃
      await prisma.userEngagement.update({
        where: { userId },
        data: {
          dailyActiveStreak: { increment: 1 },
          lastActiveDate: today,
        },
      });
    } else {
      // 中断连续，重新计数
      await prisma.userEngagement.update({
        where: { userId },
        data: {
          dailyActiveStreak: 1,
          lastActiveDate: today,
        },
      });
    }
  }

  /**
   * 获取开始日期
   */
  private getStartDate(period: 'day' | 'week' | 'month' | 'all'): Date | null {
    if (period === 'all') {
      return null;
    }

    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }
}

// ============================================
// 导出服务实例
// ============================================

export const behaviorTrackingService = new BehaviorTrackingService();
export const readingHistoryService = new ReadingHistoryService();
export const engagementService = new EngagementService();

