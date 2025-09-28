import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { sourceController } from '../controllers/source.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { SourceType, SourceStatus } from '@tech-news-platform/database';

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// 验证规则
const createSourceValidation = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('名称必须是1-255个字符的字符串'),
  
  body('type')
    .isIn(Object.values(SourceType))
    .withMessage('类型必须是有效的源类型'),
  
  body('url')
    .optional()
    .isURL()
    .withMessage('URL必须是有效的网址'),
  
  body('config')
    .optional()
    .isObject()
    .withMessage('配置必须是有效的JSON对象'),
];

const updateSourceValidation = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('ID必须是有效的字符串'),
  
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('名称必须是1-255个字符的字符串'),
  
  body('url')
    .optional()
    .isURL()
    .withMessage('URL必须是有效的网址'),
  
  body('config')
    .optional()
    .isObject()
    .withMessage('配置必须是有效的JSON对象'),
  
  body('status')
    .optional()
    .isIn(Object.values(SourceStatus))
    .withMessage('状态必须是有效的源状态'),
];

const validateUrlValidation = [
  body('url')
    .isURL()
    .withMessage('URL必须是有效的网址'),
];

const sourceIdValidation = [
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
    .isString()
    .withMessage('状态必须是字符串'),
];

// 公开路由（只读）
router.get('/', sourceController.getSources);
router.get('/stats', sourceController.getSourceStats);
router.get('/:id', sourceIdValidation, validationMiddleware, sourceController.getSource);
router.get('/:id/content', 
  [...sourceIdValidation, ...contentQueryValidation], 
  validationMiddleware, 
  sourceController.getSourceContent
);

// 需要认证的路由
router.use(authMiddleware.authenticate);

// RSS URL验证（所有认证用户可用）
router.post('/validate-url', 
  validateUrlValidation, 
  validationMiddleware, 
  sourceController.validateRSSUrl
);

// 需要编辑权限的路由 (暂时允许所有认证用户用于测试)
// router.use(authMiddleware.authorize(['editor', 'admin']));

router.post('/', 
  createSourceValidation, 
  validationMiddleware, 
  sourceController.createSource
);

router.put('/:id', 
  updateSourceValidation, 
  validationMiddleware, 
  sourceController.updateSource
);

router.post('/:id/fetch', 
  sourceIdValidation, 
  validationMiddleware, 
  sourceController.fetchSource
);

// 需要管理员权限的路由
router.use(authMiddleware.authorize(['admin']));

router.delete('/:id', 
  sourceIdValidation, 
  validationMiddleware, 
  sourceController.deleteSource
);

router.post('/fetch-all', sourceController.fetchAllSources);

export { router as sourceRoutes };
