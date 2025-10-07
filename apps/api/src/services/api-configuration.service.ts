// 科技新闻聚合平台 - API配置管理服务
// 管理第三方API配置和客户端实例

import { 
  ApiConfigurationRepository, 
  CreateApiConfigData, 
  UpdateApiConfigData,
  ApiConfiguration,
  ApiAuthType,
  ApiConfigStatus
} from '@tech-news-platform/database';
import { AlphaVantageClient } from './api/alpha-vantage-client';
import { FinnhubClient } from './api/finnhub-client';
import { PolygonClient } from './api/polygon-client';
import { BaseApiClient } from './api/base-api-client';
import { logger } from '../utils/logger';

/**
 * API提供商枚举
 */
export enum ApiProvider {
  ALPHA_VANTAGE = 'alpha_vantage',
  FINNHUB = 'finnhub',
  POLYGON = 'polygon',
  NEWS_API = 'news_api'
}

/**
 * API客户端缓存
 */
class ApiClientCache {
  private clients = new Map<string, BaseApiClient>();
  private lastUpdated = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  get(configId: string): BaseApiClient | null {
    const lastUpdate = this.lastUpdated.get(configId);
    if (lastUpdate && Date.now() - lastUpdate > this.CACHE_TTL) {
      this.clients.delete(configId);
      this.lastUpdated.delete(configId);
      return null;
    }
    return this.clients.get(configId) || null;
  }

  set(configId: string, client: BaseApiClient): void {
    this.clients.set(configId, client);
    this.lastUpdated.set(configId, Date.now());
  }

  delete(configId: string): void {
    this.clients.delete(configId);
    this.lastUpdated.delete(configId);
  }

  clear(): void {
    this.clients.clear();
    this.lastUpdated.clear();
  }
}

/**
 * API配置管理服务
 */
export class ApiConfigurationService {
  private static clientCache = new ApiClientCache();

  /**
   * 创建API配置
   */
  static async createConfiguration(data: CreateApiConfigData): Promise<ApiConfiguration> {
    try {
      // 验证API配置
      await this.validateApiConfiguration(data);

      const config = await ApiConfigurationRepository.create(data);
      
      logger.info('API配置创建成功', { 
        id: config.id, 
        name: config.name, 
        provider: config.provider 
      });

      return config;
    } catch (error) {
      logger.error('创建API配置失败', { error, provider: data.provider });
      throw error;
    }
  }

  /**
   * 获取API配置
   */
  static async getConfiguration(id: string): Promise<ApiConfiguration | null> {
    return ApiConfigurationRepository.findById(id);
  }

  /**
   * 获取所有API配置
   */
  static async getConfigurations(options?: {
    skip?: number;
    take?: number;
    status?: ApiConfigStatus;
    provider?: string;
  }): Promise<{ configs: ApiConfiguration[]; total: number }> {
    return ApiConfigurationRepository.findMany(options);
  }

  /**
   * 获取活跃的API配置
   */
  static async getActiveConfigurations(): Promise<ApiConfiguration[]> {
    return ApiConfigurationRepository.findActive();
  }

  /**
   * 根据提供商获取配置
   */
  static async getConfigurationsByProvider(provider: string): Promise<ApiConfiguration[]> {
    return ApiConfigurationRepository.findByProvider(provider);
  }

  /**
   * 更新API配置
   */
  static async updateConfiguration(id: string, data: UpdateApiConfigData): Promise<ApiConfiguration> {
    try {
      // 如果更新了关键配置，清除缓存
      if (data.apiKey || data.token || data.baseUrl || data.authType) {
        this.clientCache.delete(id);
      }

      const config = await ApiConfigurationRepository.update(id, data);
      
      logger.info('API配置更新成功', { 
        id: config.id, 
        name: config.name, 
        provider: config.provider 
      });

      return config;
    } catch (error) {
      logger.error('更新API配置失败', { error, id });
      throw error;
    }
  }

  /**
   * 删除API配置
   */
  static async deleteConfiguration(id: string): Promise<void> {
    try {
      // 清除缓存
      this.clientCache.delete(id);
      
      await ApiConfigurationRepository.delete(id);
      
      logger.info('API配置删除成功', { id });
    } catch (error) {
      logger.error('删除API配置失败', { error, id });
      throw error;
    }
  }

  /**
   * 获取API客户端实例
   */
  static async getApiClient(configId: string): Promise<BaseApiClient> {
    try {
      // 检查缓存
      const cachedClient = this.clientCache.get(configId);
      if (cachedClient) {
        return cachedClient;
      }

      // 获取配置
      const config = await ApiConfigurationRepository.findById(configId);
      if (!config) {
        throw new Error(`API配置不存在: ${configId}`);
      }

      if (config.status !== ApiConfigStatus.ACTIVE) {
        throw new Error(`API配置未激活: ${config.name}`);
      }

      // 创建客户端实例
      const client = this.createClientInstance(config);
      
      // 缓存客户端
      this.clientCache.set(configId, client);
      
      return client;
    } catch (error) {
      logger.error('获取API客户端失败', { error, configId });
      throw error;
    }
  }

  /**
   * 根据提供商获取API客户端
   */
  static async getApiClientByProvider(provider: string): Promise<BaseApiClient> {
    try {
      const configs = await ApiConfigurationRepository.findByProvider(provider);
      const activeConfig = configs.find(config => config.status === ApiConfigStatus.ACTIVE);
      
      if (!activeConfig) {
        throw new Error(`没有找到活跃的${provider}配置`);
      }

      return this.getApiClient(activeConfig.id);
    } catch (error) {
      logger.error('根据提供商获取API客户端失败', { error, provider });
      throw error;
    }
  }

  /**
   * 创建客户端实例
   */
  private static createClientInstance(config: ApiConfiguration): BaseApiClient {
    switch (config.provider) {
      case ApiProvider.ALPHA_VANTAGE:
        if (!config.apiKey) {
          throw new Error('Alpha Vantage配置缺少API密钥');
        }
        return new AlphaVantageClient(config.apiKey);

      case ApiProvider.FINNHUB:
        if (!config.apiKey) {
          throw new Error('Finnhub配置缺少API密钥');
        }
        return new FinnhubClient(config.apiKey);

      case ApiProvider.POLYGON:
        if (!config.apiKey) {
          throw new Error('Polygon配置缺少API密钥');
        }
        return new PolygonClient(config.apiKey);

      // 其他API提供商的客户端可以在这里添加

      default:
        throw new Error(`不支持的API提供商: ${config.provider}`);
    }
  }

  /**
   * 验证API配置
   */
  private static async validateApiConfiguration(data: CreateApiConfigData): Promise<void> {
    // 基本验证
    if (!data.name || !data.provider || !data.baseUrl) {
      throw new Error('API配置缺少必要字段');
    }

    // 认证验证
    switch (data.authType) {
      case ApiAuthType.API_KEY:
        if (!data.apiKey) {
          throw new Error('API_KEY认证类型需要提供apiKey');
        }
        break;
      case ApiAuthType.BEARER_TOKEN:
        if (!data.token) {
          throw new Error('BEARER_TOKEN认证类型需要提供token');
        }
        break;
      case ApiAuthType.BASIC_AUTH:
        if (!data.username || !data.password) {
          throw new Error('BASIC_AUTH认证类型需要提供username和password');
        }
        break;
    }

    // 提供商特定验证
    switch (data.provider) {
      case ApiProvider.ALPHA_VANTAGE:
        if (data.authType !== ApiAuthType.API_KEY) {
          throw new Error('Alpha Vantage只支持API_KEY认证');
        }
        if (!data.baseUrl.includes('alphavantage.co')) {
          throw new Error('Alpha Vantage的baseUrl应该包含alphavantage.co');
        }
        break;
    }
  }

  /**
   * 测试API配置
   */
  static async testConfiguration(configId: string): Promise<{
    success: boolean;
    message: string;
    responseTime?: number;
  }> {
    try {
      const startTime = Date.now();
      const client = await this.getApiClient(configId);
      
      const isHealthy = await client.healthCheck();
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        return {
          success: true,
          message: 'API配置测试成功',
          responseTime
        };
      } else {
        return {
          success: false,
          message: 'API健康检查失败',
          responseTime
        };
      }
    } catch (error) {
      logger.error('测试API配置失败', { error, configId });
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取API统计信息
   */
  static async getApiStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    byProvider: Record<string, number>;
  }> {
    try {
      const stats = await ApiConfigurationRepository.getStats();
      
      // 获取按提供商分组的统计
      const { configs } = await ApiConfigurationRepository.findMany();
      const byProvider: Record<string, number> = {};
      
      configs.forEach(config => {
        byProvider[config.provider] = (byProvider[config.provider] || 0) + 1;
      });

      return {
        ...stats,
        byProvider
      };
    } catch (error) {
      logger.error('获取API统计失败', { error });
      throw error;
    }
  }

  /**
   * 清除客户端缓存
   */
  static clearCache(): void {
    this.clientCache.clear();
    logger.info('API客户端缓存已清除');
  }

  /**
   * 获取Alpha Vantage客户端（便捷方法）
   */
  static async getAlphaVantageClient(): Promise<AlphaVantageClient> {
    const client = await this.getApiClientByProvider(ApiProvider.ALPHA_VANTAGE);
    if (!(client instanceof AlphaVantageClient)) {
      throw new Error('获取的客户端不是AlphaVantageClient实例');
    }
    return client;
  }

  /**
   * 获取Finnhub客户端（便捷方法）
   */
  static async getFinnhubClient(): Promise<FinnhubClient> {
    const client = await this.getApiClientByProvider(ApiProvider.FINNHUB);
    if (!(client instanceof FinnhubClient)) {
      throw new Error('获取的客户端不是FinnhubClient实例');
    }
    return client;
  }

  /**
   * 获取Polygon客户端（便捷方法）
   */
  static async getPolygonClient(): Promise<PolygonClient> {
    const client = await this.getApiClientByProvider(ApiProvider.POLYGON);
    if (!(client instanceof PolygonClient)) {
      throw new Error('获取的客户端不是PolygonClient实例');
    }
    return client;
  }
}
