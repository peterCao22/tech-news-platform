/**
 * Filter Rules Routes
 * Story 3.2: Intelligent Filter Rules
 */

import express, { Request, Response, Router } from 'express';
import { filterRuleService } from '../services/filter-rule.service';
import { RuleType, RuleStatus, ListType } from '@tech-news-platform/database';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router: Router = Router();

// 应用身份验证中间件到所有路由
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/filter-rules
 * 获取规则列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, status, page, limit, sortBy, sortOrder } = req.query;

    const result = await filterRuleService.getRules({
      type: type as RuleType,
      status: status as RuleStatus,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as 'priority' | 'createdAt' | 'updatedAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Filter Rules] Get rules error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '获取规则列表失败',
    });
  }
});

/**
 * GET /api/filter-rules/:ruleId
 * 获取单个规则详情
 */
router.get('/:ruleId', async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;

    const rule = await filterRuleService.getRule(ruleId);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    console.error('[Filter Rules] Get rule error:', error);
    const statusCode = error.message === '规则不存在' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'NotFound' : 'InternalServerError',
      message: error.message || '获取规则详情失败',
    });
  }
});

/**
 * POST /api/filter-rules
 * 创建新规则
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, description, ruleType, priority, config } = req.body;

    // 验证必填字段
    if (!name || !ruleType || !config) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '缺少必填字段：name, ruleType, config',
      });
    }

    const rule = await filterRuleService.createRule({
      name,
      description,
      ruleType,
      priority,
      config,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: rule,
      message: '规则创建成功',
    });
  } catch (error: any) {
    console.error('[Filter Rules] Create rule error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '创建规则失败',
    });
  }
});

/**
 * PATCH /api/filter-rules/:ruleId
 * 更新规则
 */
router.patch('/:ruleId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ruleId } = req.params;
    const { name, description, priority, status, config } = req.body;

    const rule = await filterRuleService.updateRule(ruleId, {
      name,
      description,
      priority,
      status,
      config,
      updatedBy: userId,
    });

    res.json({
      success: true,
      data: rule,
      message: '规则更新成功',
    });
  } catch (error: any) {
    console.error('[Filter Rules] Update rule error:', error);
    const statusCode = error.message === '规则不存在' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'NotFound' : 'InternalServerError',
      message: error.message || '更新规则失败',
    });
  }
});

/**
 * DELETE /api/filter-rules/:ruleId
 * 删除规则
 */
router.delete('/:ruleId', async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;

    await filterRuleService.deleteRule(ruleId);

    res.json({
      success: true,
      message: '规则已删除',
    });
  } catch (error: any) {
    console.error('[Filter Rules] Delete rule error:', error);
    const statusCode = error.message.includes('不存在') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'NotFound' : 'BadRequest',
      message: error.message || '删除规则失败',
    });
  }
});

/**
 * POST /api/filter-rules/:ruleId/test
 * 测试已保存规则的效果
 */
router.post('/:ruleId/test', async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const { limit, startDate, endDate } = req.body;

    // 获取规则详情
    const rule = await filterRuleService.getRule(ruleId);
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '规则不存在',
      });
    }

    // 测试规则
    const result = await filterRuleService.testRule({
      ruleConfig: rule.config,
      ruleType: rule.ruleType,
      limit,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Filter Rules] Test rule error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '测试规则失败',
    });
  }
});

/**
 * POST /api/filter-rules/test
 * 测试临时规则配置（用于预览）
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { ruleConfig, ruleType, contentIds, limit } = req.body;

    if (!ruleConfig || !ruleType) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '缺少必填字段：ruleConfig, ruleType',
      });
    }

    const result = await filterRuleService.testRule({
      ruleConfig,
      ruleType,
      contentIds,
      limit,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Filter Rules] Test rule error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '测试规则失败',
    });
  }
});

/**
 * POST /api/filter-rules/:ruleId/publish
 * 发布规则版本
 */
router.post('/:ruleId/publish', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ruleId } = req.params;
    const { changeLog } = req.body;

    const result = await filterRuleService.publishRule(ruleId, {
      changeLog,
      publishedBy: userId,
    });

    res.json({
      success: true,
      data: result,
      message: '规则已发布',
    });
  } catch (error: any) {
    console.error('[Filter Rules] Publish rule error:', error);
    const statusCode = error.message === '规则不存在' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'NotFound' : 'InternalServerError',
      message: error.message || '发布规则失败',
    });
  }
});

/**
 * POST /api/filter-rules/:ruleId/rollback
 * 回滚规则版本
 */
router.post('/:ruleId/rollback', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ruleId } = req.params;
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '缺少必填字段：version',
      });
    }

    const rule = await filterRuleService.rollbackRule(ruleId, version, userId);

    res.json({
      success: true,
      data: rule,
      message: `规则已回滚到版本 ${version}`,
    });
  } catch (error: any) {
    console.error('[Filter Rules] Rollback rule error:', error);
    const statusCode = error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'NotFound' : 'InternalServerError',
      message: error.message || '回滚规则失败',
    });
  }
});

/**
 * GET /api/filter-rules/:ruleId/versions
 * 获取规则版本历史
 */
router.get('/:ruleId/versions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;

    const result = await filterRuleService.getRuleVersions(ruleId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Filter Rules] Get versions error:', error);
    const statusCode = error.message === '规则不存在' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'NotFound' : 'InternalServerError',
      message: error.message || '获取版本历史失败',
    });
  }
});

/**
 * GET /api/filter-rules/:ruleId/analytics
 * 获取规则效果分析
 */
router.get('/:ruleId/analytics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const result = await filterRuleService.getRuleAnalytics(
      ruleId,
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Filter Rules] Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '获取效果分析失败',
    });
  }
});

// ==================== Source List Routes ====================

/**
 * GET /api/filter-rules/source-lists
 * 获取来源列表（白名单/黑名单）
 */
router.get('/source-lists/list', async (req: Request, res: Response) => {
  try {
    const { type, page, limit } = req.query;

    const result = await filterRuleService.getSourceLists(
      type as ListType,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Filter Rules] Get source lists error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '获取来源列表失败',
    });
  }
});

/**
 * POST /api/filter-rules/source-lists
 * 添加来源到白名单/黑名单
 */
router.post('/source-lists/add', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { listType, sourceId, sourceName, sourceDomain, weight, reason } = req.body;

    if (!listType || !sourceName) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '缺少必填字段：listType, sourceName',
      });
    }

    const sourceList = await filterRuleService.addSourceToList({
      listType,
      sourceId,
      sourceName,
      sourceDomain,
      weight,
      reason,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: sourceList,
      message: '来源已添加到列表',
    });
  } catch (error: any) {
    console.error('[Filter Rules] Add source to list error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '添加来源失败',
    });
  }
});

/**
 * PATCH /api/filter-rules/source-lists/:listId
 * 更新来源列表项
 */
router.patch('/source-lists/:listId', async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const { weight, reason, isActive } = req.body;

    const sourceList = await filterRuleService.updateSourceList(listId, {
      weight,
      reason,
      isActive,
    });

    res.json({
      success: true,
      data: sourceList,
      message: '来源列表项已更新',
    });
  } catch (error: any) {
    console.error('[Filter Rules] Update source list error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '更新来源列表项失败',
    });
  }
});

/**
 * DELETE /api/filter-rules/source-lists/:listId
 * 删除来源列表项
 */
router.delete('/source-lists/:listId', async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;

    await filterRuleService.removeSourceFromList(listId);

    res.json({
      success: true,
      message: '来源列表项已删除',
    });
  } catch (error: any) {
    console.error('[Filter Rules] Delete source list error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '删除来源列表项失败',
    });
  }
});

/**
 * POST /api/filter-rules/source-lists/batch
 * 批量添加来源到列表
 */
router.post('/source-lists/batch', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { listType, sourceIds, weight, reason } = req.body;

    if (!listType || !sourceIds || !Array.isArray(sourceIds)) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '缺少必填字段：listType, sourceIds (array)',
      });
    }

    const result = await filterRuleService.batchAddSourcesToList({
      listType,
      sourceIds,
      weight,
      reason,
      createdBy: userId,
    });

    res.json({
      success: true,
      data: result,
      message: `批量添加完成：成功 ${result.successCount}, 失败 ${result.failedCount}`,
    });
  } catch (error: any) {
    console.error('[Filter Rules] Batch add sources error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '批量添加来源失败',
    });
  }
});

export default router;

