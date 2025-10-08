import { Router, Request, Response } from 'express';
import { geminiNewsService, NewsQueryType } from '../services/gemini-news.service';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router: Router = Router();

// 应用认证中间件到所有Gemini新闻路由
router.use(authMiddleware);

/**
 * 获取Gemini新闻
 */
router.get('/news', [
  query('type').optional().isIn(['tech_news', 'ai_news', 'stock_news']).withMessage('查询类型必须是有效的新闻类型'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('限制数量必须在1-50之间'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { type, limit = 10 } = req.query;
    
    let newsItems = [];
    
    if (type) {
      // 获取指定类型的新闻
      const result = await geminiNewsService.fetchDailyNews(type as NewsQueryType);
      newsItems = result.newsItems.slice(0, parseInt(limit as string));
    } else {
      // 获取所有类型的新闻
      const [techNews, aiNews, stockNews] = await Promise.all([
        geminiNewsService.fetchTechNews(),
        geminiNewsService.fetchAINews(),
        geminiNewsService.fetchStockNews()
      ]);
      
      newsItems = [...techNews, ...aiNews, ...stockNews]
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, parseInt(limit as string));
    }
    
    res.json({
      success: true,
      data: {
        newsItems,
        total: newsItems.length,
        type: type || 'all'
      }
    });
  } catch (error) {
    logger.error('获取Gemini新闻失败', { error, query: req.query });
    res.status(500).json({
      success: false,
      message: '获取Gemini新闻失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 手动触发Gemini查询
 */
router.post('/trigger-query', [
  body('type').isIn(['tech_news', 'ai_news', 'stock_news']).withMessage('查询类型必须是有效的新闻类型'),
  body('force').optional().isBoolean().withMessage('强制查询必须是布尔值'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { type, force = false } = req.body;
    
    logger.info('手动触发Gemini查询', { type, force });
    
    const result = await geminiNewsService.fetchDailyNews(type as NewsQueryType);
    
    res.json({
      success: result.success,
      message: result.success ? '查询执行成功' : '查询执行失败',
      data: {
        queryType: result.queryType,
        totalFetched: result.totalFetched,
        totalSaved: result.totalSaved,
        errors: result.errors,
        queryTime: result.queryTime
      }
    });
  } catch (error) {
    logger.error('手动触发Gemini查询失败', { error, body: req.body });
    res.status(500).json({
      success: false,
      message: '手动触发Gemini查询失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取查询历史
 */
router.get('/query-history', [
  query('type').optional().isIn(['tech_news', 'ai_news', 'stock_news']).withMessage('查询类型必须是有效的新闻类型'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { type, limit = 20 } = req.query;
    
    const history = geminiNewsService.getQueryHistory(type as NewsQueryType)
      .slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: {
        history,
        total: history.length,
        type: type || 'all'
      }
    });
  } catch (error) {
    logger.error('获取Gemini查询历史失败', { error, query: req.query });
    res.status(500).json({
      success: false,
      message: '获取Gemini查询历史失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取查询统计
 */
router.get('/query-stats', async (req: Request, res: Response) => {
  try {
    const stats = geminiNewsService.getQueryStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取Gemini查询统计失败', { error });
    res.status(500).json({
      success: false,
      message: '获取Gemini查询统计失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取科技新闻
 */
router.get('/tech-news', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('限制数量必须在1-50之间'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    
    const newsItems = await geminiNewsService.fetchTechNews();
    const limitedNews = newsItems.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: {
        newsItems: limitedNews,
        total: limitedNews.length,
        type: 'tech_news'
      }
    });
  } catch (error) {
    logger.error('获取Gemini科技新闻失败', { error, query: req.query });
    res.status(500).json({
      success: false,
      message: '获取Gemini科技新闻失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取AI新闻
 */
router.get('/ai-news', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('限制数量必须在1-50之间'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    
    const newsItems = await geminiNewsService.fetchAINews();
    const limitedNews = newsItems.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: {
        newsItems: limitedNews,
        total: limitedNews.length,
        type: 'ai_news'
      }
    });
  } catch (error) {
    logger.error('获取Gemini AI新闻失败', { error, query: req.query });
    res.status(500).json({
      success: false,
      message: '获取Gemini AI新闻失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取股票新闻
 */
router.get('/stock-news', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('限制数量必须在1-50之间'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    
    const newsItems = await geminiNewsService.fetchStockNews();
    const limitedNews = newsItems.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: {
        newsItems: limitedNews,
        total: limitedNews.length,
        type: 'stock_news'
      }
    });
  } catch (error) {
    logger.error('获取Gemini股票新闻失败', { error, query: req.query });
    res.status(500).json({
      success: false,
      message: '获取Gemini股票新闻失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 批量获取所有类型新闻
 */
router.get('/all-news', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { limit = 30 } = req.query;
    
    const [techNews, aiNews, stockNews] = await Promise.all([
      geminiNewsService.fetchTechNews(),
      geminiNewsService.fetchAINews(),
      geminiNewsService.fetchStockNews()
    ]);
    
    const allNews = [...techNews, ...aiNews, ...stockNews]
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      data: {
        newsItems: allNews,
        total: allNews.length,
        breakdown: {
          techNews: techNews.length,
          aiNews: aiNews.length,
          stockNews: stockNews.length
        }
      }
    });
  } catch (error) {
    logger.error('批量获取Gemini新闻失败', { error, query: req.query });
    res.status(500).json({
      success: false,
      message: '批量获取Gemini新闻失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取Gemini服务状态
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const stats = geminiNewsService.getQueryStats();
    const recentHistory = geminiNewsService.getQueryHistory().slice(0, 5);
    
    res.json({
      success: true,
      data: {
        serviceStatus: 'active',
        stats,
        recentQueries: recentHistory,
        lastUpdate: new Date()
      }
    });
  } catch (error) {
    logger.error('获取Gemini服务状态失败', { error });
    res.status(500).json({
      success: false,
      message: '获取Gemini服务状态失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
