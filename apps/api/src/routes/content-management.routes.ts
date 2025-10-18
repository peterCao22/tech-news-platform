/**
 * Content Management Routes
 * 手工内容管理API路由
 * Story 3.3: Manual Content Management
 */

import express, { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkReviewerRole } from '../middleware/reviewer.middleware';
import contentManagementService from '../services/content-management.service';
import contentTemplateService from '../services/content-template.service';

const router: Router = Router();

// 所有路由需要身份验证
router.use(authenticateToken);

// 大部分路由需要编辑或管理员权限
// 但某些只读路由（如获取模板）可以对所有登录用户开放

/**
 * POST /api/content-management/create
 * 创建手工内容
 */
router.post('/create', checkReviewerRole, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      content,
      url,
      category,
      tags,
      sourceId,
      customSource,
      publishedAt,
      reviewStatus,
    } = req.body;

    // 验证必填字段
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '标题不能为空',
      });
    }

    const createdContent = await contentManagementService.createManualContent({
      title,
      description,
      content,
      url,
      category,
      tags,
      sourceId,
      customSource,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      reviewStatus,
      createdBy: (req as any).user.id,
    });

    res.json({
      success: true,
      data: createdContent,
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Create content error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '创建内容失败',
    });
  }
});

/**
 * POST /api/content-management/import-url
 * 从URL导入内容
 */
router.post('/import-url', checkReviewerRole, async (req: Request, res: Response) => {
  try {
    const { url, autoFill } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'URL参数必填',
      });
    }

    const result = await contentManagementService.importFromUrl({
      url,
      autoFill: autoFill === true,
      userId: (req as any).user.id,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Import URL error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || 'URL导入失败',
    });
  }
});

/**
 * POST /api/content-management/batch-import
 * 批量导入内容
 */
router.post('/batch-import', checkReviewerRole, async (req: Request, res: Response) => {
  try {
    const { type, data, options } = req.body;

    if (!type || !['urls', 'text', 'json'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '无效的导入类型',
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '导入数据不能为空',
      });
    }

    const batchImport = await contentManagementService.batchImport({
      type,
      data,
      options,
      userId: (req as any).user.id,
    });

    res.json({
      success: true,
      data: batchImport,
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Batch import error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '批量导入失败',
    });
  }
});

/**
 * GET /api/content-management/batch-import/:batchId
 * 获取批量导入状态
 */
router.get('/batch-import/:batchId', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const batchImport = await contentManagementService.getBatchImportStatus(batchId);

    if (!batchImport) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '批量导入记录不存在',
      });
    }

    res.json({
      success: true,
      data: batchImport,
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Get batch import status error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '获取批量导入状态失败',
    });
  }
});

/**
 * POST /api/content-management/validate
 * 验证内容（发布前检查）
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { title, description, content, url, category, tags } = req.body;

    const validation = await contentManagementService.validateContent({
      title,
      description,
      content,
      url,
      category,
      tags,
    });

    res.json({
      success: true,
      data: validation,
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Validate content error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '验证内容失败',
    });
  }
});

/**
 * GET /api/content-management/templates
 * 获取内容模板列表
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { category, isActive } = req.query;

    const templates = await contentTemplateService.getTemplates({
      category: category as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      data: {
        items: templates,
      },
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '获取模板列表失败',
    });
  }
});

/**
 * GET /api/content-management/templates/built-in
 * 获取内置模板
 */
router.get('/templates/built-in', async (req: Request, res: Response) => {
  try {
    const builtInTemplates = contentTemplateService.getBuiltInTemplates();

    res.json({
      success: true,
      data: {
        items: builtInTemplates,
      },
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Get built-in templates error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '获取内置模板失败',
    });
  }
});

/**
 * GET /api/content-management/templates/:templateId
 * 获取单个模板详情
 */
router.get('/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const template = await contentTemplateService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: '模板不存在',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Get template error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '获取模板失败',
    });
  }
});

/**
 * POST /api/content-management/templates
 * 创建内容模板
 */
router.post('/templates', checkReviewerRole, async (req: Request, res: Response) => {
  try {
    const { name, description, category, template } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '模板名称不能为空',
      });
    }

    if (!template || typeof template !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '模板配置必须是对象',
      });
    }

    const createdTemplate = await contentTemplateService.createTemplate({
      name,
      description,
      category,
      template,
      createdBy: (req as any).user.id,
    });

    res.json({
      success: true,
      data: createdTemplate,
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Create template error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '创建模板失败',
    });
  }
});

/**
 * PATCH /api/content-management/templates/:templateId
 * 更新模板
 */
router.patch('/templates/:templateId', checkReviewerRole, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { name, description, category, template, isActive } = req.body;

    const updatedTemplate = await contentTemplateService.updateTemplate(templateId, {
      name,
      description,
      category,
      template,
      isActive,
    });

    res.json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Update template error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '更新模板失败',
    });
  }
});

/**
 * DELETE /api/content-management/templates/:templateId
 * 删除模板（软删除）
 */
router.delete('/templates/:templateId', checkReviewerRole, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    await contentTemplateService.deleteTemplate(templateId);

    res.json({
      success: true,
      message: '模板已删除',
    });
  } catch (error: any) {
    console.error('[Content Management Routes] Delete template error:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: error.message || '删除模板失败',
    });
  }
});

export default router;

