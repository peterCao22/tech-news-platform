// 科技新闻聚合平台 - API客户端基础框架
// 提供统一的第三方API集成能力
import axios from 'axios';
import { logger } from '../../utils/logger';
/**
 * API认证类型
 */
export var AuthType;
(function (AuthType) {
    AuthType["API_KEY"] = "api_key";
    AuthType["BEARER_TOKEN"] = "bearer_token";
    AuthType["OAUTH"] = "oauth";
    AuthType["BASIC_AUTH"] = "basic_auth";
    AuthType["NONE"] = "none";
})(AuthType || (AuthType = {}));
/**
 * API错误类型
 */
export class ApiError extends Error {
    statusCode;
    response;
    originalError;
    constructor(message, statusCode, response, originalError) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.originalError = originalError;
        this.name = 'ApiError';
    }
}
/**
 * 速率限制错误
 */
export class RateLimitError extends ApiError {
    retryAfter;
    constructor(message, retryAfter) {
        super(message, 429);
        this.retryAfter = retryAfter;
        this.name = 'RateLimitError';
    }
}
/**
 * 认证错误
 */
export class AuthenticationError extends ApiError {
    constructor(message) {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}
/**
 * API客户端基础类
 * 提供统一的HTTP客户端功能，包括认证、错误处理、重试机制等
 */
export class BaseApiClient {
    client;
    config;
    stats;
    requestQueue = [];
    constructor(config) {
        this.config = {
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            ...config
        };
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageResponseTime: 0,
            lastCallTime: null,
            lastError: null
        };
        this.client = this.createAxiosInstance();
        this.setupInterceptors();
    }
    /**
     * 创建axios实例
     */
    createAxiosInstance() {
        const instance = axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'TechNewsPlatform/1.0',
                ...this.config.headers
            }
        });
        return instance;
    }
    /**
     * 设置请求/响应拦截器
     */
    setupInterceptors() {
        // 请求拦截器
        this.client.interceptors.request.use((config) => {
            // 添加认证信息
            this.addAuthentication(config);
            // 检查速率限制
            this.checkRateLimit();
            // 记录请求开始时间
            config.metadata = { startTime: Date.now() };
            logger.debug('API请求发送', {
                url: config.url,
                method: config.method,
                headers: this.sanitizeHeaders(config.headers)
            });
            return config;
        }, (error) => {
            logger.error('API请求拦截器错误', { error: error.message });
            return Promise.reject(error);
        });
        // 响应拦截器
        this.client.interceptors.response.use((response) => {
            // 更新统计信息
            this.updateStats(true, response.config.metadata?.startTime);
            logger.debug('API响应成功', {
                url: response.config.url,
                status: response.status,
                responseTime: Date.now() - (response.config.metadata?.startTime || 0)
            });
            return response;
        }, (error) => {
            // 更新统计信息
            this.updateStats(false, error.config?.metadata?.startTime);
            // 处理API错误
            const apiError = this.handleApiError(error);
            logger.error('API响应错误', {
                url: error.config?.url,
                status: error.response?.status,
                message: apiError.message,
                responseTime: Date.now() - (error.config?.metadata?.startTime || 0)
            });
            return Promise.reject(apiError);
        });
    }
    /**
     * 添加认证信息到请求
     */
    addAuthentication(config) {
        if (!this.config.auth || this.config.auth.type === AuthType.NONE) {
            return;
        }
        const auth = this.config.auth;
        switch (auth.type) {
            case AuthType.API_KEY:
                if (auth.apiKey) {
                    const headerName = auth.headerName || 'X-API-Key';
                    config.headers = config.headers || {};
                    config.headers[headerName] = auth.apiKey;
                }
                break;
            case AuthType.BEARER_TOKEN:
                if (auth.token) {
                    config.headers = config.headers || {};
                    config.headers['Authorization'] = `Bearer ${auth.token}`;
                }
                break;
            case AuthType.BASIC_AUTH:
                if (auth.username && auth.password) {
                    config.auth = {
                        username: auth.username,
                        password: auth.password
                    };
                }
                break;
            case AuthType.OAUTH:
                // OAuth实现留待具体子类处理
                break;
        }
    }
    /**
     * 检查速率限制
     */
    checkRateLimit() {
        if (!this.config.rateLimit) {
            return;
        }
        const now = Date.now();
        const windowStart = now - this.config.rateLimit.windowMs;
        // 清理过期的请求记录
        this.requestQueue = this.requestQueue.filter(req => req.timestamp > windowStart);
        // 检查是否超过限制
        if (this.requestQueue.length >= this.config.rateLimit.maxRequests) {
            const oldestRequest = this.requestQueue[0];
            const retryAfter = Math.ceil((oldestRequest.timestamp + this.config.rateLimit.windowMs - now) / 1000);
            throw new RateLimitError(`速率限制：${this.config.rateLimit.maxRequests}请求/${this.config.rateLimit.windowMs}ms`, retryAfter);
        }
        // 记录当前请求
        this.requestQueue.push({ timestamp: now });
    }
    /**
     * 处理API错误
     */
    handleApiError(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            switch (status) {
                case 401:
                    return new AuthenticationError('API认证失败');
                case 429:
                    const retryAfter = error.response.headers['retry-after'];
                    return new RateLimitError('API速率限制', retryAfter ? parseInt(retryAfter) : undefined);
                default:
                    return new ApiError(`API请求失败: ${status}`, status, data, error);
            }
        }
        else if (error.request) {
            return new ApiError('网络请求失败', undefined, undefined, error);
        }
        else {
            return new ApiError('请求配置错误', undefined, undefined, error);
        }
    }
    /**
     * 更新调用统计
     */
    updateStats(success, startTime) {
        this.stats.totalCalls++;
        this.stats.lastCallTime = new Date();
        if (success) {
            this.stats.successfulCalls++;
        }
        else {
            this.stats.failedCalls++;
        }
        if (startTime) {
            const responseTime = Date.now() - startTime;
            this.stats.averageResponseTime =
                (this.stats.averageResponseTime * (this.stats.totalCalls - 1) + responseTime) / this.stats.totalCalls;
        }
    }
    /**
     * 清理敏感header信息用于日志
     */
    sanitizeHeaders(headers) {
        if (!headers)
            return {};
        const sanitized = { ...headers };
        const sensitiveKeys = ['authorization', 'x-api-key', 'api-key'];
        Object.keys(sanitized).forEach(key => {
            if (sensitiveKeys.includes(key.toLowerCase())) {
                sanitized[key] = '***';
            }
        });
        return sanitized;
    }
    /**
     * 执行带重试的API请求
     */
    async makeRequest(config, retryCount = 0) {
        try {
            return await this.client.request(config);
        }
        catch (error) {
            if (retryCount < (this.config.retryAttempts || 0) && this.shouldRetry(error)) {
                const delay = this.calculateRetryDelay(retryCount);
                logger.warn(`API请求失败，${delay}ms后重试 (${retryCount + 1}/${this.config.retryAttempts})`, {
                    url: config.url,
                    error: error instanceof Error ? error.message : String(error)
                });
                await this.sleep(delay);
                return this.makeRequest(config, retryCount + 1);
            }
            throw error;
        }
    }
    /**
     * 判断是否应该重试
     */
    shouldRetry(error) {
        if (error instanceof RateLimitError || error instanceof AuthenticationError) {
            return false;
        }
        if (error instanceof ApiError) {
            // 5xx错误可以重试，4xx错误通常不应该重试
            return error.statusCode ? error.statusCode >= 500 : true;
        }
        return true;
    }
    /**
     * 计算重试延迟（指数退避）
     */
    calculateRetryDelay(retryCount) {
        const baseDelay = this.config.retryDelay || 1000;
        return baseDelay * Math.pow(2, retryCount);
    }
    /**
     * 休眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * GET请求
     */
    async get(url, config) {
        const response = await this.makeRequest({
            method: 'GET',
            url,
            ...config
        });
        return response.data;
    }
    /**
     * POST请求
     */
    async post(url, data, config) {
        const response = await this.makeRequest({
            method: 'POST',
            url,
            data,
            ...config
        });
        return response.data;
    }
    /**
     * PUT请求
     */
    async put(url, data, config) {
        const response = await this.makeRequest({
            method: 'PUT',
            url,
            data,
            ...config
        });
        return response.data;
    }
    /**
     * DELETE请求
     */
    async delete(url, config) {
        const response = await this.makeRequest({
            method: 'DELETE',
            url,
            ...config
        });
        return response.data;
    }
    /**
     * 获取API调用统计
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * 重置统计信息
     */
    resetStats() {
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageResponseTime: 0,
            lastCallTime: null,
            lastError: null
        };
    }
    /**
     * 获取API服务状态
     */
    getStatus() {
        return {
            isHealthy: this.stats.failedCalls === 0 ||
                (this.stats.successfulCalls / this.stats.totalCalls) > 0.8,
            stats: this.getStats(),
            config: {
                baseURL: this.config.baseURL,
                timeout: this.config.timeout,
                retryAttempts: this.config.retryAttempts,
                retryDelay: this.config.retryDelay,
                rateLimit: this.config.rateLimit,
                headers: this.config.headers
            }
        };
    }
}
