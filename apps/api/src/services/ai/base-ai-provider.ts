/**
 * AI服务基础接口和类型定义
 */

import { logger } from '../../utils/logger';

export interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  timeout?: number;
}

export interface ContentAnalysis {
  summary: string;
  keyPoints: string[];
  companies: string[];
  technologies: string[];
  stockSymbols: string[];
  importanceScore: number; // 1-10
  sentiment: 'positive' | 'neutral' | 'negative';
  categories: string[];
  confidence: number; // 0-1
}

export interface AIUsageStats {
  provider: string;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed: Date;
}

export interface AIHealthStatus {
  provider: string;
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorMessage?: string;
}

/**
 * AI服务提供商基础接口
 */
export abstract class BaseAIProvider {
  protected config: AIConfig;
  protected name: string;

  constructor(config: AIConfig, name: string) {
    this.config = config;
    this.name = name;
  }

  /**
   * 获取提供商名称
   */
  getName(): string {
    return this.name;
  }

  /**
   * 健康检查
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * 生成文本
   */
  abstract generateText(prompt: string, options?: AIOptions): Promise<string>;

  /**
   * 生成摘要
   */
  abstract generateSummary(content: string, options?: AIOptions): Promise<string>;

  /**
   * 分析内容
   */
  abstract analyzeContent(content: string, options?: AIOptions): Promise<ContentAnalysis>;

  /**
   * 批量处理
   */
  abstract batchProcess(contents: string[], options?: AIOptions): Promise<ContentAnalysis[]>;

  /**
   * 获取使用统计
   */
  abstract getUsageStats(): Promise<AIUsageStats>;

  /**
   * 记录使用情况
   */
  protected async recordUsage(
    operation: string,
    inputTokens: number,
    outputTokens: number,
    responseTime: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      // 导入数据库客户端（在方法内部导入避免循环依赖）
      const { db } = await import('@tech-news-platform/database');
      
      // 计算成本（简化的计算，实际应根据不同模型定价）
      const costPerToken = this.name === 'gemini' ? 0.000001 : 0.000003; // Gemini便宜，Claude贵
      const costUsd = (inputTokens + outputTokens) * costPerToken;
      
      // 确保存在对应的配置ID，如果不存在则创建或跳过
      const configId = `env-${this.name}`;
      const config = await db.aiServiceConfig.findUnique({ where: { id: configId } });
      
      if (!config) {
        // 如果配置不存在，创建一个默认配置
        await db.aiServiceConfig.create({
          data: {
            id: configId,
            name: `${this.name.toUpperCase()} (环境变量)`,
            provider: this.name.toUpperCase() as any,
            apiKey: process.env[`${this.name.toUpperCase()}_API_KEY`] || '',
            model: process.env[`${this.name.toUpperCase()}_MODEL`] || 'default',
            isActive: true
          }
        }).catch(() => {
          // 如果创建失败（可能并发创建），忽略错误
        });
      }
      
      // 写入数据库
      await db.aiUsageLog.create({
        data: {
          configId,
          provider: this.name.toUpperCase() as any,
          operation,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          responseTimeMs: responseTime,
          success,
          errorMessage
        }
      });
      
      logger.info(`AI使用记录已保存`, { 
        provider: this.name, 
        operation, 
        totalTokens: inputTokens + outputTokens,
        costUsd: costUsd.toFixed(6)
      });
    } catch (error) {
      // 记录失败不应该影响主流程
      logger.error(`保存AI使用记录失败`, { error, provider: this.name, operation });
    }
  }
}

/**
 * AI服务配置接口
 */
export interface AIConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  baseURL?: string;
}

/**
 * AI服务提供商类型
 */
export type AIProviderType = 'gemini' | 'claude';

/**
 * AI服务错误类
 */
export class AIError extends Error {
  public readonly provider: string;
  public readonly operation: string;
  public readonly statusCode?: number;

  constructor(
    message: string,
    provider: string,
    operation: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'AIError';
    this.provider = provider;
    this.operation = operation;
    this.statusCode = statusCode;
  }
}

/**
 * AI服务限流错误
 */
export class AIRateLimitError extends AIError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    provider: string,
    operation: string,
    retryAfter?: number
  ) {
    super(message, provider, operation, 429);
    this.name = 'AIRateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * AI服务配置错误
 */
export class AIConfigError extends AIError {
  constructor(message: string, provider: string) {
    super(message, provider, 'config');
    this.name = 'AIConfigError';
  }
}
