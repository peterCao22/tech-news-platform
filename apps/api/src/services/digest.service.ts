/**
 * Story 4.5: 智能通知与提醒
 * TOP10摘要服务 - 定时发送每日TOP10内容摘要
 */

import { prisma } from '@tech-news-platform/database';
import { Content, NotificationType, NotificationChannel } from '@tech-news-platform/database';
import { notificationService } from './notification.service';

// 摘要内容
export interface DigestContent {
  date: string;
  top10News: Array<{
    id: string;
    title: string;
    summary: string | null;
    description: string | null;
    category: string | null;
    score: number | null;
    aiScore?: number | null;
    source: string;
    publishedAt: Date;
    tags: string[];
  }>;
  isPersonalized: boolean;
}

export class DigestService {
  constructor() {
    // 移除PersonalizationService依赖，避免循环依赖
  }

  /**
   * 生成TOP10摘要（基于全局或个性化）
   */
  async generateTop10Digest(userId: string): Promise<DigestContent> {
    try {
      // 检查用户是否有个性化偏好
      const preference = await prisma.userPreference.findUnique({
        where: { userId },
        include: {
          interests: true,
          followings: true,
          sourceWeights: true,
        },
      });

      const hasPreferences =
        preference &&
        (preference.interests.length > 0 ||
          preference.followings.length > 0 ||
          preference.sourceWeights.length > 0);

      let top10News: Content[];

      if (hasPreferences) {
        // 生成个性化TOP10（简化版，直接查询数据库）
        console.log(`[DigestService] 生成个性化TOP10摘要 (用户: ${userId})`);
        top10News = await this.getPersonalizedTop10Simple(userId, preference);
      } else {
        // 使用全局TOP10
        console.log(`[DigestService] 使用全局TOP10摘要 (用户: ${userId})`);
        top10News = await this.getGlobalTop10();
      }

      // 格式化数据
      const formattedNews = top10News.map((news) => ({
        id: news.id,
        title: news.title,
        summary: news.summary,
        description: news.description,
        category: news.category,
        score: news.score,
        aiScore: news.score, // 兼容旧字段名
        source: (news as any).source?.name || '未知来源',
        publishedAt: news.publishedAt,
        tags: news.tags || [],
      }));

      return {
        date: new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        top10News: formattedNews,
        isPersonalized: hasPreferences || false,
      };
    } catch (error) {
      console.error('[DigestService] 生成TOP10摘要失败:', error);
      throw error;
    }
  }

  /**
   * 获取个性化TOP10（简化版）
   */
  private async getPersonalizedTop10Simple(userId: string, preference: any): Promise<Content[]> {
    try {
      // 获取用户兴趣的标签
      const interestTags = preference.interests.map((i: any) => i.tag);
      
      // 查询最近24小时内的内容，优先匹配用户兴趣
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const contents = await prisma.content.findMany({
        where: {
          status: 'PROCESSED',
          publishedAt: {
            gte: yesterday,
          },
        },
        include: {
          source: true,
        },
        orderBy: {
          score: 'desc',
        },
        take: 30, // 先取30条
      });

      // 简单的匹配算法：优先返回匹配用户兴趣的内容
      const matched: Content[] = [];
      const unmatched: Content[] = [];

      for (const content of contents) {
        const contentTags = (content.tags || []).map((t: string) => t.toLowerCase());
        const hasMatch = interestTags.some((tag: string) =>
          contentTags.includes(tag.toLowerCase())
        );

        if (hasMatch) {
          matched.push(content);
        } else {
          unmatched.push(content);
        }
      }

      // 返回匹配的内容优先，不足10条时补充其他高分内容
      return [...matched, ...unmatched].slice(0, 10);
    } catch (error) {
      console.error('[DigestService] 获取个性化TOP10失败:', error);
      // 出错时fallback到全局TOP10
      return this.getGlobalTop10();
    }
  }

  /**
   * 获取全局TOP10
   */
  private async getGlobalTop10(): Promise<Content[]> {
    try {
      // 获取今天的DailyDigest
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const digest = await prisma.dailyDigest.findFirst({
        where: {
          date: today,
        },
      });

      if (digest && digest.topContent) {
        // 从DailyDigest获取TOP10
        const contentIds = digest.topContent;
        
        const contents = await prisma.content.findMany({
          where: {
            id: {
              in: contentIds,
            },
          },
          include: {
            source: true,
          },
        });

        // 按contentIds的顺序排序
        const orderedContents = contentIds
          .map((id) => contents.find((c) => c.id === id))
          .filter((c) => c !== undefined) as Content[];

        return orderedContents.slice(0, 10);
      }

      // 如果没有DailyDigest，查询最近24小时内评分最高的内容
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      return await prisma.content.findMany({
        where: {
          status: 'PROCESSED',
          publishedAt: {
            gte: yesterday,
          },
        },
        include: {
          source: true,
        },
        orderBy: {
          score: 'desc',
        },
        take: 10,
      });
    } catch (error) {
      console.error('[DigestService] 获取全局TOP10失败:', error);
      return [];
    }
  }

  /**
   * 发送摘要邮件给单个用户
   */
  async sendDigestEmail(userId: string): Promise<boolean> {
    try {
      // 检查用户是否启用了TOP10摘要
      const notifPref = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!notifPref || !notifPref.top10DigestEnabled) {
        console.log(`[DigestService] 用户 ${userId} 未启用TOP10摘要`);
        return false;
      }

      // 生成摘要
      const digest = await this.generateTop10Digest(userId);

      if (digest.top10News.length === 0) {
        console.log(`[DigestService] 没有内容可发送 (用户: ${userId})`);
        return false;
      }

      // 发送通知
      await notificationService.sendNotification({
        userId,
        type: NotificationType.TOP10_DIGEST,
        channel: NotificationChannel.EMAIL,
        subject: `📰 今日科技新闻 TOP10 - ${digest.date}`,
        content: '',
        template: 'top10-digest',
        templateData: digest,
        metadata: {
          date: digest.date,
          isPersonalized: digest.isPersonalized,
          count: digest.top10News.length,
        },
      });

      console.log(`[DigestService] ✅ 已发送TOP10摘要 (用户: ${userId})`);
      return true;
    } catch (error) {
      console.error('[DigestService] 发送摘要邮件失败:', error);
      return false;
    }
  }

  /**
   * 定时发送摘要（Cron任务）
   */
  async scheduleDigestSend(): Promise<{
    total: number;
    sent: number;
    skipped: number;
    failed: number;
  }> {
    try {
      console.log('[DigestService] 开始定时发送TOP10摘要...');

      // 获取所有启用了TOP10摘要的用户
      const users = await prisma.notificationPreference.findMany({
        where: {
          top10DigestEnabled: true,
          emailEnabled: true,
        },
        select: {
          userId: true,
          digestTime: true,
        },
      });

      console.log(`[DigestService] 找到 ${users.length} 个用户启用了TOP10摘要`);

      let sent = 0;
      let skipped = 0;
      let failed = 0;

      // 检查当前时间
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      for (const user of users) {
        try {
          // 检查是否是用户设置的发送时间
          const digestTime = user.digestTime || '08:00';
          const [targetHour, targetMinute] = digestTime.split(':').map(Number);
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          // 如果不是设置的时间（±5分钟容差），跳过
          if (
            Math.abs(currentHour - targetHour) > 0 ||
            Math.abs(currentMinute - targetMinute) > 5
          ) {
            skipped++;
            continue;
          }

          const success = await this.sendDigestEmail(user.userId);
          
          if (success) {
            sent++;
          } else {
            skipped++;
          }

          // 添加延迟，避免发送过快
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`[DigestService] 发送摘要给用户 ${user.userId} 失败:`, error);
          failed++;
        }
      }

      console.log(
        `[DigestService] TOP10摘要发送完成: 总数=${users.length}, 发送=${sent}, 跳过=${skipped}, 失败=${failed}`
      );

      return {
        total: users.length,
        sent,
        skipped,
        failed,
      };
    } catch (error) {
      console.error('[DigestService] 定时发送摘要失败:', error);
      return {
        total: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
      };
    }
  }

  /**
   * 批量发送摘要给所有用户（管理员手动触发）
   */
  async sendDigestToAll(): Promise<{
    total: number;
    sent: number;
    failed: number;
  }> {
    try {
      console.log('[DigestService] 开始批量发送TOP10摘要...');

      const users = await prisma.notificationPreference.findMany({
        where: {
          top10DigestEnabled: true,
          emailEnabled: true,
        },
        select: {
          userId: true,
        },
      });

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          const success = await this.sendDigestEmail(user.userId);
          
          if (success) {
            sent++;
          } else {
            failed++;
          }

          // 添加延迟
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`[DigestService] 发送摘要给用户 ${user.userId} 失败:`, error);
          failed++;
        }
      }

      console.log(
        `[DigestService] 批量发送完成: 总数=${users.length}, 发送=${sent}, 失败=${failed}`
      );

      return {
        total: users.length,
        sent,
        failed,
      };
    } catch (error) {
      console.error('[DigestService] 批量发送摘要失败:', error);
      return {
        total: 0,
        sent: 0,
        failed: 0,
      };
    }
  }
}

// 导出单例实例
export const digestService = new DigestService();

