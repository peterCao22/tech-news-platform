// 科技新闻聚合平台 - Polygon API 路由
// 提供 Polygon 新闻数据获取接口

import { Router, type Router as ExpressRouter } from 'express';
import { polygonService } from '../services/polygon.service';
import { logger } from '../utils/logger';

const router: ExpressRouter = Router();

/**
 * 手动触发 Polygon 数据获取
 */
router.post('/fetch-and-save', async (req, res) => {
  try {
    logger.info('收到手动触发 Polygon 数据获取请求');
    const result = await polygonService.executeFullFetchTask();
    
    res.json({
      success: true,
      message: 'Polygon 数据获取任务已触发并完成',
      data: result
    });
  } catch (error) {
    logger.error('手动触发 Polygon 数据获取失败', { error });
    res.status(500).json({
      success: false,
      message: '手动触发 Polygon 数据获取失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 获取科技新闻
 */
router.post('/tech-news', async (req, res) => {
  try {
    const { limit = 50 } = req.body;
    logger.info('收到获取 Polygon 科技新闻请求', { limit });
    
    const result = await polygonService.fetchAndSaveTechNews(limit);
    
    res.json({
      success: result.success,
      message: 'Polygon 科技新闻获取完成',
      data: result
    });
  } catch (error) {
    logger.error('获取 Polygon 科技新闻失败', { error });
    res.status(500).json({
      success: false,
      message: '获取 Polygon 科技新闻失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 获取 AI 新闻
 */
router.post('/ai-news', async (req, res) => {
  try {
    const { limit = 30 } = req.body;
    logger.info('收到获取 Polygon AI 新闻请求', { limit });
    
    const result = await polygonService.fetchAndSaveAINews(limit);
    
    res.json({
      success: result.success,
      message: 'Polygon AI 新闻获取完成',
      data: result
    });
  } catch (error) {
    logger.error('获取 Polygon AI 新闻失败', { error });
    res.status(500).json({
      success: false,
      message: '获取 Polygon AI 新闻失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 获取公司新闻
 */
router.post('/company-news', async (req, res) => {
  try {
    const { symbol, limit = 20 } = req.body;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: '缺少股票代码参数'
      });
    }
    
    logger.info('收到获取 Polygon 公司新闻请求', { symbol, limit });
    
    const result = await polygonService.fetchAndSaveCompanyNews(symbol, limit);
    
    res.json({
      success: result.success,
      message: `Polygon ${symbol} 公司新闻获取完成`,
      data: result
    });
  } catch (error) {
    logger.error('获取 Polygon 公司新闻失败', { error });
    res.status(500).json({
      success: false,
      message: '获取 Polygon 公司新闻失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 获取健康状态
 */
router.get('/health', async (req, res) => {
  try {
    const { PolygonClient } = await import('../services/api/polygon-client');
    const { ApiConfigurationService } = await import('../services/api-configuration.service');
    
    const client = await ApiConfigurationService.getPolygonClient();
    const isHealthy = await client.healthCheck();
    
    res.json({
      success: true,
      healthy: isHealthy,
      message: isHealthy ? 'Polygon API 连接正常' : 'Polygon API 连接异常'
    });
  } catch (error) {
    logger.error('Polygon 健康检查失败', { error });
    res.status(500).json({
      success: false,
      healthy: false,
      message: 'Polygon 健康检查失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
