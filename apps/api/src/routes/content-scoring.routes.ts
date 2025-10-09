/**
 * 内容评分API路由
 * Story 2.5: 内容评分与排序算法
 */

import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { contentScoringService } from '../services/content-scoring.service';
import { scoringWeightManager } from '../services/scoring-weight-manager.service';
import { logger } from '../utils/logger';

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// 应用认证中间件到所有路由
router.use(authMiddleware.authenticate);

/**
 * POST /api/content-scoring/score/:contentId
 * 计算单个内容的评分
 */
router.post('/score/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const { forceRecalculate } = req.body;

    logger.info('计算内容评分', { contentId, forceRecalculate });

    const score = await contentScoringService.scoreContent(contentId, forceRecalculate);

    res.json({
      success: true,
      data: score
    });
  } catch (error: any) {
    logger.error('计算内容评分失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content-scoring/batch-score
 * 批量计算内容评分
 */
router.post('/batch-score', async (req: Request, res: Response) => {
  try {
    const { contentIds, forceRecalculate } = req.body;

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的内容ID数组'
      });
    }

    logger.info('批量计算内容评分', { count: contentIds.length });

    const scores = await contentScoringService.batchScoreContent(contentIds, forceRecalculate);

    res.json({
      success: true,
      data: {
        scores,
        total: scores.length
      }
    });
  } catch (error: any) {
    logger.error('批量计算内容评分失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content-scoring/ranked
 * 获取排序后的内容列表
 */
router.get('/ranked', async (req: Request, res: Response) => {
  try {
    const {
      limit = '20',
      offset = '0',
      minScore,
      category,
      tags,
      publishedAfter,
      sortBy = 'totalScore'
    } = req.query;

    const filters = {
      minScore: minScore ? parseFloat(minScore as string) : undefined,
      category: category as string,
      tags: tags ? (tags as string).split(',') : undefined,
      publishedAfter: publishedAfter ? new Date(publishedAfter as string) : undefined
    };

    logger.info('获取排序内容', { limit, offset, filters });

    const result = await contentScoringService.getRankedContent(
      parseInt(limit as string),
      parseInt(offset as string),
      filters,
      sortBy as any
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('获取排序内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content-scoring/score/:contentId
 * 获取内容评分详情
 */
router.get('/score/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    const score = await contentScoringService.getContentScore(contentId);

    if (!score) {
      return res.status(404).json({
        success: false,
        error: '未找到内容评分'
      });
    }

    res.json({
      success: true,
      data: score
    });
  } catch (error: any) {
    logger.error('获取内容评分失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content-scoring/recalculate-all
 * 重新计算所有内容评分（管理员操作）
 */
router.post('/recalculate-all', async (req: Request, res: Response) => {
  try {
    const { batchSize = 100 } = req.body;

    logger.info('开始重新计算所有内容评分', { batchSize });

    // 这是一个长时间运行的操作，应该异步执行
    // 这里只启动任务，不等待完成
    contentScoringService.recalculateAllScores(batchSize)
      .then(() => logger.info('所有内容评分重新计算完成'))
      .catch((error: any) => logger.error('重新计算评分失败', { error: error.message }));

    res.json({
      success: true,
      message: '评分重新计算任务已启动'
    });
  } catch (error: any) {
    logger.error('启动重新计算评分任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content-scoring/weights
 * 获取所有权重配置
 */
router.get('/weights', async (req: Request, res: Response) => {
  try {
    const configs = scoringWeightManager.getAllWeightConfigs();

    res.json({
      success: true,
      data: configs
    });
  } catch (error: any) {
    logger.error('获取权重配置失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content-scoring/weights/active
 * 获取当前活动的权重配置
 */
router.get('/weights/active', async (req: Request, res: Response) => {
  try {
    const weights = scoringWeightManager.getActiveWeights();

    res.json({
      success: true,
      data: weights
    });
  } catch (error: any) {
    logger.error('获取活动权重配置失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content-scoring/weights/presets
 * 获取预设权重配置模板
 */
router.get('/weights/presets', async (req: Request, res: Response) => {
  try {
    const presets = scoringWeightManager.getPresetConfigs();

    res.json({
      success: true,
      data: presets
    });
  } catch (error: any) {
    logger.error('获取预设权重配置失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content-scoring/weights
 * 创建新的权重配置
 */
router.post('/weights', async (req: Request, res: Response) => {
  try {
    const { name, weights, description } = req.body;

    if (!name || !weights) {
      return res.status(400).json({
        success: false,
        error: '请提供配置名称和权重'
      });
    }

    const config = scoringWeightManager.createWeightConfig(name, weights, description);

    logger.info('权重配置已创建', { configId: config.id });

    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('创建权重配置失败', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/content-scoring/weights/:id
 * 更新权重配置
 */
router.put('/weights/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const config = scoringWeightManager.updateWeightConfig(id, updates);

    logger.info('权重配置已更新', { configId: id });

    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('更新权重配置失败', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content-scoring/weights/:id/activate
 * 激活权重配置
 */
router.post('/weights/:id/activate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    scoringWeightManager.activateWeightConfig(id);

    logger.info('权重配置已激活', { configId: id });

    res.json({
      success: true,
      message: '权重配置已激活'
    });
  } catch (error: any) {
    logger.error('激活权重配置失败', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/content-scoring/weights/:id
 * 删除权重配置
 */
router.delete('/weights/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    scoringWeightManager.deleteWeightConfig(id);

    logger.info('权重配置已删除', { configId: id });

    res.json({
      success: true,
      message: '权重配置已删除'
    });
  } catch (error: any) {
    logger.error('删除权重配置失败', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content-scoring/ab-test
 * 创建A/B测试
 */
router.post('/ab-test', async (req: Request, res: Response) => {
  try {
    const { name, weightConfigAId, weightConfigBId, description } = req.body;

    if (!name || !weightConfigAId || !weightConfigBId) {
      return res.status(400).json({
        success: false,
        error: '请提供测试名称和两个权重配置ID'
      });
    }

    const test = scoringWeightManager.createABTest(
      name,
      weightConfigAId,
      weightConfigBId,
      description
    );

    logger.info('A/B测试已创建', { testId: test.id });

    res.json({
      success: true,
      data: test
    });
  } catch (error: any) {
    logger.error('创建A/B测试失败', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content-scoring/ab-test
 * 获取所有A/B测试
 */
router.get('/ab-test', async (req: Request, res: Response) => {
  try {
    const tests = scoringWeightManager.getAllABTests();

    res.json({
      success: true,
      data: tests
    });
  } catch (error: any) {
    logger.error('获取A/B测试列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content-scoring/ab-test/:id/analyze
 * 分析A/B测试结果
 */
router.get('/ab-test/:id/analyze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const analysis = scoringWeightManager.analyzeABTest(id);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    logger.error('分析A/B测试失败', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content-scoring/ab-test/:id/complete
 * 完成A/B测试
 */
router.post('/ab-test/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { winner } = req.body;

    if (!winner || !['A', 'B'].includes(winner)) {
      return res.status(400).json({
        success: false,
        error: '请指定获胜方（A或B）'
      });
    }

    scoringWeightManager.completeABTest(id, winner);

    logger.info('A/B测试已完成', { testId: id, winner });

    res.json({
      success: true,
      message: 'A/B测试已完成'
    });
  } catch (error: any) {
    logger.error('完成A/B测试失败', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content-scoring/ab-test/:id/apply-winner
 * 应用A/B测试获胜配置
 */
router.post('/ab-test/:id/apply-winner', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    scoringWeightManager.applyABTestWinner(id);

    logger.info('A/B测试获胜配置已应用', { testId: id });

    res.json({
      success: true,
      message: 'A/B测试获胜配置已应用'
    });
  } catch (error: any) {
    logger.error('应用A/B测试获胜配置失败', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

