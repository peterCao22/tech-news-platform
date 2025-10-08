/**
 * AI服务基础接口和类型定义
 */

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
    // 这里将在具体实现中记录到数据库
    console.log(`AI Usage - Provider: ${this.name}, Operation: ${operation}, Tokens: ${inputTokens + outputTokens}, ResponseTime: ${responseTime}ms, Success: ${success}`);
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
