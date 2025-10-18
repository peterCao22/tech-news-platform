/**
 * Story 4.5: 智能通知与提醒
 * 通知管理服务 - 管理用户通知偏好、发送通知、记录日志
 */

import { prisma } from '@tech-news-platform/database';
import {
  NotificationPreference,
  NotificationLog,
  NotificationFrequency,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '@tech-news-platform/database';
import type { EmailOptions } from './email.service';

// 通知请求接口
export interface NotificationRequest {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  content: string;
  metadata?: any;
  template?: string;
  templateData?: any;
}

// 分页选项
interface PaginationOptions {
  page?: number;
  limit?: number;
  type?: NotificationType;
  status?: NotificationStatus;
}

// 分页结果
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class NotificationService {
  /**
   * 获取用户通知偏好
   */
  async getUserPreference(userId: string): Promise<NotificationPreference | null> {
    try {
      let preference = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // 如果不存在，创建默认偏好
      if (!preference) {
        preference = await this.createDefaultPreference(userId);
      }

      return preference;
    } catch (error) {
      console.error('[NotificationService] 获取通知偏好失败:', error);
      throw error;
    }
  }

  /**
   * 创建默认通知偏好
   */
  private async createDefaultPreference(userId: string): Promise<NotificationPreference> {
    try {
      // 获取用户信息以设置邮箱
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      return await prisma.notificationPreference.create({
        data: {
          userId,
          stockAlertEnabled: true,
          importantNewsEnabled: true,
          top10DigestEnabled: true,
          frequency: NotificationFrequency.DAILY,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          digestTime: '08:00',
          stockAlertThreshold: 5.0,
          minNewsScore: 85.0,
          emailEnabled: true,
          email: user?.email || null,
        },
      });
    } catch (error) {
      console.error('[NotificationService] 创建默认通知偏好失败:', error);
      throw error;
    }
  }

  /**
   * 更新通知偏好
   */
  async updatePreference(
    userId: string,
    data: Partial<Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<NotificationPreference> {
    try {
      // 确保偏好存在
      await this.getUserPreference(userId);

      return await prisma.notificationPreference.update({
        where: { userId },
        data,
      });
    } catch (error) {
      console.error('[NotificationService] 更新通知偏好失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否在静默时间内
   */
  isInQuietHours(preference: NotificationPreference): boolean {
    if (!preference.quietHoursStart || !preference.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const start = preference.quietHoursStart;
    const end = preference.quietHoursEnd;

    // 处理跨天的情况（如22:00 - 08:00）
    if (start > end) {
      return currentTime >= start || currentTime < end;
    } else {
      return currentTime >= start && currentTime < end;
    }
  }

  /**
   * 检查是否应该发送通知
   */
  async shouldSendNotification(
    userId: string,
    type: NotificationType
  ): Promise<{ should: boolean; reason?: string; preference?: NotificationPreference }> {
    try {
      const preference = await this.getUserPreference(userId);

      if (!preference) {
        return { should: false, reason: '用户通知偏好不存在' };
      }

      // 检查频率
      if (preference.frequency === NotificationFrequency.OFF) {
        return { should: false, reason: '用户已关闭所有通知', preference };
      }

      // 检查类型开关
      switch (type) {
        case NotificationType.STOCK_ALERT:
          if (!preference.stockAlertEnabled) {
            return { should: false, reason: '股票异动通知已关闭', preference };
          }
          break;
        case NotificationType.IMPORTANT_NEWS:
          if (!preference.importantNewsEnabled) {
            return { should: false, reason: '重要新闻推送已关闭', preference };
          }
          break;
        case NotificationType.TOP10_DIGEST:
          if (!preference.top10DigestEnabled) {
            return { should: false, reason: 'TOP10摘要通知已关闭', preference };
          }
          break;
      }

      // 检查静默时间（仅对实时通知）
      if (
        preference.frequency === NotificationFrequency.REALTIME &&
        type !== NotificationType.TOP10_DIGEST &&
        this.isInQuietHours(preference)
      ) {
        return { should: false, reason: '当前在静默时间内', preference };
      }

      // 检查邮件地址
      if (!preference.email || !preference.emailEnabled) {
        return { should: false, reason: '邮件地址未配置或邮件通知已关闭', preference };
      }

      return { should: true, preference };
    } catch (error) {
      console.error('[NotificationService] 检查通知条件失败:', error);
      return { should: false, reason: '检查失败' };
    }
  }

  /**
   * 发送通知（统一入口）
   */
  async sendNotification(request: NotificationRequest): Promise<boolean> {
    try {
      // 检查是否应该发送
      const check = await this.shouldSendNotification(request.userId, request.type);
      
      if (!check.should) {
        console.log(`[NotificationService] 跳过通知: ${check.reason}`);
        // 记录日志（状态为PENDING）
        await this.logNotification({
          ...request,
          status: NotificationStatus.PENDING,
          errorMessage: check.reason,
        });
        return false;
      }

      const preference = check.preference!;

      // 根据渠道发送通知
      let success = false;
      let errorMessage: string | undefined;

      try {
        if (request.channel === NotificationChannel.EMAIL) {
          await this.sendEmailNotification(request, preference);
          success = true;
        } else {
          throw new Error(`不支持的通知渠道: ${request.channel}`);
        }
      } catch (error) {
        console.error('[NotificationService] 发送通知失败:', error);
        errorMessage = error instanceof Error ? error.message : '未知错误';
        success = false;
      }

      // 记录通知日志
      await this.logNotification({
        ...request,
        status: success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        errorMessage,
        sentAt: success ? new Date() : undefined,
      });

      return success;
    } catch (error) {
      console.error('[NotificationService] 发送通知过程出错:', error);
      return false;
    }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(
    request: NotificationRequest,
    preference: NotificationPreference
  ): Promise<void> {
    if (!preference.email) {
      throw new Error('邮件地址未配置');
    }

    // 动态导入emailService，避免循环依赖
    const { emailService } = await import('./email.service');

    // 如果有模板和模板数据，使用模板
    if (request.template && request.templateData) {
      await emailService.sendTemplateEmail(
        request.template,
        request.templateData,
        preference.email,
        request.subject
      );
    } else {
      // 否则直接发送HTML内容
      await emailService.sendEmail({
        to: preference.email,
        subject: request.subject,
        html: request.content,
      });
    }
  }

  /**
   * 记录通知日志
   */
  private async logNotification(data: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    subject: string;
    content: string;
    status: NotificationStatus;
    sentAt?: Date;
    errorMessage?: string;
    metadata?: any;
  }): Promise<NotificationLog> {
    try {
      return await prisma.notificationLog.create({
        data: {
          userId: data.userId,
          type: data.type,
          channel: data.channel,
          subject: data.subject,
          content: data.content,
          status: data.status,
          sentAt: data.sentAt,
          errorMessage: data.errorMessage,
          metadata: data.metadata,
        },
      });
    } catch (error) {
      console.error('[NotificationService] 记录通知日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取通知历史
   */
  async getNotificationHistory(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<NotificationLog>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      
      if (options.type) {
        where.type = options.type;
      }
      
      if (options.status) {
        where.status = options.status;
      }

      const [data, total] = await Promise.all([
        prisma.notificationLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notificationLog.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('[NotificationService] 获取通知历史失败:', error);
      throw error;
    }
  }

  /**
   * 批量发送通知
   */
  async sendBatchNotifications(requests: NotificationRequest[]): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    let success = 0;
    let failed = 0;

    for (const request of requests) {
      const result = await this.sendNotification(request);
      if (result) {
        success++;
      } else {
        failed++;
      }
      
      // 添加延迟，避免发送过快
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      success,
      failed,
      total: requests.length,
    };
  }

  /**
   * 删除旧的通知日志（数据清理）
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.notificationLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`[NotificationService] 清理了 ${result.count} 条旧通知日志`);
      return result.count;
    } catch (error) {
      console.error('[NotificationService] 清理通知日志失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const notificationService = new NotificationService();

