import { CreateApiConfigData, UpdateApiConfigData, ApiConfiguration, ApiConfigStatus } from '@tech-news-platform/database';
import { AlphaVantageClient } from './api/alpha-vantage-client';
import { BaseApiClient } from './api/base-api-client';
/**
 * API提供商枚举
 */
export declare enum ApiProvider {
    ALPHA_VANTAGE = "alpha_vantage",
    FINNHUB = "finnhub",
    POLYGON = "polygon",
    NEWS_API = "news_api"
}
/**
 * API配置管理服务
 */
export declare class ApiConfigurationService {
    private static clientCache;
    /**
     * 创建API配置
     */
    static createConfiguration(data: CreateApiConfigData): Promise<ApiConfiguration>;
    /**
     * 获取API配置
     */
    static getConfiguration(id: string): Promise<ApiConfiguration | null>;
    /**
     * 获取所有API配置
     */
    static getConfigurations(options?: {
        skip?: number;
        take?: number;
        status?: ApiConfigStatus;
        provider?: string;
    }): Promise<{
        configs: ApiConfiguration[];
        total: number;
    }>;
    /**
     * 获取活跃的API配置
     */
    static getActiveConfigurations(): Promise<ApiConfiguration[]>;
    /**
     * 根据提供商获取配置
     */
    static getConfigurationsByProvider(provider: string): Promise<ApiConfiguration[]>;
    /**
     * 更新API配置
     */
    static updateConfiguration(id: string, data: UpdateApiConfigData): Promise<ApiConfiguration>;
    /**
     * 删除API配置
     */
    static deleteConfiguration(id: string): Promise<void>;
    /**
     * 获取API客户端实例
     */
    static getApiClient(configId: string): Promise<BaseApiClient>;
    /**
     * 根据提供商获取API客户端
     */
    static getApiClientByProvider(provider: string): Promise<BaseApiClient>;
    /**
     * 创建客户端实例
     */
    private static createClientInstance;
    /**
     * 验证API配置
     */
    private static validateApiConfiguration;
    /**
     * 测试API配置
     */
    static testConfiguration(configId: string): Promise<{
        success: boolean;
        message: string;
        responseTime?: number;
    }>;
    /**
     * 获取API统计信息
     */
    static getApiStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        error: number;
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
        byProvider: Record<string, number>;
    }>;
    /**
     * 清除客户端缓存
     */
    static clearCache(): void;
    /**
     * 获取Alpha Vantage客户端（便捷方法）
     */
    static getAlphaVantageClient(): Promise<AlphaVantageClient>;
}
