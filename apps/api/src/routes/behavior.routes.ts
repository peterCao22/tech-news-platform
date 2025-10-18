/**
 * Story 4.4: User Behavior Analytics - API Routes
 * 用户行为分析API路由
 * 
 * 提供用户行为追踪、阅读历史管理、参与度统计等API
 */

import { Router, Request, Response } from 'express';
import { 
  behaviorTrackingService, 
  readingHistoryService,
  engagementService,
  type BehaviorEvent
} from '../services/behavior.service';
import { implicitPreferenceService } from '../services/implicit-preference.service';
import { BehaviorEventType } from '@tech-news-platform/database';
import { authenticateToken } from '../middleware/auth.middleware';

const router: Router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// ============================================
// Phase 2: 行为追踪API
// ============================================

/**
 * POST /api/behavior/track
 * 批量追踪用户行为事件
 * 
 * 用途：前端SDK批量提交行为数据
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { events } = req.body;

    // 验证请求
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '事件列表不能为空',
      });
    }

    // 验证事件格式
    for (const event of events) {
      if (!event.eventType || !Object.values(BehaviorEventType).includes(event.eventType)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: `无效的事件类型: ${event.eventType}`,
        });
      }
    }

    // 追踪行为
    const result = await behaviorTrackingService.trackBehaviors(userId, events);

    res.json({
      success: true,
      data: result,
      message: `成功追踪 ${result.tracked} 个行为事件`,
    });
  } catch (error: any) {
    console.error('批量追踪行为失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '批量追踪行为失败',
    });
  }
});

/**
 * POST /api/behavior/:contentId/reading
 * 更新阅读历史
 * 
 * 用途：用户阅读内容时更新阅读详情
 */
router.post('/:contentId/reading', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { contentId } = req.params;
    const { duration, scrollDepth, isCompleted } = req.body;

    // 验证参数
    if (duration === undefined || scrollDepth === undefined) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'duration 和 scrollDepth 是必需的',
      });
    }

    // 更新阅读历史
    const history = await readingHistoryService.updateReadingHistory(
      userId,
      contentId,
      {
        duration: Number(duration),
        scrollDepth: Number(scrollDepth),
        isCompleted: Boolean(isCompleted),
      }
    );

    res.json({
      success: true,
      data: history,
      message: '阅读历史更新成功',
    });
  } catch (error: any) {
    console.error('更新阅读历史失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '更新阅读历史失败',
    });
  }
});

/**
 * POST /api/behavior/:contentId/bookmark
 * 收藏内容
 */
router.post('/:contentId/bookmark', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { contentId } = req.params;

    // 追踪收藏行为
    await behaviorTrackingService.trackBehavior(userId, {
      eventType: BehaviorEventType.BOOKMARK,
      contentId,
    });

    // 更新阅读历史
    const history = await readingHistoryService.bookmarkContent(userId, contentId);

    res.json({
      success: true,
      data: history,
      message: '收藏成功',
    });
  } catch (error: any) {
    console.error('收藏失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '收藏失败',
    });
  }
});

/**
 * DELETE /api/behavior/:contentId/bookmark
 * 取消收藏
 */
router.delete('/:contentId/bookmark', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { contentId } = req.params;

    const history = await readingHistoryService.unbookmarkContent(userId, contentId);

    res.json({
      success: true,
      data: history,
      message: '取消收藏成功',
    });
  } catch (error: any) {
    console.error('取消收藏失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '取消收藏失败',
    });
  }
});

/**
 * POST /api/behavior/:contentId/like
 * 点赞内容
 */
router.post('/:contentId/like', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { contentId } = req.params;

    // 追踪点赞行为
    await behaviorTrackingService.trackBehavior(userId, {
      eventType: BehaviorEventType.LIKE,
      contentId,
    });

    // 更新阅读历史
    const history = await readingHistoryService.likeContent(userId, contentId);

    res.json({
      success: true,
      data: history,
      message: '点赞成功',
    });
  } catch (error: any) {
    console.error('点赞失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '点赞失败',
    });
  }
});

/**
 * DELETE /api/behavior/:contentId/like
 * 取消点赞
 */
router.delete('/:contentId/like', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { contentId } = req.params;

    const history = await readingHistoryService.unlikeContent(userId, contentId);

    res.json({
      success: true,
      data: history,
      message: '取消点赞成功',
    });
  } catch (error: any) {
    console.error('取消点赞失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '取消点赞失败',
    });
  }
});

/**
 * POST /api/behavior/:contentId/share
 * 分享内容
 */
router.post('/:contentId/share', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { contentId } = req.params;

    // 追踪分享行为
    await behaviorTrackingService.trackBehavior(userId, {
      eventType: BehaviorEventType.SHARE,
      contentId,
    });

    // 更新阅读历史
    const history = await readingHistoryService.shareContent(userId, contentId);

    res.json({
      success: true,
      data: history,
      message: '分享成功',
    });
  } catch (error: any) {
    console.error('分享失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '分享失败',
    });
  }
});

// ============================================
// Phase 3: 行为查询API
// ============================================

/**
 * GET /api/behavior/history
 * 获取用户行为历史
 * 
 * Query参数:
 * - eventType: 事件类型筛选
 * - contentId: 内容ID筛选
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - page: 页码 (默认1)
 * - limit: 每页数量 (默认20)
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      eventType,
      contentId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const options: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    if (eventType) {
      options.eventType = eventType as BehaviorEventType;
    }

    if (contentId) {
      options.contentId = contentId as string;
    }

    if (startDate) {
      options.startDate = new Date(startDate as string);
    }

    if (endDate) {
      options.endDate = new Date(endDate as string);
    }

    const result = await behaviorTrackingService.getUserBehaviors(userId, options);

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('获取行为历史失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取行为历史失败',
    });
  }
});

/**
 * GET /api/behavior/reading-history
 * 获取阅读历史
 * 
 * Query参数:
 * - isBookmarked: 仅收藏的内容
 * - isLiked: 仅点赞的内容
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - page: 页码 (默认1)
 * - limit: 每页数量 (默认20)
 */
router.get('/reading-history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      isBookmarked,
      isLiked,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const options: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    if (isBookmarked !== undefined) {
      options.isBookmarked = isBookmarked === 'true';
    }

    if (isLiked !== undefined) {
      options.isLiked = isLiked === 'true';
    }

    if (startDate) {
      options.startDate = new Date(startDate as string);
    }

    if (endDate) {
      options.endDate = new Date(endDate as string);
    }

    const result = await readingHistoryService.getReadingHistory(userId, options);

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('获取阅读历史失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取阅读历史失败',
    });
  }
});

/**
 * DELETE /api/behavior/reading-history
 * 清除阅读历史
 */
router.delete('/reading-history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await readingHistoryService.clearReadingHistory(userId);

    res.json({
      success: true,
      data: result,
      message: `成功清除 ${result.deleted} 条阅读历史`,
    });
  } catch (error: any) {
    console.error('清除阅读历史失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '清除阅读历史失败',
    });
  }
});

/**
 * GET /api/behavior/engagement
 * 获取用户参与度统计
 */
router.get('/engagement', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const engagement = await engagementService.getUserEngagement(userId);

    if (!engagement) {
      return res.json({
        success: true,
        data: null,
        message: '用户参与度统计尚未生成',
      });
    }

    res.json({
      success: true,
      data: engagement,
    });
  } catch (error: any) {
    console.error('获取参与度统计失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取参与度统计失败',
    });
  }
});

/**
 * GET /api/behavior/stats
 * 获取用户行为统计
 * 
 * Query参数:
 * - period: 时间段 (day/week/month/all, 默认all)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { period = 'all' } = req.query;

    // 验证period参数
    const validPeriods = ['day', 'week', 'month', 'all'];
    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: `无效的时间段: ${period}。有效值: ${validPeriods.join(', ')}`,
      });
    }

    const stats = await engagementService.getBehaviorStats(
      userId,
      period as 'day' | 'week' | 'month' | 'all'
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('获取行为统计失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取行为统计失败',
    });
  }
});

/**
 * POST /api/behavior/daily-active
 * 更新每日活跃连续天数
 * 
 * 用途：每次用户访问时调用，更新活跃状态
 */
router.post('/daily-active', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await engagementService.updateDailyActiveStreak(userId);

    res.json({
      success: true,
      message: '活跃状态更新成功',
    });
  } catch (error: any) {
    console.error('更新活跃状态失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '更新活跃状态失败',
    });
  }
});

// ============================================
// Phase 4: 隐式偏好API
// ============================================

/**
 * POST /api/behavior/learn-preferences
 * 触发学习用户隐式偏好
 * 
 * 用途：手动触发偏好学习（通常由定时任务自动执行）
 */
router.post('/learn-preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await implicitPreferenceService.learnUserPreferences(userId);

    res.json({
      success: true,
      message: '隐式偏好学习完成',
    });
  } catch (error: any) {
    console.error('学习隐式偏好失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '学习隐式偏好失败',
    });
  }
});

/**
 * GET /api/behavior/implicit-preferences
 * 获取用户的隐式偏好
 * 
 * Query参数:
 * - type: 偏好类型 (category/source/topic/company)
 */
router.get('/implicit-preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type } = req.query;

    const preferences = await implicitPreferenceService.getUserImplicitPreferences(
      userId,
      type as any
    );

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    console.error('获取隐式偏好失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取隐式偏好失败',
    });
  }
});

/**
 * GET /api/behavior/preference-comparison
 * 对比显式偏好和隐式偏好
 * 
 * 用途：为用户提供偏好洞察
 */
router.get('/preference-comparison', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const comparison = await implicitPreferenceService.comparePreferences(userId);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    console.error('偏好对比失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '偏好对比失败',
    });
  }
});

/**
 * DELETE /api/behavior/implicit-preferences
 * 清除用户的隐式偏好数据
 */
router.delete('/implicit-preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await implicitPreferenceService.clearUserImplicitPreferences(userId);

    res.json({
      success: true,
      data: result,
      message: `成功清除 ${result.deleted} 条隐式偏好记录`,
    });
  } catch (error: any) {
    console.error('清除隐式偏好失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '清除隐式偏好失败',
    });
  }
});

export default router;

