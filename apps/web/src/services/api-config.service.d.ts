export interface ApiConfiguration {
    id: string;
    name: string;
    provider: string;
    baseUrl: string;
    authType: 'API_KEY' | 'BEARER_TOKEN' | 'OAUTH' | 'BASIC_AUTH' | 'NONE';
    status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'RATE_LIMITED';
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
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    lastCallAt?: string;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateApiConfigData {
    name: string;
    provider: string;
    baseUrl: string;
    authType: 'API_KEY' | 'BEARER_TOKEN' | 'OAUTH' | 'BASIC_AUTH' | 'NONE';
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
export interface UpdateApiConfigData extends Partial<CreateApiConfigData> {
    status?: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'RATE_LIMITED';
}
export interface ApiConfigTestResult {
    success: boolean;
    message: string;
    responseTime?: number;
    error?: string;
}
export interface ApiConfigStats {
    总配置数: number;
    活跃配置: number;
    总调用次数: number;
    成功调用: number;
    失败调用: number;
    按提供商分布: Record<string, number>;
}
declare class ApiConfigService {
    private readonly baseUrl;
    /**
     * 获取API配置列表
     */
    getApiConfigs(): Promise<ApiConfiguration[]>;
    /**
     * 获取单个API配置
     */
    getApiConfig(id: string): Promise<ApiConfiguration>;
    /**
     * 创建API配置
     */
    createApiConfig(data: CreateApiConfigData): Promise<ApiConfiguration>;
    /**
     * 更新API配置
     */
    updateApiConfig(id: string, data: UpdateApiConfigData): Promise<ApiConfiguration>;
    /**
     * 删除API配置
     */
    deleteApiConfig(id: string): Promise<void>;
    /**
     * 测试API配置连接
     */
    testApiConfig(id: string): Promise<ApiConfigTestResult>;
    /**
     * 获取API配置统计信息
     */
    getApiConfigStats(): Promise<ApiConfigStats>;
}
export declare const apiConfigService: ApiConfigService;
export {};
