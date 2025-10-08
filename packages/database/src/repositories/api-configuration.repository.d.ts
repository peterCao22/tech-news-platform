import { ApiConfiguration, ApiCallLog, ApiConfigStatus, ApiAuthType } from '../generated';
/**
 * API配置创建数据
 */
export interface CreateApiConfigData {
    name: string;
    provider: string;
    baseUrl: string;
    authType: ApiAuthType;
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
    headerName?: string;
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
}
/**
 * API配置更新数据
 */
export interface UpdateApiConfigData {
    name?: string;
    baseUrl?: string;
    authType?: ApiAuthType;
    status?: ApiConfigStatus;
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
    headerName?: string;
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
}
/**
 * API调用日志数据
 */
export interface CreateApiCallLogData {
    configId: string;
    method: string;
    endpoint: string;
    requestHeaders?: Record<string, any>;
    requestBody?: any;
    statusCode?: number;
    responseHeaders?: Record<string, any>;
    responseBody?: any;
    duration?: number;
    success: boolean;
    errorMessage?: string;
}
/**
 * API配置仓库类
 */
export declare class ApiConfigurationRepository {
    /**
     * 创建API配置
     */
    static create(data: CreateApiConfigData): Promise<ApiConfiguration>;
    /**
     * 根据ID获取API配置
     */
    static findById(id: string): Promise<ApiConfiguration | null>;
    /**
     * 根据提供商获取API配置
     */
    static findByProvider(provider: string): Promise<ApiConfiguration[]>;
    /**
     * 获取活跃的API配置
     */
    static findActive(): Promise<ApiConfiguration[]>;
    /**
     * 获取所有API配置
     */
    static findMany(options?: {
        skip?: number;
        take?: number;
        status?: ApiConfigStatus;
        provider?: string;
    }): Promise<{
        configs: ApiConfiguration[];
        total: number;
    }>;
    /**
     * 更新API配置
     */
    static update(id: string, data: UpdateApiConfigData): Promise<ApiConfiguration>;
    /**
     * 删除API配置
     */
    static delete(id: string): Promise<void>;
    /**
     * 更新API调用统计
     */
    static updateCallStats(id: string, success: boolean, errorMessage?: string): Promise<void>;
    /**
     * 记录API调用日志
     */
    static logApiCall(data: CreateApiCallLogData): Promise<ApiCallLog>;
    /**
     * 获取API调用日志
     */
    static getCallLogs(configId: string, options?: {
        skip?: number;
        take?: number;
        success?: boolean;
    }): Promise<{
        logs: ApiCallLog[];
        total: number;
    }>;
    /**
     * 清理敏感header信息
     */
    private static sanitizeHeaders;
    /**
     * 获取API配置统计信息
     */
    static getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        error: number;
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
    }>;
}
