/**
 * Story 4.5: 智能通知与提醒
 * 重要新闻推送服务 - 基于AI评分和用户偏好推送重要新闻
 */

import { prisma } from '@tech-news-platform/database';
import {
  Content,
  User,
  NotificationType,
  NotificationChannel,
  UserPreference,
} from '@tech-news-platform/database';
import { notificationService } from './notification.service';

// 推送规则
export interface PushRule {
  minScore: number;
  matchUserInterests: boolean;
  matchFollowingCompanies: boolean;
  excludeCategories?: string[];
  dedupWindow: number; // 去重时间窗口（分钟）
}

// 个性化评分结果
export interface PersonalizedScore {
  score: number;
  aiScore: number;
  interestMatchScore: number;
  companyMatchScore: number;
  recencyScore: number;
}

export class NewsPushService {
  // 待推送队列（内存中）
  private pushQueue: Map<string, Set<string>> = new Map(); // contentId -> Set<userId>

  // 默认推送规则
  private defaultRule: PushRule = {
    minScore: 85,
    matchUserInterests: true,
    matchFollowingCompanies: true,
    excludeCategories: [],
    dedupWindow: 60, // 60分钟内不重复推送
  };

  /**
   * 评估内容是否应该推送给用户
   */
  async evaluateContentForPush(contentId: string, userId: string): Promise<boolean> {
    try {
      const content = await prisma.content.findUnique({
        where: { id: contentId },
        include: {
          source: true,
        },
      });

      if (!content) {
        return false;
      }

      // 获取用户偏好
      const preference = await prisma.userPreference.findUnique({
        where: { userId },
        include: {
          interests: true,
          followings: true,
        },
      });

      // 获取通知偏好
      const notifPref = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!notifPref || !notifPref.importantNewsEnabled) {
        return false;
      }

      // 检查AI评分
      const aiScore = content.score || 0;
      if (aiScore < notifPref.minNewsScore) {
        return false;
      }

      // 计算个性化评分
      const personalizedScore = await this.calculatePersonalizedScore(content, preference);

      // 综合评分是否达标
      const finalScore = personalizedScore.score;
      if (finalScore < notifPref.minNewsScore) {
        return false;
      }

      // 检查去重（最近是否推送过相似内容）
      const hasSimilarRecent = await this.checkDuplicatePush(userId, content, this.defaultRule.dedupWindow);
      if (hasSimilarRecent) {
        console.log(`[NewsPushService] 跳过推送 (去重): ${content.title} (用户: ${userId})`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NewsPushService] 评估内容推送失败:', error);
      return false;
    }
  }

  /**
   * 计算个性化评分
   */
  async calculatePersonalizedScore(
    content: Content,
    preference: (UserPreference & { interests?: any[]; followings?: any[] }) | null
  ): Promise<PersonalizedScore> {
    try {
      const aiScore = content.score || 0;
      let interestMatchScore = 0;
      let companyMatchScore = 0;
      let recencyScore = 0;

      // 1. 兴趣匹配评分
      if (preference && preference.interests && preference.interests.length > 0) {
        const userInterests = preference.interests.map((i: any) => i.tag.toLowerCase());
        const contentTags = (content.tags || []).map((t: string) => t.toLowerCase());
        
        const matchedInterests = userInterests.filter((interest: string) =>
          contentTags.includes(interest)
        );

        interestMatchScore = (matchedInterests.length / userInterests.length) * 100;
      }

      // 2. 关注公司匹配评分
      if (preference && preference.followings && preference.followings.length > 0) {
        const followedCompanies = preference.followings
          .filter((f: any) => f.type === 'COMPANY' || f.type === 'STOCK')
          .map((f: any) => f.identifier.toLowerCase());

        const contentTags = (content.tags || []).map((t: string) => t.toLowerCase());
        const contentTitle = content.title.toLowerCase();

        const matchedCompanies = followedCompanies.filter((company: string) =>
          contentTags.includes(company) || contentTitle.includes(company)
        );

        if (matchedCompanies.length > 0) {
          companyMatchScore = 100;
        }
      }

      // 3. 时效性评分
      const publishedAt = new Date(content.publishedAt);
      const now = new Date();
      const hoursAgo = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);

      if (hoursAgo <= 1) {
        recencyScore = 100;
      } else if (hoursAgo <= 6) {
        recencyScore = 80;
      } else if (hoursAgo <= 24) {
        recencyScore = 50;
      } else {
        recencyScore = 20;
      }

      // 综合评分
      const score =
        aiScore * 0.6 +
        interestMatchScore * 0.2 +
        companyMatchScore * 0.15 +
        recencyScore * 0.05;

      return {
        score,
        aiScore,
        interestMatchScore,
        companyMatchScore,
        recencyScore,
      };
    } catch (error) {
      console.error('[NewsPushService] 计算个性化评分失败:', error);
      return {
        score: content.score || 0,
        aiScore: content.score || 0,
        interestMatchScore: 0,
        companyMatchScore: 0,
        recencyScore: 0,
      };
    }
  }

  /**
   * 检查是否已推送过相似内容（去重）
   */
  private async checkDuplicatePush(
    userId: string,
    content: Content,
    windowMinutes: number
  ): Promise<boolean> {
    try {
      const since = new Date();
      since.setMinutes(since.getMinutes() - windowMinutes);

      // 查找最近推送的相似新闻
      const recentPushes = await prisma.notificationLog.findMany({
        where: {
          userId,
          type: NotificationType.IMPORTANT_NEWS,
          createdAt: {
            gte: since,
          },
        },
      });

      // 检查是否有相同的内容ID
      for (const push of recentPushes) {
        const metadata = push.metadata as any;
        if (metadata && metadata.contentId === content.id) {
          return true;
        }
      }

      // 检查是否有相似的标题（简单的相似度检查）
      for (const push of recentPushes) {
        const similarity = this.calculateTitleSimilarity(push.subject, content.title);
        if (similarity > 0.7) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[NewsPushService] 检查重复推送失败:', error);
      return false;
    }
  }

  /**
   * 计算标题相似度（简单实现）
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = new Set(title1.toLowerCase().split(/\s+/));
    const words2 = new Set(title2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * 添加内容到推送队列
   */
  addToPushQueue(contentId: string, userId: string): void {
    if (!this.pushQueue.has(contentId)) {
      this.pushQueue.set(contentId, new Set());
    }
    this.pushQueue.get(contentId)!.add(userId);
  }

  /**
   * 推送重要新闻给单个用户
   */
  async pushImportantNews(contentId: string, userId: string): Promise<boolean> {
    try {
      const shouldPush = await this.evaluateContentForPush(contentId, userId);

      if (!shouldPush) {
        return false;
      }

      const content = await prisma.content.findUnique({
        where: { id: contentId },
        include: {
          source: true,
        },
      });

      if (!content) {
        return false;
      }

      await notificationService.sendNotification({
        userId,
        type: NotificationType.IMPORTANT_NEWS,
        channel: NotificationChannel.EMAIL,
        subject: `🔥 重要新闻：${content.title}`,
        content: '',
        template: 'important-news',
        templateData: {
          id: content.id,
          title: content.title,
          summary: content.summary,
          description: content.description,
          category: content.category,
          score: content.score,
          source: content.source?.name || '未知来源',
          publishedAt: content.publishedAt,
          tags: content.tags || [],
        },
        metadata: {
          contentId: content.id,
          score: content.score,
          category: content.category,
        },
      });

      console.log(`[NewsPushService] ✅ 已推送重要新闻: ${content.title} (用户: ${userId})`);
      return true;
    } catch (error) {
      console.error('[NewsPushService] 推送重要新闻失败:', error);
      return false;
    }
  }

  /**
   * 批量推送新闻（定时任务，每5分钟执行）
   */
  async batchPushNews(): Promise<{
    processed: number;
    sent: number;
    skipped: number;
  }> {
    try {
      console.log('[NewsPushService] 开始批量推送新闻...');

      let processed = 0;
      let sent = 0;
      let skipped = 0;

      // 从队列中获取待推送内容
      for (const [contentId, userIds] of this.pushQueue.entries()) {
        for (const userId of userIds) {
          processed++;
          
          const success = await this.pushImportantNews(contentId, userId);
          
          if (success) {
            sent++;
          } else {
            skipped++;
          }

          // 添加延迟，避免发送过快
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // 处理完后从队列中移除
        this.pushQueue.delete(contentId);
      }

      console.log(`[NewsPushService] 批量推送完成: 处理=${processed}, 发送=${sent}, 跳过=${skipped}`);

      return { processed, sent, skipped };
    } catch (error) {
      console.error('[NewsPushService] 批量推送新闻失败:', error);
      return { processed: 0, sent: 0, skipped: 0 };
    }
  }

  /**
   * 自动推送新内容（在内容处理完成后调用）
   */
  async autoPushNewContent(contentId: string): Promise<void> {
    try {
      const content = await prisma.content.findUnique({
        where: { id: contentId },
      });

      if (!content || content.score < this.defaultRule.minScore) {
        return;
      }

      // 获取所有启用了重要新闻推送的用户
      const users = await prisma.notificationPreference.findMany({
        where: {
          importantNewsEnabled: true,
          emailEnabled: true,
        },
        select: {
          userId: true,
        },
      });

      console.log(`[NewsPushService] 评估新内容推送: ${content.title} (${users.length} 个用户)`);

      // 添加到推送队列
      for (const user of users) {
        const shouldPush = await this.evaluateContentForPush(contentId, user.userId);
        
        if (shouldPush) {
          this.addToPushQueue(contentId, user.userId);
        }
      }

      const queueSize = this.pushQueue.get(contentId)?.size || 0;
      console.log(`[NewsPushService] 已添加到推送队列: ${queueSize} 个用户`);
    } catch (error) {
      console.error('[NewsPushService] 自动推送新内容失败:', error);
    }
  }

  /**
   * 获取推送队列状态
   */
  getQueueStatus(): {
    totalContents: number;
    totalUsers: number;
    contentDetails: Array<{ contentId: string; userCount: number }>;
  } {
    const contentDetails: Array<{ contentId: string; userCount: number }> = [];
    let totalUsers = 0;

    for (const [contentId, userIds] of this.pushQueue.entries()) {
      const userCount = userIds.size;
      contentDetails.push({ contentId, userCount });
      totalUsers += userCount;
    }

    return {
      totalContents: this.pushQueue.size,
      totalUsers,
      contentDetails,
    };
  }
}

// 导出单例实例
export const newsPushService = new NewsPushService();

