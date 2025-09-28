// 科技新闻聚合平台 - 认证路由
// 处理用户注册、登录、密码重置等认证相关操作

import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { sanitizeInput, ValidationRules } from '../utils/sanitize';
import { authRateLimit, passwordResetRateLimit } from '../middleware/rate-limit.middleware';

const router: Router = Router();

// 用户注册
router.post(
  '/register',
  authRateLimit,
  sanitizeInput(ValidationRules.userRegistration),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('密码至少需要8个字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('密码必须包含至少一个小写字母、一个大写字母和一个数字'),
    body('confirmPassword')
      .optional(),
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
    body('acceptTerms')
      .optional()
      .isBoolean(),
  ],
  validateRequest,
  AuthController.register
);

// 用户登录
router.post(
  '/login',
  authRateLimit,
  sanitizeInput(ValidationRules.userLogin),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空'),
    body('remember')
      .optional()
      .isBoolean()
      .withMessage('记住我选项必须是布尔值'),
  ],
  validateRequest,
  AuthController.login
);

// 用户登出
router.post('/logout', authenticateToken, AuthController.logout);

// 刷新令牌
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('刷新令牌不能为空'),
  ],
  validateRequest,
  AuthController.refreshToken
);

// 邮箱验证
router.post(
  '/verify-email',
  [
    body('token')
      .notEmpty()
      .withMessage('验证令牌不能为空'),
  ],
  validateRequest,
  AuthController.verifyEmail
);

// 重新发送验证邮件
router.post(
  '/resend-verification',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
  ],
  validateRequest,
  AuthController.resendVerification
);

// 忘记密码
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  sanitizeInput(ValidationRules.passwordReset),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
  ],
  validateRequest,
  AuthController.forgotPassword
);

// 重置密码
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('重置令牌不能为空'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('密码至少需要8个字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('密码必须包含至少一个小写字母、一个大写字母和一个数字'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('密码确认不匹配');
        }
        return true;
      }),
  ],
  validateRequest,
  AuthController.resetPassword
);

// 更改密码（需要认证）
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('当前密码不能为空'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('新密码至少需要8个字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('新密码必须包含至少一个小写字母、一个大写字母和一个数字'),
    body('confirmNewPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('新密码确认不匹配');
        }
        return true;
      }),
  ],
  validateRequest,
  AuthController.changePassword
);

// 获取当前用户信息
router.get('/me', authenticateToken, AuthController.getCurrentUser);

// 检查邮箱是否已存在
router.post(
  '/check-email',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
  ],
  validateRequest,
  AuthController.checkEmail
);

export default router;
