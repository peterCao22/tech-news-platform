import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
/**
 * API认证类型
 */
export declare enum AuthType {
    API_KEY = "api_key",
    BEARER_TOKEN = "bearer_token",
    OAUTH = "oauth",
    BASIC_AUTH = "basic_auth",
    NONE = "none"
}
/**
 * API认证配置
 */
export interface ApiAuthConfig {
    type: AuthType;
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
    headerName?: string;
}
/**
 * API客户端配置
 */
export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
    auth?: ApiAuthConfig;
    headers?: Record<string, string>;
}
/**
 * API调用统计
 */
export interface ApiCallStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageResponseTime: number;
    lastCallTime: Date | null;
    lastError: string | null;
}
/**
 * API错误类型
 */
export declare class ApiError extends Error {
    statusCode?: number | undefined;
    response?: any | undefined;
    originalError?: Error | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: any | undefined, originalError?: Error | undefined);
}
/**
 * 速率限制错误
 */
export declare class RateLimitError extends ApiError {
    retryAfter?: number | undefined;
    constructor(message: string, retryAfter?: number | undefined);
}
/**
 * 认证错误
 */
export declare class AuthenticationError extends ApiError {
    constructor(message: string);
}
/**
 * API客户端基础类
 * 提供统一的HTTP客户端功能，包括认证、错误处理、重试机制等
 */
export declare abstract class BaseApiClient {
    protected client: AxiosInstance;
    protected config: ApiClientConfig;
    protected stats: ApiCallStats;
    private requestQueue;
    constructor(config: ApiClientConfig);
    /**
     * 创建axios实例
     */
    private createAxiosInstance;
    /**
     * 设置请求/响应拦截器
     */
    private setupInterceptors;
    /**
     * 添加认证信息到请求
     */
    private addAuthentication;
    /**
     * 检查速率限制
     */
    private checkRateLimit;
    /**
     * 处理API错误
     */
    private handleApiError;
    /**
     * 更新调用统计
     */
    private updateStats;
    /**
     * 清理敏感header信息用于日志
     */
    private sanitizeHeaders;
    /**
     * 执行带重试的API请求
     */
    protected makeRequest<T = any>(config: AxiosRequestConfig, retryCount?: number): Promise<AxiosResponse<T>>;
    /**
     * 判断是否应该重试
     */
    private shouldRetry;
    /**
     * 计算重试延迟（指数退避）
     */
    private calculateRetryDelay;
    /**
     * 休眠函数
     */
    private sleep;
    /**
     * GET请求
     */
    protected get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * POST请求
     */
    protected post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * PUT请求
     */
    protected put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * DELETE请求
     */
    protected delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * 获取API调用统计
     */
    getStats(): ApiCallStats;
    /**
     * 重置统计信息
     */
    resetStats(): void;
    /**
     * 健康检查
     */
    abstract healthCheck(): Promise<boolean>;
    /**
     * 获取API服务状态
     */
    getStatus(): {
        isHealthy: boolean;
        stats: ApiCallStats;
        config: Omit<ApiClientConfig, 'auth'>;
    };
}
