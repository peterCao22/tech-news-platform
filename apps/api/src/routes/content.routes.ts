import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { contentController } from '../controllers/content.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { ContentStatus } from '@tech-news-platform/database';

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// 验证规则
const contentIdValidation = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID必须是有效的字符串'),
];

const contentQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('status')
    .optional()
    .isIn(Object.values(ContentStatus))
    .withMessage('状态必须是有效的内容状态'),
  
  query('sourceId')
    .optional()
    .isString()
    .withMessage('源ID必须是字符串'),
  
  query('category')
    .optional()
    .isString()
    .withMessage('分类必须是字符串'),
  
  query('orderBy')
    .optional()
    .isIn(['createdAt', 'publishedAt', 'score', 'priority'])
    .withMessage('排序字段必须是有效值'),
  
  query('orderDirection')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是asc或desc'),
];

const updateContentValidation = [
  ...contentIdValidation,
  
  body('title')
    .optional()
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('标题必须是1-500个字符的字符串'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('描述必须是字符串'),
  
  body('content')
    .optional()
    .isString()
    .withMessage('内容必须是字符串'),
  
  body('category')
    .optional()
    .isString()
    .withMessage('分类必须是字符串'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  
  body('status')
    .optional()
    .isIn(Object.values(ContentStatus))
    .withMessage('状态必须是有效的内容状态'),
  
  body('score')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('评分必须是0-10之间的数字'),
  
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('优先级必须是非负整数'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('元数据必须是有效的JSON对象'),
];

const batchUpdateValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs必须是非空数组'),
  
  body('ids.*')
    .isString()
    .withMessage('每个ID必须是字符串'),
  
  body('status')
    .isIn(Object.values(ContentStatus))
    .withMessage('状态必须是有效的内容状态'),
];

const searchValidation = [
  query('q')
    .isString()
    .isLength({ min: 1 })
    .withMessage('搜索查询不能为空'),
  
  ...contentQueryValidation,
];

const recentContentValidation = [
  query('hours')
    .optional()
    .isInt({ min: 1, max: 168 }) // 最多7天
    .withMessage('小时数必须是1-168之间的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('限制数量必须是1-100之间的整数'),
];

// 公开路由（只读）
router.get('/', 
  contentQueryValidation, 
  validationMiddleware, 
  contentController.getContents
);

router.get('/stats', contentController.getContentStats);

router.get('/recent', 
  recentContentValidation, 
  validationMiddleware, 
  contentController.getRecentContent
);

router.get('/search', 
  searchValidation, 
  validationMiddleware, 
  contentController.searchContent
);

router.get('/:id', 
  contentIdValidation, 
  validationMiddleware, 
  contentController.getContent
);

// 需要认证的路由
router.use(authMiddleware.authenticate);

// 需要编辑权限的路由
router.use(authMiddleware.authorize(['editor', 'admin']));

router.put('/:id', 
  updateContentValidation, 
  validationMiddleware, 
  contentController.updateContent
);

router.patch('/batch/status', 
  batchUpdateValidation, 
  validationMiddleware, 
  contentController.batchUpdateStatus
);

// 需要管理员权限的路由
router.use(authMiddleware.authorize(['admin']));

router.delete('/:id', 
  contentIdValidation, 
  validationMiddleware, 
  contentController.deleteContent
);

export { router as contentRoutes };
