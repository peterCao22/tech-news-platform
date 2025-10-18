/**
 * Content Review API Routes
 * Story 3.1: 内容审核工作台界面
 * 
 * 提供内容审核相关的API端点
 */

import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ReviewerMiddleware } from '../middleware/reviewer.middleware';
import { contentReviewService } from '../services/content-review.service';
import { logger } from '../utils/logger';

const router: Router = Router();
const authMiddleware = new AuthMiddleware();
const reviewerMiddleware = new ReviewerMiddleware();

// 应用认证和审核员权限中间件到所有路由
router.use(authMiddleware.authenticate);
router.use(reviewerMiddleware.checkReviewerRole);

/**
 * GET /api/content-review
 * 获取内容审核列表（支持筛选和分页）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      category,
      sourceId,
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    // 处理多选状态（逗号分隔）
    const statusFilter = status 
      ? (typeof status === 'string' ? status.split(',') : status)
      : undefined;

    const params = {
      status: statusFilter as string | string[] | undefined,
      category: category as string | undefined,
      sourceId: sourceId as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as 'createdAt' | 'score' | 'title' | 'reviewedAt' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined
    };

    const result = await contentReviewService.getContentByStatus(params);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('获取审核列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content-review/:contentId
 * 获取单个内容详情
 */
router.get('/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    const content = await contentReviewService.getContentDetail(contentId);

    res.json({
      success: true,
      data: content
    });
  } catch (error: any) {
    logger.error('获取内容详情失败', { 
      contentId: req.params.contentId,
      error: error.message 
    });
    
    if (error.message === '内容不存在') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * POST /api/content-review/:contentId/status
 * 更新内容审核状态
 */
router.post('/:contentId/status', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const { action, notes } = req.body;
    const userId = req.user?.id;

    // 验证必需参数
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: action'
      });
    }

    // 验证action
    if (!['APPROVE', 'REJECT', 'PUBLISH'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: '无效的操作类型'
      });
    }

    const updated = await contentReviewService.updateContentStatus(
      contentId,
      action,
      userId,
      notes
    );

    const actionMessages = {
      APPROVE: '内容已批准',
      REJECT: '内容已拒绝',
      PUBLISH: '内容已发布'
    };

    res.json({
      success: true,
      data: updated,
      message: actionMessages[action as keyof typeof actionMessages]
    });
  } catch (error: any) {
    logger.error('更新审核状态失败', {
      contentId: req.params.contentId,
      error: error.message
    });
    
    if (error.message === '内容不存在') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * POST /api/content-review/batch-update
 * 批量更新内容状态
 */
router.post('/batch-update', async (req: Request, res: Response) => {
  try {
    const { contentIds, action, notes } = req.body;
    const userId = req.user?.id;

    // 验证必需参数
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: contentIds（数组）'
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: action'
      });
    }

    // 验证action
    if (!['APPROVE', 'REJECT', 'PUBLISH'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: '无效的操作类型'
      });
    }

    const result = await contentReviewService.batchUpdateStatus(
      contentIds,
      action,
      userId,
      notes
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('批量更新失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/content-review/:contentId
 * 更新内容详情
 */
router.patch('/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const { title, description, content, category, tags, metadata } = req.body;
    const userId = req.user?.id;

    // 验证必需参数
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }

    // 至少需要一个更新字段
    if (!title && !description && !content && !category && !tags && !metadata) {
      return res.status(400).json({
        success: false,
        error: '至少需要提供一个更新字段'
      });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (metadata !== undefined) updates.metadata = metadata;

    const updated = await contentReviewService.updateContentDetails(
      contentId,
      userId,
      updates
    );

    res.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    logger.error('更新内容详情失败', {
      contentId: req.params.contentId,
      error: error.message
    });
    
    if (error.message === '内容不存在') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * GET /api/content-review/:contentId/audit-log
 * 获取内容审核日志
 */
router.get('/:contentId/audit-log', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const { limit } = req.query;

    const result = await contentReviewService.getAuditLog(
      contentId,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('获取审核日志失败', {
      contentId: req.params.contentId,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content-review/stats/summary
 * 获取审核统计数据
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const stats = await contentReviewService.getReviewStats(
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('获取审核统计失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

