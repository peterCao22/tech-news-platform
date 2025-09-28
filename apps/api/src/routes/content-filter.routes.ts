import { Router } from 'express';
import { body } from 'express-validator';
import { contentFilterController } from '../controllers/content-filter.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// 验证规则
const testFilterValidation = [
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('标题不能为空'),
  body('description')
    .optional()
    .isString()
    .withMessage('描述必须是字符串'),
  body('content')
    .optional()
    .isString()
    .withMessage('内容必须是字符串'),
];

const batchTestValidation = [
  body('contents')
    .isArray({ min: 1 })
    .withMessage('内容列表不能为空'),
  body('contents.*.title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('每个内容的标题不能为空'),
];

const updateConfigValidation = [
  body('minIncludeScore')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('最小包含分数必须在0-1之间'),
  body('maxExcludeScore')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('最大排除分数必须在0-1之间'),
];

// 公开路由
router.get('/templates', contentFilterController.getFilterTemplates);

// 需要认证的路由
router.use(authMiddleware.authenticate);

// 测试过滤功能（所有认证用户可用）
router.post('/test', 
  testFilterValidation, 
  validationMiddleware, 
  contentFilterController.testContentFilter
);

router.post('/batch-test', 
  batchTestValidation, 
  validationMiddleware, 
  contentFilterController.batchTestContentFilter
);

// 需要管理员权限的路由
router.use(authMiddleware.authorize(['admin']));

router.get('/config', contentFilterController.getFilterConfig);

router.put('/config', 
  updateConfigValidation, 
  validationMiddleware, 
  contentFilterController.updateFilterConfig
);

export { router as contentFilterRoutes };
