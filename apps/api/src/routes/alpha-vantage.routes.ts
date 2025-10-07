// 科技新闻聚合平台 - Alpha Vantage 路由
// 提供 Alpha Vantage 数据获取的 API 端点

import { Router, Request, Response } from 'express';
import { alphaVantageService } from '../services/alpha-vantage.service';
import { schedulerService } from '../services/scheduler.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * 手动触发 Alpha Vantage 数据获取
 * POST /api/alpha-vantage/fetch
 */
router.post('/fetch', authenticate, authorize(['admin', 'editor']), async (req: Request, res: Response) => {
  try {
    logger.info('手动触发 Alpha Vantage 数据获取', { userId: req.user?.id });

    const result = await schedulerService.triggerAlphaVantageFetch();

    res.json({
      success: true,
      message: 'Alpha Vantage 数据获取任务已启动',
      data: result
    });
  } catch (error) {
    logger.error('手动触发 Alpha Vantage 数据获取失败', { error, userId: req.user?.id });
    
    res.status(500).json({
      success: false,
      message: 'Alpha Vantage 数据获取任务启动失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取科技新闻
 * GET /api/alpha-vantage/tech-news
 */
router.get('/tech-news', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    logger.info('获取 Alpha Vantage 科技新闻', { limit, userId: req.user?.id });

    const result = await alphaVantageService.fetchAndSaveTechNews(limit);

    res.json({
      success: true,
      message: '科技新闻获取完成',
      data: result
    });
  } catch (error) {
    logger.error('获取 Alpha Vantage 科技新闻失败', { error, userId: req.user?.id });
    
    res.status(500).json({
      success: false,
      message: '获取科技新闻失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取 AI 新闻
 * GET /api/alpha-vantage/ai-news
 */
router.get('/ai-news', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    logger.info('获取 Alpha Vantage AI 新闻', { limit, userId: req.user?.id });

    const result = await alphaVantageService.fetchAndSaveAINews(limit);

    res.json({
      success: true,
      message: 'AI 新闻获取完成',
      data: result
    });
  } catch (error) {
    logger.error('获取 Alpha Vantage AI 新闻失败', { error, userId: req.user?.id });
    
    res.status(500).json({
      success: false,
      message: '获取 AI 新闻失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取公司新闻
 * GET /api/alpha-vantage/company-news/:ticker
 */
router.get('/company-news/:ticker', authenticate, async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    logger.info('获取 Alpha Vantage 公司新闻', { ticker, limit, userId: req.user?.id });

    const result = await alphaVantageService.fetchAndSaveCompanyNews(ticker, limit);

    res.json({
      success: true,
      message: `${ticker} 公司新闻获取完成`,
      data: result
    });
  } catch (error) {
    logger.error('获取 Alpha Vantage 公司新闻失败', { error, userId: req.user?.id });
    
    res.status(500).json({
      success: false,
      message: '获取公司新闻失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取任务状态
 * GET /api/alpha-vantage/status
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const taskStatus = schedulerService.getTaskStatus();
    const alphaVantageTask = taskStatus.find(task => task.name === 'alpha-vantage-fetch');

    res.json({
      success: true,
      data: {
        taskStatus: alphaVantageTask || null,
        allTasks: taskStatus
      }
    });
  } catch (error) {
    logger.error('获取 Alpha Vantage 任务状态失败', { error, userId: req.user?.id });
    
    res.status(500).json({
      success: false,
      message: '获取任务状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;
