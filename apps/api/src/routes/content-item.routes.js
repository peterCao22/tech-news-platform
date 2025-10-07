/**
 * 内容管理路由
 * 定义内容相关的API端点
 */
import { Router } from 'express';
import { ContentItemController } from '../controllers/content-item.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';
const router = Router();
const contentController = new ContentItemController();
// 验证规则
const createContentValidation = [
    body('title').notEmpty().withMessage('标题不能为空').isLength({ max: 500 }).withMessage('标题长度不能超过500字符'),
    body('sourceId').notEmpty().withMessage('来源ID不能为空').isUUID().withMessage('来源ID格式无效'),
    body('description').optional().isLength({ max: 5000 }).withMessage('描述长度不能超过5000字符'),
    body('content').optional().isLength({ max: 50000 }).withMessage('内容长度不能超过50000字符'),
    body('url').optional().isURL().withMessage('URL格式无效'),
    body('type').optional().isIn(['NEWS', 'ARTICLE', 'BLOG_POST', 'PRESS_RELEASE', 'RESEARCH', 'ANNOUNCEMENT', 'OTHER']).withMessage('内容类型无效'),
    body('category').optional().isLength({ max: 100 }).withMessage('分类长度不能超过100字符'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
    body('author').optional().isLength({ max: 200 }).withMessage('作者长度不能超过200字符'),
];
const updateContentValidation = [
    param('id').isUUID().withMessage('内容ID格式无效'),
    body('title').optional().notEmpty().withMessage('标题不能为空').isLength({ max: 500 }).withMessage('标题长度不能超过500字符'),
    body('description').optional().isLength({ max: 5000 }).withMessage('描述长度不能超过5000字符'),
    body('content').optional().isLength({ max: 50000 }).withMessage('内容长度不能超过50000字符'),
    body('url').optional().isURL().withMessage('URL格式无效'),
    body('type').optional().isIn(['NEWS', 'ARTICLE', 'BLOG_POST', 'PRESS_RELEASE', 'RESEARCH', 'ANNOUNCEMENT', 'OTHER']).withMessage('内容类型无效'),
    body('status').optional().isIn(['RAW', 'PROCESSING', 'PROCESSED', 'REVIEWED', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'DUPLICATE']).withMessage('状态无效'),
    body('category').optional().isLength({ max: 100 }).withMessage('分类长度不能超过100字符'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
    body('score').optional().isFloat({ min: 0, max: 1 }).withMessage('评分必须在0-1之间'),
    body('priority').optional().isInt({ min: 0, max: 10 }).withMessage('优先级必须在0-10之间'),
    body('quality').optional().isFloat({ min: 0, max: 1 }).withMessage('质量评分必须在0-1之间'),
    body('relevance').optional().isFloat({ min: 0, max: 1 }).withMessage('相关性评分必须在0-1之间'),
    body('author').optional().isLength({ max: 200 }).withMessage('作者长度不能超过200字符'),
];
const batchUpdateValidation = [
    body('ids').isArray({ min: 1 }).withMessage('必须提供至少一个内容ID'),
    body('ids.*').isUUID().withMessage('内容ID格式无效'),
    body('status').isIn(['RAW', 'PROCESSING', 'PROCESSED', 'REVIEWED', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'DUPLICATE']).withMessage('状态无效'),
];
const addTagsValidation = [
    param('id').isUUID().withMessage('内容ID格式无效'),
    body().custom((value) => {
        if (!value.tagIds && !value.tagNames) {
            throw new Error('必须提供tagIds或tagNames');
        }
        return true;
    }),
    body('tagIds').optional().isArray().withMessage('标签ID必须是数组'),
    body('tagIds.*').optional().isUUID().withMessage('标签ID格式无效'),
    body('tagNames').optional().isArray().withMessage('标签名称必须是数组'),
    body('tagNames.*').optional().isString().withMessage('标签名称必须是字符串'),
];
const removeTagsValidation = [
    param('id').isUUID().withMessage('内容ID格式无效'),
    body('tagIds').isArray({ min: 1 }).withMessage('必须提供至少一个标签ID'),
    body('tagIds.*').isUUID().withMessage('标签ID格式无效'),
];
const checkDuplicationValidation = [
    body('title').notEmpty().withMessage('标题不能为空'),
    body('content').optional().isString().withMessage('内容必须是字符串'),
    body('url').optional().isURL().withMessage('URL格式无效'),
];
const createTagValidation = [
    body('name').notEmpty().withMessage('标签名称不能为空').isLength({ max: 100 }).withMessage('标签名称长度不能超过100字符'),
    body('slug').notEmpty().withMessage('标识符不能为空').matches(/^[a-z0-9-]+$/).withMessage('标识符只能包含小写字母、数字和连字符'),
    body('type').optional().isIn(['CATEGORY', 'TECHNOLOGY', 'COMPANY', 'STOCK', 'TOPIC', 'CUSTOM']).withMessage('标签类型无效'),
    body('description').optional().isLength({ max: 1000 }).withMessage('描述长度不能超过1000字符'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('颜色格式无效'),
    body('parentId').optional().isUUID().withMessage('父标签ID格式无效'),
];
// 公开路由（不需要认证）
/**
 * @route GET /api/content
 * @desc 获取内容列表
 * @access Public
 */
router.get('/', contentController.getContent);
/**
 * @route GET /api/content/:id
 * @desc 获取内容详情
 * @access Public
 */
router.get('/:id', param('id').isUUID().withMessage('内容ID格式无效'), validateRequest, contentController.getContentById);
/**
 * @route POST /api/content/:id/share
 * @desc 记录内容分享
 * @access Public
 */
router.post('/:id/share', param('id').isUUID().withMessage('内容ID格式无效'), validateRequest, contentController.shareContent);
/**
 * @route GET /api/content/tags/popular
 * @desc 获取热门标签
 * @access Public
 */
router.get('/tags/popular', contentController.getPopularTags);
/**
 * @route GET /api/content/tags/suggestions
 * @desc 获取标签建议
 * @access Public
 */
router.get('/tags/suggestions', query('query').notEmpty().withMessage('查询参数不能为空'), validateRequest, contentController.getTagSuggestions);
// 需要认证的路由
/**
 * @route POST /api/content
 * @desc 创建内容
 * @access Private (Editor, Admin)
 */
router.post('/', authenticate, authorize(['EDITOR', 'ADMIN']), createContentValidation, validateRequest, contentController.createContent);
/**
 * @route PUT /api/content/:id
 * @desc 更新内容
 * @access Private (Editor, Admin)
 */
router.put('/:id', authenticate, authorize(['EDITOR', 'ADMIN']), updateContentValidation, validateRequest, contentController.updateContent);
/**
 * @route DELETE /api/content/:id
 * @desc 删除内容
 * @access Private (Admin)
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), param('id').isUUID().withMessage('内容ID格式无效'), validateRequest, contentController.deleteContent);
/**
 * @route PATCH /api/content/batch/status
 * @desc 批量更新内容状态
 * @access Private (Editor, Admin)
 */
router.patch('/batch/status', authenticate, authorize(['EDITOR', 'ADMIN']), batchUpdateValidation, validateRequest, contentController.updateContentStatus);
/**
 * @route POST /api/content/:id/tags
 * @desc 为内容添加标签
 * @access Private (Editor, Admin)
 */
router.post('/:id/tags', authenticate, authorize(['EDITOR', 'ADMIN']), addTagsValidation, validateRequest, contentController.addContentTags);
/**
 * @route DELETE /api/content/:id/tags
 * @desc 移除内容标签
 * @access Private (Editor, Admin)
 */
router.delete('/:id/tags', authenticate, authorize(['EDITOR', 'ADMIN']), removeTagsValidation, validateRequest, contentController.removeContentTags);
/**
 * @route POST /api/content/check-duplication
 * @desc 检查内容重复
 * @access Private (Editor, Admin)
 */
router.post('/check-duplication', authenticate, authorize(['EDITOR', 'ADMIN']), checkDuplicationValidation, validateRequest, contentController.checkDuplication);
/**
 * @route GET /api/content/statistics
 * @desc 获取内容统计信息
 * @access Private (Admin)
 */
router.get('/statistics', authenticate, authorize(['ADMIN']), contentController.getContentStatistics);
// 标签管理路由
/**
 * @route GET /api/content/tags
 * @desc 获取标签列表
 * @access Private (Editor, Admin)
 */
router.get('/tags', authenticate, authorize(['EDITOR', 'ADMIN']), contentController.getTags);
/**
 * @route POST /api/content/tags
 * @desc 创建标签
 * @access Private (Editor, Admin)
 */
router.post('/tags', authenticate, authorize(['EDITOR', 'ADMIN']), createTagValidation, validateRequest, contentController.createTag);
export default router;
