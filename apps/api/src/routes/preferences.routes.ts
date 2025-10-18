/**
 * Story 4.1: User Preferences Routes
 * 用户个性化偏好管理路由
 * 
 * API Endpoints:
 * - GET    /api/preferences                    - 获取用户偏好
 * - PUT    /api/preferences                    - 更新用户偏好
 * - GET    /api/preferences/interests          - 获取兴趣列表
 * - POST   /api/preferences/interests          - 添加兴趣
 * - POST   /api/preferences/interests/batch    - 批量添加兴趣
 * - PUT    /api/preferences/interests/:id      - 更新兴趣
 * - DELETE /api/preferences/interests/:id      - 删除兴趣
 * - GET    /api/preferences/followings         - 获取关注列表
 * - POST   /api/preferences/followings         - 添加关注
 * - PUT    /api/preferences/followings/:id     - 更新关注
 * - DELETE /api/preferences/followings/:id     - 删除关注
 * - GET    /api/preferences/source-weights     - 获取信息源权重
 * - PUT    /api/preferences/source-weights/:sourceId - 设置信息源权重
 * - POST   /api/preferences/export             - 导出偏好
 * - POST   /api/preferences/import             - 导入偏好
 * - GET    /api/preferences/templates          - 获取偏好模板
 * - POST   /api/preferences/templates/:id/apply - 应用偏好模板
 * - GET    /api/content/personalized           - 获取个性化内容
 * - GET    /api/daily-top10/personalized       - 获取个性化TOP10
 */

import { Router, Request, Response } from 'express';
import { preferenceService } from '../services/preference.service';
import { personalizationService } from '../services/personalization.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { FollowType } from '@tech-news-platform/database';

const router: Router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// ==========================================
// 基础偏好管理
// ==========================================

/**
 * GET /api/preferences
 * 获取当前用户的偏好设置
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const preference = await preferenceService.getUserPreference(userId);

    res.json({
      success: true,
      data: preference
    });
  } catch (error) {
    console.error('获取用户偏好失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '获取用户偏好失败'
    });
  }
});

/**
 * PUT /api/preferences
 * 更新用户偏好（基础设置）
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      contentTypes,
      preferredLanguage,
      timezone,
      itemsPerPage,
      defaultSortBy,
      emailNotifications,
      pushNotifications,
      notificationFrequency
    } = req.body;

    const preference = await preferenceService.updateUserPreference(userId, {
      ...(contentTypes && { contentTypes }),
      ...(preferredLanguage && { preferredLanguage }),
      ...(timezone && { timezone }),
      ...(itemsPerPage && { itemsPerPage: parseInt(itemsPerPage) }),
      ...(defaultSortBy && { defaultSortBy }),
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(pushNotifications !== undefined && { pushNotifications }),
      ...(notificationFrequency && { notificationFrequency })
    });

    res.json({
      success: true,
      data: preference,
      message: '偏好更新成功'
    });
  } catch (error) {
    console.error('更新用户偏好失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '更新用户偏好失败'
    });
  }
});

// ==========================================
// 兴趣管理
// ==========================================

/**
 * GET /api/preferences/interests
 * 获取用户兴趣列表
 */
router.get('/interests', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { category, isActive } = req.query;

    const interests = await preferenceService.getInterests(userId, {
      ...(category && { category: category as string }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    });

    res.json({
      success: true,
      data: interests
    });
  } catch (error) {
    console.error('获取兴趣列表失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '获取兴趣列表失败'
    });
  }
});

/**
 * POST /api/preferences/interests
 * 添加兴趣领域
 */
router.post('/interests', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { category, name, weight } = req.body;

    if (!category || !name) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'category 和 name 为必填字段'
      });
    }

    const interest = await preferenceService.addInterest(userId, {
      category,
      name,
      weight: weight ? parseFloat(weight) : undefined
    });

    res.status(201).json({
      success: true,
      data: interest,
      message: '兴趣添加成功'
    });
  } catch (error) {
    console.error('添加兴趣失败:', error);
    const statusCode = (error as Error).message.includes('已存在') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 409 ? 'Conflict' : 'InternalServerError',
      message: (error as Error).message || '添加兴趣失败'
    });
  }
});

/**
 * POST /api/preferences/interests/batch
 * 批量添加兴趣
 */
router.post('/interests/batch', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'interests 必须是数组'
      });
    }

    const results = await preferenceService.batchAddInterests(userId, interests);

    res.json({
      success: true,
      data: results,
      message: `批量添加完成: 成功 ${results.success} 个，失败 ${results.failed} 个`
    });
  } catch (error) {
    console.error('批量添加兴趣失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '批量添加兴趣失败'
    });
  }
});

/**
 * PUT /api/preferences/interests/:id
 * 更新兴趣权重
 */
router.put('/interests/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { weight, isActive } = req.body;

    const interest = await preferenceService.updateInterest(id, userId, {
      ...(weight !== undefined && { weight: parseFloat(weight) }),
      ...(isActive !== undefined && { isActive })
    });

    res.json({
      success: true,
      data: interest,
      message: '兴趣更新成功'
    });
  } catch (error) {
    console.error('更新兴趣失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '更新兴趣失败'
    });
  }
});

/**
 * DELETE /api/preferences/interests/:id
 * 删除兴趣
 */
router.delete('/interests/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await preferenceService.deleteInterest(id, userId);

    res.json({
      success: true,
      message: '兴趣删除成功'
    });
  } catch (error) {
    console.error('删除兴趣失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '删除兴趣失败'
    });
  }
});

// ==========================================
// 关注列表管理
// ==========================================

/**
 * GET /api/preferences/followings
 * 获取关注列表
 */
router.get('/followings', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { followType, isActive } = req.query;

    const followings = await preferenceService.getFollowings(userId, {
      ...(followType && { followType: followType as FollowType }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    });

    res.json({
      success: true,
      data: followings
    });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '获取关注列表失败'
    });
  }
});

/**
 * POST /api/preferences/followings
 * 添加关注
 */
router.post('/followings', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { followType, name, identifier, weight, notifyOnNews, notifyOnPrice } = req.body;

    if (!followType || !name) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'followType 和 name 为必填字段'
      });
    }

    // 验证 followType
    if (!Object.values(FollowType).includes(followType)) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'followType 必须是 COMPANY, STOCK, PERSON, ORGANIZATION 之一'
      });
    }

    const following = await preferenceService.addFollowing(userId, {
      followType,
      name,
      identifier,
      weight: weight ? parseFloat(weight) : undefined,
      notifyOnNews,
      notifyOnPrice
    });

    res.status(201).json({
      success: true,
      data: following,
      message: '关注添加成功'
    });
  } catch (error) {
    console.error('添加关注失败:', error);
    const statusCode = (error as Error).message.includes('已存在') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 409 ? 'Conflict' : 'InternalServerError',
      message: (error as Error).message || '添加关注失败'
    });
  }
});

/**
 * PUT /api/preferences/followings/:id
 * 更新关注
 */
router.put('/followings/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { weight, isActive, notifyOnNews, notifyOnPrice } = req.body;

    const following = await preferenceService.updateFollowing(id, userId, {
      ...(weight !== undefined && { weight: parseFloat(weight) }),
      ...(isActive !== undefined && { isActive }),
      ...(notifyOnNews !== undefined && { notifyOnNews }),
      ...(notifyOnPrice !== undefined && { notifyOnPrice })
    });

    res.json({
      success: true,
      data: following,
      message: '关注更新成功'
    });
  } catch (error) {
    console.error('更新关注失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '更新关注失败'
    });
  }
});

/**
 * DELETE /api/preferences/followings/:id
 * 取消关注
 */
router.delete('/followings/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await preferenceService.deleteFollowing(id, userId);

    res.json({
      success: true,
      message: '关注取消成功'
    });
  } catch (error) {
    console.error('取消关注失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '取消关注失败'
    });
  }
});

// ==========================================
// 信息源权重管理
// ==========================================

/**
 * GET /api/preferences/source-weights
 * 获取信息源权重
 */
router.get('/source-weights', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const sourceWeights = await preferenceService.getSourceWeights(userId);

    res.json({
      success: true,
      data: sourceWeights
    });
  } catch (error) {
    console.error('获取信息源权重失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '获取信息源权重失败'
    });
  }
});

/**
 * PUT /api/preferences/source-weights/:sourceId
 * 设置信息源权重
 */
router.put('/source-weights/:sourceId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sourceId } = req.params;
    const { weight, reason } = req.body;

    if (!weight) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'weight 为必填字段'
      });
    }

    const sourceWeight = await preferenceService.setSourceWeight(userId, sourceId, {
      weight: parseFloat(weight),
      reason
    });

    res.json({
      success: true,
      data: sourceWeight,
      message: '信息源权重设置成功'
    });
  } catch (error) {
    console.error('设置信息源权重失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '设置信息源权重失败'
    });
  }
});

// ==========================================
// 偏好导入导出
// ==========================================

/**
 * POST /api/preferences/export
 * 导出偏好设置
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const exportData = await preferenceService.exportPreferences(userId);

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('导出偏好失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '导出偏好失败'
    });
  }
});

/**
 * POST /api/preferences/import
 * 导入偏好设置
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { data, overwrite } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'data 为必填字段'
      });
    }

    const result = await preferenceService.importPreferences(
      userId,
      data,
      overwrite === true
    );

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('导入偏好失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '导入偏好失败'
    });
  }
});

// ==========================================
// 偏好模板管理
// ==========================================

/**
 * GET /api/preferences/templates
 * 获取偏好模板列表
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { category, isPublic } = req.query;

    const templates = await preferenceService.getTemplates({
      ...(category && { category: category as string }),
      ...(isPublic !== undefined && { isPublic: isPublic === 'true' })
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('获取偏好模板失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '获取偏好模板失败'
    });
  }
});

/**
 * POST /api/preferences/templates/:id/apply
 * 应用偏好模板
 */
router.post('/templates/:id/apply', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const result = await preferenceService.applyTemplate(userId, id);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('应用模板失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '应用模板失败'
    });
  }
});

// ==========================================
// 个性化内容
// ==========================================

/**
 * GET /api/content/personalized
 * 获取个性化内容（应用偏好）
 */
router.get('/content/personalized', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page, limit, category, minScore } = req.query;

    const result = await personalizationService.getPersonalizedContent(userId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      category: category as string,
      minScore: minScore ? parseFloat(minScore as string) : undefined
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取个性化内容失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '获取个性化内容失败'
    });
  }
});

/**
 * GET /api/daily-top10/personalized
 * 获取个性化TOP10
 */
router.get('/daily-top10/personalized', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '用户未认证'
      });
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    console.log(`[个性化TOP10] 用户: ${userId}, 日期: ${targetDate.toISOString().split('T')[0]}`);

    const top10 = await personalizationService.generatePersonalizedTop10(userId, targetDate);

    console.log(`[个性化TOP10] 生成成功，共 ${top10.length} 条`);

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        items: top10.map((content, index) => ({
          rank: index + 1,
          content,
          baseScore: content.baseScore,
          personalizedScore: content.personalizedScore,
          personalizedReason: personalizationService.getPersonalizationExplanation(content)
        })),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[个性化TOP10] 失败:', error);
    console.error('[个性化TOP10] 错误详情:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: (error as Error).message || '获取个性化TOP10失败',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;

