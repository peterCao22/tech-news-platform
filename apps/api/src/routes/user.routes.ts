// 科技新闻聚合平台 - 用户管理路由
// 处理用户资料管理和用户相关操作

import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router: Router = Router();

// 获取用户资料
router.get('/profile', authenticateToken, UserController.getProfile);

// 更新用户资料
router.put(
  '/profile',
  authenticateToken,
  [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('姓名长度应在2-50个字符之间'),
    body('firstName')
      .optional()
      .isLength({ min: 1, max: 25 })
      .withMessage('名字长度应在1-25个字符之间'),
    body('lastName')
      .optional()
      .isLength({ min: 1, max: 25 })
      .withMessage('姓氏长度应在1-25个字符之间'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('个人简介不能超过500个字符'),
    body('timezone')
      .optional()
      .isString()
      .withMessage('时区必须是字符串'),
    body('language')
      .optional()
      .isLength({ min: 2, max: 10 })
      .withMessage('语言代码长度应在2-10个字符之间'),
  ],
  validateRequest,
  UserController.updateProfile
);

// 更新用户偏好设置
router.put(
  '/preferences',
  authenticateToken,
  [
    body('preferences')
      .isObject()
      .withMessage('偏好设置必须是对象'),
  ],
  validateRequest,
  UserController.updatePreferences
);

// 获取用户活动日志
router.get('/activities', authenticateToken, UserController.getActivities);

// 删除用户账户
router.delete('/account', authenticateToken, UserController.deleteAccount);

// 管理员路由 - 获取用户列表
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  UserController.getUsers
);

// 管理员路由 - 获取用户详情
router.get(
  '/:userId',
  authenticateToken,
  requireAdmin,
  UserController.getUserById
);

// 管理员路由 - 更新用户状态
router.patch(
  '/:userId/status',
  authenticateToken,
  requireAdmin,
  [
    body('status')
      .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
      .withMessage('用户状态必须是 ACTIVE、INACTIVE 或 SUSPENDED'),
  ],
  validateRequest,
  UserController.updateUserStatus
);

// 管理员路由 - 更新用户角色
router.patch(
  '/:userId/role',
  authenticateToken,
  requireAdmin,
  [
    body('role')
      .isIn(['USER', 'EDITOR', 'ADMIN'])
      .withMessage('用户角色必须是 USER、EDITOR 或 ADMIN'),
  ],
  validateRequest,
  UserController.updateUserRole
);

// 管理员路由 - 获取用户统计
router.get(
  '/stats/overview',
  authenticateToken,
  requireAdmin,
  UserController.getUserStats
);

export default router;
