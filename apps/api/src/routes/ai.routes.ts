import { Router, Request, Response } from 'express';
import { aiServiceManager } from '../services/ai/ai-service-manager';
import { logger } from '../utils/logger';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router: Router = Router();

// 应用认证中间件到所有AI路由
const authMiddleware = new AuthMiddleware();
router.use(authMiddleware.authenticate);

/**
 * 获取AI服务状态
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const statuses = await aiServiceManager.getAllProviderStatus();
    const currentStatus = aiServiceManager.getCurrentProviderStatus();
    
    res.json({
      success: true,
      data: {
        providers: statuses,
        currentProvider: currentStatus?.provider,
        isHealthy: currentStatus?.isHealthy
      }
    });
  } catch (error) {
    logger.error('获取AI服务状态失败', { error });
    res.status(500).json({
      success: false,
      message: '获取AI服务状态失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 生成文本
 */
router.post('/generate-text', [
  body('prompt').isString().notEmpty().withMessage('提示词不能为空'),
  body('options.maxTokens').optional().isInt({ min: 1, max: 4000 }).withMessage('最大token数必须在1-4000之间'),
  body('options.temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('温度参数必须在0-2之间'),
  body('options.model').optional().isString().withMessage('模型名称必须是字符串'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { prompt, options } = req.body;
    
    const result = await aiServiceManager.generateText(prompt, options);
    
    res.json({
      success: true,
      data: {
        text: result,
        provider: aiServiceManager.getCurrentProviderStatus()?.provider
      }
    });
  } catch (error) {
    logger.error('生成文本失败', { error, body: req.body });
    res.status(500).json({
      success: false,
      message: '生成文本失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 生成摘要
 */
router.post('/summarize', [
  body('content').isString().notEmpty().withMessage('内容不能为空'),
  body('options.maxTokens').optional().isInt({ min: 1, max: 4000 }).withMessage('最大token数必须在1-4000之间'),
  body('options.temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('温度参数必须在0-2之间'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { content, options } = req.body;
    
    const result = await aiServiceManager.generateSummary(content, options);
    
    res.json({
      success: true,
      data: {
        summary: result,
        provider: aiServiceManager.getCurrentProviderStatus()?.provider
      }
    });
  } catch (error) {
    logger.error('生成摘要失败', { error, body: req.body });
    res.status(500).json({
      success: false,
      message: '生成摘要失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 分析内容
 */
router.post('/analyze', [
  body('content').isString().notEmpty().withMessage('内容不能为空'),
  body('options.maxTokens').optional().isInt({ min: 1, max: 4000 }).withMessage('最大token数必须在1-4000之间'),
  body('options.temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('温度参数必须在0-2之间'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { content, options } = req.body;
    
    const result = await aiServiceManager.analyzeContent(content, options);
    
    res.json({
      success: true,
      data: {
        analysis: result,
        provider: aiServiceManager.getCurrentProviderStatus()?.provider
      }
    });
  } catch (error) {
    logger.error('分析内容失败', { error, body: req.body });
    res.status(500).json({
      success: false,
      message: '分析内容失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 批量处理
 */
router.post('/batch-process', [
  body('contents').isArray({ min: 1, max: 10 }).withMessage('内容数组不能为空且最多10个'),
  body('contents.*').isString().notEmpty().withMessage('每个内容项不能为空'),
  body('options.maxTokens').optional().isInt({ min: 1, max: 4000 }).withMessage('最大token数必须在1-4000之间'),
  body('options.temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('温度参数必须在0-2之间'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { contents, options } = req.body;
    
    const results = await aiServiceManager.batchProcess(contents, options);
    
    res.json({
      success: true,
      data: {
        analyses: results,
        provider: aiServiceManager.getCurrentProviderStatus()?.provider,
        totalProcessed: results.length
      }
    });
  } catch (error) {
    logger.error('批量处理失败', { error, body: req.body });
    res.status(500).json({
      success: false,
      message: '批量处理失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 手动切换AI提供商
 */
router.post('/switch-provider', [
  body('reason').optional().isString().withMessage('切换原因必须是字符串'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    await aiServiceManager.switchProvider(reason || 'Manual switch');
    
    const currentStatus = aiServiceManager.getCurrentProviderStatus();
    
    res.json({
      success: true,
      message: 'AI提供商切换成功',
      data: {
        currentProvider: currentStatus?.provider,
        isHealthy: currentStatus?.isHealthy
      }
    });
  } catch (error) {
    logger.error('切换AI提供商失败', { error, body: req.body });
    res.status(500).json({
      success: false,
      message: '切换AI提供商失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取AI使用统计
 */
router.get('/usage-stats', async (req: Request, res: Response) => {
  try {
    // 这里应该从数据库获取使用统计
    // 暂时返回模拟数据
    const stats = {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      successRate: 0,
      providers: {
        gemini: {
          calls: 0,
          tokens: 0,
          cost: 0,
          successRate: 0
        },
        claude: {
          calls: 0,
          tokens: 0,
          cost: 0,
          successRate: 0
        }
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取AI使用统计失败', { error });
    res.status(500).json({
      success: false,
      message: '获取AI使用统计失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取AI成本报告
 */
router.get('/cost-report', [
  query('startDate').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式不正确'),
  validationMiddleware
], async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 这里应该从数据库获取成本报告
    // 暂时返回模拟数据
    const report = {
      period: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString()
      },
      totalCost: 0,
      dailyCosts: [],
      providerCosts: {
        gemini: 0,
        claude: 0
      }
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('获取AI成本报告失败', { error });
    res.status(500).json({
      success: false,
      message: '获取AI成本报告失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 获取AI性能指标
 */
router.get('/performance-metrics', async (req: Request, res: Response) => {
  try {
    const statuses = await aiServiceManager.getAllProviderStatus();
    
    const metrics = {
      providers: statuses.map(status => ({
        provider: status.provider,
        isHealthy: status.isHealthy,
        responseTime: status.responseTime,
        lastCheck: status.lastCheck,
        errorMessage: status.errorMessage
      })),
      overall: {
        healthyProviders: statuses.filter(s => s.isHealthy).length,
        totalProviders: statuses.length,
        averageResponseTime: statuses.reduce((sum, s) => sum + s.responseTime, 0) / statuses.length
      }
    };
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('获取AI性能指标失败', { error });
    res.status(500).json({
      success: false,
      message: '获取AI性能指标失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
