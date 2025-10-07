// 科技新闻聚合平台 - API配置控制器
// 处理API配置管理的HTTP请求
import { body, param, query, validationResult } from 'express-validator';
import { ApiConfigurationService, ApiProvider } from '../services/api-configuration.service';
import { ApiAuthType, ApiConfigStatus } from '@tech-news-platform/database';
import { logger } from '../utils/logger';
/**
 * API配置控制器
 */
export class ApiConfigurationController {
    /**
     * 创建API配置
     */
    static async create(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: '输入验证失败',
                    errors: errors.array()
                });
                return;
            }
            const config = await ApiConfigurationService.createConfiguration(req.body);
            res.status(201).json({
                success: true,
                message: 'API配置创建成功',
                data: {
                    id: config.id,
                    name: config.name,
                    provider: config.provider,
                    status: config.status,
                    createdAt: config.createdAt
                }
            });
        }
        catch (error) {
            logger.error('创建API配置失败', { error, body: req.body });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : '创建API配置失败'
            });
        }
    }
    /**
     * 获取API配置列表
     */
    static async getList(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: '输入验证失败',
                    errors: errors.array()
                });
                return;
            }
            const { page = 1, limit = 20, status, provider } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const result = await ApiConfigurationService.getConfigurations({
                skip,
                take: Number(limit),
                status: status,
                provider: provider
            });
            res.json({
                success: true,
                data: {
                    configs: result.configs,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: result.total,
                        totalPages: Math.ceil(result.total / Number(limit))
                    }
                }
            });
        }
        catch (error) {
            logger.error('获取API配置列表失败', { error, query: req.query });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: '获取API配置列表失败'
            });
        }
    }
    /**
     * 获取单个API配置
     */
    static async getById(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: '输入验证失败',
                    errors: errors.array()
                });
                return;
            }
            const { id } = req.params;
            const config = await ApiConfigurationService.getConfiguration(id);
            if (!config) {
                res.status(404).json({
                    success: false,
                    code: 'NOT_FOUND',
                    message: 'API配置不存在'
                });
                return;
            }
            // 隐藏敏感信息
            const safeConfig = {
                ...config,
                apiKey: config.apiKey ? '***' : null,
                token: config.token ? '***' : null,
                password: config.password ? '***' : null
            };
            res.json({
                success: true,
                data: safeConfig
            });
        }
        catch (error) {
            logger.error('获取API配置失败', { error, id: req.params.id });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: '获取API配置失败'
            });
        }
    }
    /**
     * 更新API配置
     */
    static async update(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: '输入验证失败',
                    errors: errors.array()
                });
                return;
            }
            const { id } = req.params;
            const config = await ApiConfigurationService.updateConfiguration(id, req.body);
            // 隐藏敏感信息
            const safeConfig = {
                ...config,
                apiKey: config.apiKey ? '***' : null,
                token: config.token ? '***' : null,
                password: config.password ? '***' : null
            };
            res.json({
                success: true,
                message: 'API配置更新成功',
                data: safeConfig
            });
        }
        catch (error) {
            logger.error('更新API配置失败', { error, id: req.params.id, body: req.body });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : '更新API配置失败'
            });
        }
    }
    /**
     * 删除API配置
     */
    static async delete(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: '输入验证失败',
                    errors: errors.array()
                });
                return;
            }
            const { id } = req.params;
            await ApiConfigurationService.deleteConfiguration(id);
            res.json({
                success: true,
                message: 'API配置删除成功'
            });
        }
        catch (error) {
            logger.error('删除API配置失败', { error, id: req.params.id });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : '删除API配置失败'
            });
        }
    }
    /**
     * 测试API配置
     */
    static async test(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: '输入验证失败',
                    errors: errors.array()
                });
                return;
            }
            const { id } = req.params;
            const result = await ApiConfigurationService.testConfiguration(id);
            res.json({
                success: result.success,
                message: result.message,
                data: {
                    responseTime: result.responseTime
                }
            });
        }
        catch (error) {
            logger.error('测试API配置失败', { error, id: req.params.id });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: '测试API配置失败'
            });
        }
    }
    /**
     * 获取API统计信息
     */
    static async getStats(req, res) {
        try {
            const stats = await ApiConfigurationService.getApiStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger.error('获取API统计失败', { error });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: '获取API统计失败'
            });
        }
    }
    /**
     * 清除API客户端缓存
     */
    static async clearCache(req, res) {
        try {
            ApiConfigurationService.clearCache();
            res.json({
                success: true,
                message: 'API客户端缓存已清除'
            });
        }
        catch (error) {
            logger.error('清除API缓存失败', { error });
            res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: '清除API缓存失败'
            });
        }
    }
}
/**
 * 创建API配置验证规则
 */
export const createApiConfigValidation = [
    body('name')
        .notEmpty()
        .withMessage('配置名称不能为空')
        .isLength({ min: 1, max: 100 })
        .withMessage('配置名称长度应在1-100字符之间'),
    body('provider')
        .notEmpty()
        .withMessage('API提供商不能为空')
        .isIn(Object.values(ApiProvider))
        .withMessage('无效的API提供商'),
    body('baseUrl')
        .notEmpty()
        .withMessage('基础URL不能为空')
        .isURL()
        .withMessage('基础URL格式无效'),
    body('authType')
        .notEmpty()
        .withMessage('认证类型不能为空')
        .isIn(Object.values(ApiAuthType))
        .withMessage('无效的认证类型'),
    body('apiKey')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('API密钥长度应在1-500字符之间'),
    body('token')
        .optional()
        .isLength({ min: 1, max: 1000 })
        .withMessage('令牌长度应在1-1000字符之间'),
    body('username')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('用户名长度应在1-100字符之间'),
    body('password')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('密码长度应在1-100字符之间'),
    body('timeout')
        .optional()
        .isInt({ min: 1000, max: 300000 })
        .withMessage('超时时间应在1000-300000毫秒之间'),
    body('retryAttempts')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('重试次数应在0-10之间'),
    body('retryDelay')
        .optional()
        .isInt({ min: 100, max: 60000 })
        .withMessage('重试延迟应在100-60000毫秒之间')
];
/**
 * 更新API配置验证规则
 */
export const updateApiConfigValidation = [
    param('id')
        .notEmpty()
        .withMessage('配置ID不能为空')
        .isString()
        .withMessage('配置ID必须是字符串'),
    body('name')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('配置名称长度应在1-100字符之间'),
    body('baseUrl')
        .optional()
        .isURL()
        .withMessage('基础URL格式无效'),
    body('authType')
        .optional()
        .isIn(Object.values(ApiAuthType))
        .withMessage('无效的认证类型'),
    body('status')
        .optional()
        .isIn(Object.values(ApiConfigStatus))
        .withMessage('无效的配置状态'),
    body('apiKey')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('API密钥长度应在1-500字符之间'),
    body('token')
        .optional()
        .isLength({ min: 1, max: 1000 })
        .withMessage('令牌长度应在1-1000字符之间'),
    body('timeout')
        .optional()
        .isInt({ min: 1000, max: 300000 })
        .withMessage('超时时间应在1000-300000毫秒之间'),
    body('retryAttempts')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('重试次数应在0-10之间')
];
/**
 * 获取API配置验证规则
 */
export const getApiConfigValidation = [
    param('id')
        .notEmpty()
        .withMessage('配置ID不能为空')
        .isString()
        .withMessage('配置ID必须是字符串')
];
/**
 * 获取API配置列表验证规则
 */
export const getApiConfigListValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('页码必须是大于0的整数'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('每页数量必须在1-100之间'),
    query('status')
        .optional()
        .isIn(Object.values(ApiConfigStatus))
        .withMessage('无效的配置状态'),
    query('provider')
        .optional()
        .isString()
        .withMessage('提供商必须是字符串')
];
