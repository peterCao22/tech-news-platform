// 科技新闻聚合平台 - API客户端基础框架
// 提供统一的第三方API集成能力

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios';
import { logger } from '../../utils/logger';

/**
 * API认证类型
 */
export enum AuthType {
  API_KEY = 'api_key',
  BEARER_TOKEN = 'bearer_token',
  OAUTH = 'oauth',
  BASIC_AUTH = 'basic_auth',
  NONE = 'none'
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
  headerName?: string; // 自定义header名称，如 'X-API-Key'
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
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 速率限制错误
 */
export class RateLimitError extends ApiError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends ApiError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * API客户端基础类
 * 提供统一的HTTP客户端功能，包括认证、错误处理、重试机制等
 */
export abstract class BaseApiClient {
  protected client: AxiosInstance;
  protected config: ApiClientConfig;
  protected stats: ApiCallStats;
  private requestQueue: Array<{ timestamp: number }> = [];

  constructor(config: ApiClientConfig) {
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
  private createAxiosInstance(): AxiosInstance {
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
  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加认证信息
        this.addAuthentication(config);
        
        // 检查速率限制
        this.checkRateLimit();
        
        // 记录请求开始时间
        (config as any).metadata = { startTime: Date.now() };
        
        logger.debug('API请求发送', {
          url: config.url,
          method: config.method,
          headers: this.sanitizeHeaders(config.headers)
        });

        return config;
      },
      (error) => {
        logger.error('API请求拦截器错误', { error: error.message });
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        // 更新统计信息
        this.updateStats(true, (response.config as any).metadata?.startTime);
        
        logger.debug('API响应成功', {
          url: response.config.url,
          status: response.status,
          responseTime: Date.now() - ((response.config as any).metadata?.startTime || 0)
        });

        return response;
      },
      (error: AxiosError) => {
        // 更新统计信息
        this.updateStats(false, (error.config as any)?.metadata?.startTime);
        
        // 处理API错误
        const apiError = this.handleApiError(error);
        
        logger.error('API响应错误', {
          url: error.config?.url,
          status: error.response?.status,
          message: apiError.message,
          responseTime: Date.now() - ((error.config as any)?.metadata?.startTime || 0)
        });

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * 添加认证信息到请求
   */
  private addAuthentication(config: AxiosRequestConfig): void {
    if (!this.config.auth || this.config.auth.type === AuthType.NONE) {
      return;
    }

    const auth = this.config.auth;

    switch (auth.type) {
      case AuthType.API_KEY:
        if (auth.apiKey) {
          // 支持Header认证
          const headerName = auth.headerName || 'X-API-Key';
          config.headers = config.headers || {};
          config.headers[headerName] = auth.apiKey;
          
          // Finnhub同时支持URL参数认证，添加到params
          // 这是Finnhub推荐的方式
          if (headerName === 'X-Finnhub-Token') {
            config.params = config.params || {};
            config.params.token = auth.apiKey;
          }
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
  private checkRateLimit(): void {
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
  private handleApiError(error: AxiosError): ApiError {
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
          return new ApiError(
            `API请求失败: ${status}`,
            status,
            data,
            error
          );
      }
    } else if (error.request) {
      return new ApiError('网络请求失败', undefined, undefined, error);
    } else {
      return new ApiError('请求配置错误', undefined, undefined, error);
    }
  }

  /**
   * 更新调用统计
   */
  private updateStats(success: boolean, startTime?: number): void {
    this.stats.totalCalls++;
    this.stats.lastCallTime = new Date();

    if (success) {
      this.stats.successfulCalls++;
    } else {
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
  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};
    
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
  protected async makeRequest<T = any>(
    config: AxiosRequestConfig,
    retryCount = 0
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.client.request<T>(config);
    } catch (error) {
      if (retryCount < (this.config.retryAttempts || 0) && this.shouldRetry(error)) {
        const delay = this.calculateRetryDelay(retryCount);
        
        logger.warn(`API请求失败，${delay}ms后重试 (${retryCount + 1}/${this.config.retryAttempts})`, {
          url: config.url,
          error: error instanceof Error ? error.message : String(error)
        });

        await this.sleep(delay);
        return this.makeRequest<T>(config, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: any): boolean {
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
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.config.retryDelay || 1000;
    return baseDelay * Math.pow(2, retryCount);
  }

  /**
   * 休眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET请求
   */
  protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.makeRequest<T>({
      method: 'GET',
      url,
      ...config
    });
    return response.data;
  }

  /**
   * POST请求
   */
  protected async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.makeRequest<T>({
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
  protected async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.makeRequest<T>({
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
  protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.makeRequest<T>({
      method: 'DELETE',
      url,
      ...config
    });
    return response.data;
  }

  /**
   * 获取API调用统计
   */
  public getStats(): ApiCallStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
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
   * 健康检查
   */
  public abstract healthCheck(): Promise<boolean>;

  /**
   * 获取API服务状态
   */
  public getStatus(): {
    isHealthy: boolean;
    stats: ApiCallStats;
    config: Omit<ApiClientConfig, 'auth'>;
  } {
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
