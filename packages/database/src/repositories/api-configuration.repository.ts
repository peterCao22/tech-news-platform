// 科技新闻聚合平台 - API配置仓库
// 管理API配置的CRUD操作和统计信息

import { prisma } from '../client';
import { 
  ApiConfiguration, 
  ApiCallLog, 
  ApiConfigStatus, 
  ApiAuthType,
  Prisma 
} from '../generated';
// import { console } from '../utils/console'; // 暂时注释掉，使用console.log
import * as crypto from 'crypto';

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
 * 加密密钥（在生产环境中应该从环境变量获取）
 */
const ENCRYPTION_KEY = process.env.API_CONFIG_ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * 加密敏感数据
 */
function encrypt(text: string): string {
  if (!text) return text;
  
  try {
    // 使用更现代的加密方法
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 将 IV 和加密数据组合
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('加密失败', error);
    return text; // 如果加密失败，返回原文（不推荐在生产环境）
  }
}

/**
 * 解密敏感数据
 */
function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  try {
    // 检查是否是新的加密格式（包含 IV）
    if (encryptedText.includes(':')) {
      const [ivHex, encrypted] = encryptedText.split(':');
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } else {
      // 兼容旧的加密格式
      const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
  } catch (error) {
    console.error('解密失败', error);
    return encryptedText; // 如果解密失败，返回原文
  }
}

/**
 * API配置仓库类
 */
export class ApiConfigurationRepository {
  /**
   * 创建API配置
   */
  static async create(data: CreateApiConfigData): Promise<ApiConfiguration> {
    try {
      // 加密敏感数据
      const encryptedData: any = {
        ...data,
        apiKey: data.apiKey ? encrypt(data.apiKey) : undefined,
        token: data.token ? encrypt(data.token) : undefined,
        password: data.password ? encrypt(data.password) : undefined,
        rateLimit: data.rateLimit || undefined,
        headers: data.headers || undefined,
      };

      const config = await prisma.apiConfiguration.create({
        data: encryptedData,
      });

      console.log('API配置创建成功', { 
        id: config.id, 
        name: config.name, 
        provider: config.provider 
      });

      return config;
    } catch (error) {
      console.error('创建API配置失败', error, { data: { ...data, apiKey: '***', token: '***', password: '***' } });
      throw error;
    }
  }

  /**
   * 根据ID获取API配置
   */
  static async findById(id: string): Promise<ApiConfiguration | null> {
    try {
      const config = await prisma.apiConfiguration.findUnique({
        where: { id },
      });

      if (config) {
        // 解密敏感数据
        return {
          ...config,
          apiKey: config.apiKey ? decrypt(config.apiKey) : null,
          token: config.token ? decrypt(config.token) : null,
          password: config.password ? decrypt(config.password) : null,
        };
      }

      return null;
    } catch (error) {
      console.error('获取API配置失败', error, { id });
      throw error;
    }
  }

  /**
   * 根据提供商获取API配置
   */
  static async findByProvider(provider: string): Promise<ApiConfiguration[]> {
    try {
      const configs = await prisma.apiConfiguration.findMany({
        where: { provider },
        orderBy: { createdAt: 'desc' },
      });

      // 解密敏感数据
      return configs.map((config: any) => ({
        ...config,
        apiKey: config.apiKey ? decrypt(config.apiKey) : null,
        token: config.token ? decrypt(config.token) : null,
        password: config.password ? decrypt(config.password) : null,
      }));
    } catch (error) {
      console.error('根据提供商获取API配置失败', error, { provider });
      throw error;
    }
  }

  /**
   * 获取活跃的API配置
   */
  static async findActive(): Promise<ApiConfiguration[]> {
    try {
      const configs = await prisma.apiConfiguration.findMany({
        where: { status: ApiConfigStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
      });

      // 解密敏感数据
      return configs.map((config: any) => ({
        ...config,
        apiKey: config.apiKey ? decrypt(config.apiKey) : null,
        token: config.token ? decrypt(config.token) : null,
        password: config.password ? decrypt(config.password) : null,
      }));
    } catch (error) {
      console.error('获取活跃API配置失败', error);
      throw error;
    }
  }

  /**
   * 获取所有API配置
   */
  static async findMany(options?: {
    skip?: number;
    take?: number;
    status?: ApiConfigStatus;
    provider?: string;
  }): Promise<{ configs: ApiConfiguration[]; total: number }> {
    try {
      const where: Prisma.ApiConfigurationWhereInput = {};
      
      if (options?.status) {
        where.status = options.status;
      }
      
      if (options?.provider) {
        where.provider = options.provider;
      }

      const [configs, total] = await Promise.all([
        prisma.apiConfiguration.findMany({
          where,
          skip: options?.skip,
          take: options?.take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.apiConfiguration.count({ where }),
      ]);

      // 解密敏感数据（但不包含在列表视图中）
      const decryptedConfigs = configs.map((config: any) => ({
        ...config,
        apiKey: config.apiKey ? '***' : null, // 列表中不显示完整密钥
        token: config.token ? '***' : null,
        password: config.password ? '***' : null,
      }));

      return { configs: decryptedConfigs, total };
    } catch (error) {
      console.error('获取API配置列表失败', error, { options });
      throw error;
    }
  }

  /**
   * 更新API配置
   */
  static async update(id: string, data: UpdateApiConfigData): Promise<ApiConfiguration> {
    try {
      // 加密敏感数据
      const encryptedData: any = {
        ...data,
        apiKey: data.apiKey ? encrypt(data.apiKey) : undefined,
        token: data.token ? encrypt(data.token) : undefined,
        password: data.password ? encrypt(data.password) : undefined,
        rateLimit: data.rateLimit || undefined,
        headers: data.headers || undefined,
      };

      const config = await prisma.apiConfiguration.update({
        where: { id },
        data: encryptedData,
      });

      console.log('API配置更新成功', { 
        id: config.id, 
        name: config.name, 
        provider: config.provider 
      });

      // 解密敏感数据返回
      return {
        ...config,
        apiKey: config.apiKey ? decrypt(config.apiKey) : null,
        token: config.token ? decrypt(config.token) : null,
        password: config.password ? decrypt(config.password) : null,
      };
    } catch (error) {
      console.error('更新API配置失败', error, { id, data: { ...data, apiKey: '***', token: '***', password: '***' } });
      throw error;
    }
  }

  /**
   * 删除API配置
   */
  static async delete(id: string): Promise<void> {
    try {
      await prisma.apiConfiguration.delete({
        where: { id },
      });

      console.log('API配置删除成功', { id });
    } catch (error) {
      console.error('删除API配置失败', error, { id });
      throw error;
    }
  }

  /**
   * 更新API调用统计
   */
  static async updateCallStats(
    id: string, 
    success: boolean, 
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: Prisma.ApiConfigurationUpdateInput = {
        totalCalls: { increment: 1 },
        lastCallAt: new Date(),
      };

      if (success) {
        updateData.successfulCalls = { increment: 1 };
      } else {
        updateData.failedCalls = { increment: 1 };
        if (errorMessage) {
          updateData.lastError = errorMessage;
        }
      }

      await prisma.apiConfiguration.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      console.error('更新API调用统计失败', error, { id, success, errorMessage });
      throw error;
    }
  }

  /**
   * 记录API调用日志
   */
  static async logApiCall(data: CreateApiCallLogData): Promise<ApiCallLog> {
    try {
      // 清理敏感数据
      const sanitizedData: any = {
        ...data,
        requestHeaders: data.requestHeaders ? this.sanitizeHeaders(data.requestHeaders) : undefined,
        responseHeaders: data.responseHeaders ? this.sanitizeHeaders(data.responseHeaders) : undefined,
        requestBody: data.requestBody || undefined,
        responseBody: data.responseBody || undefined,
      };

      const log = await prisma.apiCallLog.create({
        data: sanitizedData,
      });

      // 同时更新统计信息
      await this.updateCallStats(data.configId, data.success, data.errorMessage);

      return log;
    } catch (error) {
      console.error('记录API调用日志失败', error, { configId: data.configId });
      throw error;
    }
  }

  /**
   * 获取API调用日志
   */
  static async getCallLogs(
    configId: string,
    options?: {
      skip?: number;
      take?: number;
      success?: boolean;
    }
  ): Promise<{ logs: ApiCallLog[]; total: number }> {
    try {
      const where: Prisma.ApiCallLogWhereInput = { configId };
      
      if (options?.success !== undefined) {
        where.success = options.success;
      }

      const [logs, total] = await Promise.all([
        prisma.apiCallLog.findMany({
          where,
          skip: options?.skip,
          take: options?.take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.apiCallLog.count({ where }),
      ]);

      return { logs, total };
    } catch (error) {
      console.error('获取API调用日志失败', error, { configId, options });
      throw error;
    }
  }

  /**
   * 清理敏感header信息
   */
  private static sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'x-api-key', 'api-key', 'cookie', 'set-cookie'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = '***';
      }
    });
    
    return sanitized;
  }

  /**
   * 获取API配置统计信息
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
  }> {
    try {
      const [
        total,
        active,
        inactive,
        error,
        callStats
      ] = await Promise.all([
        prisma.apiConfiguration.count(),
        prisma.apiConfiguration.count({ where: { status: ApiConfigStatus.ACTIVE } }),
        prisma.apiConfiguration.count({ where: { status: ApiConfigStatus.INACTIVE } }),
        prisma.apiConfiguration.count({ where: { status: ApiConfigStatus.ERROR } }),
        prisma.apiConfiguration.aggregate({
          _sum: {
            totalCalls: true,
            successfulCalls: true,
            failedCalls: true,
          },
        }),
      ]);

      return {
        total,
        active,
        inactive,
        error,
        totalCalls: callStats._sum.totalCalls || 0,
        successfulCalls: callStats._sum.successfulCalls || 0,
        failedCalls: callStats._sum.failedCalls || 0,
      };
    } catch (error) {
      console.error('获取API配置统计失败', error);
      throw error;
    }
  }
}
