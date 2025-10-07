// 科技新闻聚合平台 - API配置路由
// 定义API配置管理的路由端点

import { Router } from 'express';
import { 
  ApiConfigurationController,
  createApiConfigValidation,
  updateApiConfigValidation,
  getApiConfigValidation,
  getApiConfigListValidation
} from '../controllers/api-configuration.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@tech-news-platform/database';

const router: any = Router();

/**
 * @route   GET /api/api-configs
 * @desc    获取API配置列表
 * @access  Admin
 */
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN]),
  getApiConfigListValidation,
  ApiConfigurationController.getList
);

/**
 * @route   POST /api/api-configs
 * @desc    创建API配置
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN]),
  createApiConfigValidation,
  ApiConfigurationController.create
);

/**
 * @route   GET /api/api-configs/stats
 * @desc    获取API统计信息
 * @access  Admin
 */
router.get(
  '/stats',
  authenticate,
  authorize([UserRole.ADMIN]),
  ApiConfigurationController.getStats
);

/**
 * @route   POST /api/api-configs/clear-cache
 * @desc    清除API客户端缓存
 * @access  Admin
 */
router.post(
  '/clear-cache',
  authenticate,
  authorize([UserRole.ADMIN]),
  ApiConfigurationController.clearCache
);

/**
 * @route   GET /api/api-configs/:id
 * @desc    获取单个API配置
 * @access  Admin
 */
router.get(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN]),
  getApiConfigValidation,
  ApiConfigurationController.getById
);

/**
 * @route   PUT /api/api-configs/:id
 * @desc    更新API配置
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN]),
  updateApiConfigValidation,
  ApiConfigurationController.update
);

/**
 * @route   DELETE /api/api-configs/:id
 * @desc    删除API配置
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN]),
  getApiConfigValidation,
  ApiConfigurationController.delete
);

/**
 * @route   POST /api/api-configs/:id/test
 * @desc    测试API配置
 * @access  Admin
 */
router.post(
  '/:id/test',
  authenticate,
  authorize([UserRole.ADMIN]),
  getApiConfigValidation,
  ApiConfigurationController.test
);

export default router;
