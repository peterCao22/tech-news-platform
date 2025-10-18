/**
 * Story 4.5: 智能通知与提醒
 * 通知API路由 - 使用懒加载避免循环依赖
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { NotificationFrequency } from '@tech-news-platform/database';

const router: Router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 懒加载服务
const getNotificationService = async () => {
  const { notificationService } = await import('../services/notification.service');
  return notificationService;
};

const getEmailService = async () => {
  const { emailService } = await import('../services/email.service');
  return emailService;
};

const getDigestService = async () => {
  const { digestService } = await import('../services/digest.service');
  return digestService;
};

/**
 * GET /api/notifications/preferences
 * 获取用户通知偏好
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user!.id;
    const notificationService = await getNotificationService();

    const preference = await notificationService.getUserPreference(userId);

    res.json({
      success: true,
      data: preference,
    });
  } catch (error) {
    console.error('获取通知偏好失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知偏好失败',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * PUT /api/notifications/preferences
 * 更新用户通知偏好
 */
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user!.id;
    const data = req.body;
    const notificationService = await getNotificationService();
    const emailService = await getEmailService();

    // 验证数据
    if (data.frequency && !Object.values(NotificationFrequency).includes(data.frequency)) {
      return res.status(400).json({
        success: false,
        message: '无效的通知频率',
      });
    }

    if (data.stockAlertThreshold !== undefined && (data.stockAlertThreshold < 0 || data.stockAlertThreshold > 100)) {
      return res.status(400).json({
        success: false,
        message: '股票异动阈值必须在0-100之间',
      });
    }

    if (data.minNewsScore !== undefined && (data.minNewsScore < 0 || data.minNewsScore > 100)) {
      return res.status(400).json({
        success: false,
        message: '最低新闻评分必须在0-100之间',
      });
    }

    // 验证邮箱格式
    if (data.email && !emailService.validateEmail(data.email)) {
      return res.status(400).json({
        success: false,
        message: '无效的邮箱地址',
      });
    }

    const preference = await notificationService.updatePreference(userId, data);

    res.json({
      success: true,
      data: preference,
      message: '通知偏好已更新',
    });
  } catch (error) {
    console.error('更新通知偏好失败:', error);
    res.status(500).json({
      success: false,
      message: '更新通知偏好失败',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * POST /api/notifications/test-email
 * 发送测试邮件
 */
router.post('/test-email', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { email } = req.body;
    const notificationService = await getNotificationService();
    const emailService = await getEmailService();

    // 获取用户偏好
    const preference = await notificationService.getUserPreference(userId);
    const recipientEmail = email || preference?.email;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: '请提供邮箱地址或先配置通知偏好',
      });
    }

    // 发送测试邮件
    await emailService.sendTestEmail(recipientEmail);

    res.json({
      success: true,
      message: `测试邮件已发送到 ${recipientEmail}`,
    });
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    res.status(500).json({
      success: false,
      message: '发送测试邮件失败',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * POST /api/notifications/send-digest
 * 手动发送个人TOP10摘要
 */
router.post('/send-digest', async (req, res) => {
  try {
    const userId = req.user!.id;
    const digestService = await getDigestService();

    await digestService.sendDigestEmail(userId);

    res.json({
      success: true,
      message: 'TOP10摘要已发送',
    });
  } catch (error) {
    console.error('发送TOP10摘要失败:', error);
    res.status(500).json({
      success: false,
      message: '发送TOP10摘要失败',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * GET /api/notifications/history
 * 获取用户通知历史
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, type, status } = req.query;
    const notificationService = await getNotificationService();

    const result = await notificationService.getNotificationHistory(userId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      type: type as any,
      status: status as any,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取通知历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知历史失败',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * GET /api/notifications/stats
 * 获取用户通知统计
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user!.id;
    const notificationService = await getNotificationService();

    // 获取最近30天的通知日志
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await notificationService.getNotificationHistory(userId, {
      page: 1,
      limit: 1000,
    });

    const recentLogs = logs.data.filter(log => 
      new Date(log.createdAt) >= thirtyDaysAgo
    );

    // 统计各类型通知数量
    const totalLogs = recentLogs.length;
    const sentLogs = recentLogs.filter(log => log.status === 'SENT').length;
    const failedLogs = recentLogs.filter(log => log.status === 'FAILED').length;

    res.json({
      success: true,
      data: {
        summary: {
          total: totalLogs,
          sent: sentLogs,
          failed: failedLogs,
          successRate: totalLogs > 0 ? ((sentLogs / totalLogs) * 100).toFixed(2) + '%' : '0%',
        },
        recent: recentLogs.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('获取通知统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知统计失败',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

export default router;

