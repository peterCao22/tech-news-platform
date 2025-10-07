// 科技新闻聚合平台 - API配置管理服务
// 处理API配置的CRUD操作和连接测试

import { ApiService } from '../lib/api';

export interface ApiConfiguration {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  authType: 'API_KEY' | 'BEARER_TOKEN' | 'OAUTH' | 'BASIC_AUTH' | 'NONE';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'RATE_LIMITED';
  // 敏感字段在前端不显示原始值
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  headerName?: string;
  // 配置字段
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  // 统计字段
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
  // 认证字段
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  headerName?: string;
  // 配置字段
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

class ApiConfigService {
  private readonly baseUrl = '/api/api-configs';

  /**
   * 获取API配置列表
   */
  async getApiConfigs(): Promise<ApiConfiguration[]> {
    const response = await ApiService.get<{configs: ApiConfiguration[], pagination: any}>(this.baseUrl);
    return response.data?.configs || [];
  }

  /**
   * 获取单个API配置
   */
  async getApiConfig(id: string): Promise<ApiConfiguration> {
    const response = await ApiService.get<ApiConfiguration>(`${this.baseUrl}/${id}`);
    return response.data!;
  }

  /**
   * 创建API配置
   */
  async createApiConfig(data: CreateApiConfigData): Promise<ApiConfiguration> {
    const response = await ApiService.post<ApiConfiguration>(this.baseUrl, data);
    return response.data!;
  }

  /**
   * 更新API配置
   */
  async updateApiConfig(id: string, data: UpdateApiConfigData): Promise<ApiConfiguration> {
    const response = await ApiService.put<ApiConfiguration>(`${this.baseUrl}/${id}`, data);
    return response.data!;
  }

  /**
   * 删除API配置
   */
  async deleteApiConfig(id: string): Promise<void> {
    await ApiService.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * 测试API配置连接
   */
  async testApiConfig(id: string): Promise<ApiConfigTestResult> {
    const response = await ApiService.post<ApiConfigTestResult>(`${this.baseUrl}/${id}/test`, {});
    return response.data!;
  }

  /**
   * 获取API配置统计信息
   */
  async getApiConfigStats(): Promise<ApiConfigStats> {
    const response = await ApiService.get<ApiConfigStats>(`${this.baseUrl}/stats`);
    return response.data!;
  }
}

export const apiConfigService = new ApiConfigService();
