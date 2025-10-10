/**
 * 每日TOP10 API路由
 * Story 2.6: 每日TOP10自动生成
 */

import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { dailyTop10Service } from '../services/daily-top10.service';
import { logger } from '../utils/logger';

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// 应用认证中间件到所有路由
router.use(authMiddleware.authenticate);

/**
 * POST /api/daily-top10/generate
 * 生成每日TOP10
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { date, forceRegenerate = false } = req.body;

    logger.info('触发TOP10生成', { date, forceRegenerate });

    const targetDate = date ? new Date(date) : new Date();
    const result = await dailyTop10Service.generateDailyTop10(targetDate, forceRegenerate);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('生成TOP10失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/daily-top10/today
 * 获取今日TOP10
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const result = await dailyTop10Service.getTodayTop10();

    if (!result) {
      return res.status(404).json({
        success: false,
        error: '今日TOP10尚未生成'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('获取今日TOP10失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/daily-top10/:date
 * 获取指定日期的TOP10
 */
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: '无效的日期格式'
      });
    }

    const result = await dailyTop10Service.getTop10ByDate(targetDate);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: '该日期的TOP10不存在'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('获取TOP10失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/daily-top10/history
 * 获取TOP10历史记录
 */
router.get('/list/history', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = '30' } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const maxLimit = parseInt(limit as string);

    const result = await dailyTop10Service.getTop10History(start, end, maxLimit);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('获取TOP10历史失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/daily-top10/:id/publish
 * 发布TOP10
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await dailyTop10Service.publishTop10(id);

    logger.info('TOP10已发布', { id });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('发布TOP10失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/daily-top10/:id/adjust
 * 手动调整TOP10
 */
router.post('/:id/adjust', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, contentId, newPosition, reason } = req.body;

    // 验证action
    if (!['ADD', 'REMOVE', 'REORDER'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: '无效的操作类型'
      });
    }

    // TODO: 实现手动调整逻辑
    // 这需要在DailyTop10Service中添加adjustTop10方法

    logger.info('TOP10手动调整', { id, action, contentId, newPosition });

    res.json({
      success: true,
      message: '手动调整功能待实现'
    });
  } catch (error: any) {
    logger.error('调整TOP10失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/daily-top10/stats/summary
 * 获取统计摘要
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { period = 'week' } = req.query;

    // TODO: 实现统计功能
    // 这需要在DailyTop10Service中添加getStats方法

    res.json({
      success: true,
      message: '统计功能待实现'
    });
  } catch (error: any) {
    logger.error('获取统计摘要失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

