import { BaseAIProvider, AIProviderType, AIOptions, ContentAnalysis, AIHealthStatus, AIError, AIRateLimitError } from './base-ai-provider';
import { GeminiProvider, GeminiConfig } from './gemini-provider';
import { ClaudeProvider, ClaudeConfig } from './claude-provider';
import { logger } from '../../utils/logger';

/**
 * AI服务管理器配置
 */
export interface AIServiceManagerConfig {
  defaultProvider: AIProviderType;
  fallbackProvider: AIProviderType;
  maxRetries: number;
  retryDelay: number;
  costLimit: number;
  healthCheckInterval: number;
}

/**
 * AI服务管理器
 */
export class AIServiceManager {
  private providers: Map<AIProviderType, BaseAIProvider> = new Map();
  private currentProvider: AIProviderType;
  private fallbackProvider: AIProviderType;
  private config: AIServiceManagerConfig;
  private healthStatus: Map<AIProviderType, AIHealthStatus> = new Map();
  private isInitialized = false;

  constructor(config: AIServiceManagerConfig) {
    this.config = config;
    this.currentProvider = config.defaultProvider;
    this.fallbackProvider = config.fallbackProvider;
  }

  /**
   * 初始化AI服务管理器
   */
  async initialize(): Promise<void> {
    try {
      logger.info('初始化AI服务管理器');

      // 初始化Gemini提供商
      const geminiConfig: GeminiConfig = {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000'),
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.GEMINI_TIMEOUT || '30000')
      };

      if (geminiConfig.apiKey) {
        const geminiProvider = new GeminiProvider(geminiConfig);
        this.providers.set('gemini', geminiProvider);
        logger.info('Gemini提供商已初始化');
      } else {
        logger.warn('Gemini API密钥未配置');
      }

      // 初始化Claude提供商
      const claudeConfig: ClaudeConfig = {
        apiKey: process.env.CLAUDE_API_KEY || '',
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
        maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '1000'),
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.CLAUDE_TIMEOUT || '30000')
      };

      if (claudeConfig.apiKey) {
        const claudeProvider = new ClaudeProvider(claudeConfig);
        this.providers.set('claude', claudeProvider);
        logger.info('Claude提供商已初始化');
      } else {
        logger.warn('Claude API密钥未配置');
      }

      // 检查当前提供商是否可用
      if (!this.providers.has(this.currentProvider)) {
        logger.warn(`当前提供商 ${this.currentProvider} 不可用，切换到备用提供商 ${this.fallbackProvider}`);
        this.currentProvider = this.fallbackProvider;
      }

      // 启动健康检查
      await this.startHealthCheck();

      this.isInitialized = true;
      logger.info('AI服务管理器初始化完成', {
        currentProvider: this.currentProvider,
        availableProviders: Array.from(this.providers.keys())
      });
    } catch (error) {
      logger.error('AI服务管理器初始化失败', { error });
      throw error;
    }
  }

  /**
   * 获取当前AI提供商
   */
  async getProvider(providerType?: AIProviderType): Promise<BaseAIProvider> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const targetProvider = providerType || this.currentProvider;
    const provider = this.providers.get(targetProvider);

    if (!provider) {
      throw new AIError(
        `AI提供商 ${targetProvider} 不可用`,
        targetProvider,
        'getProvider'
      );
    }

    return provider;
  }

  /**
   * 生成文本
   */
  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    return this.executeWithFallback(
      async (provider) => provider.generateText(prompt, options),
      'generateText'
    );
  }

  /**
   * 生成摘要
   */
  async generateSummary(content: string, options?: AIOptions): Promise<string> {
    return this.executeWithFallback(
      async (provider) => provider.generateSummary(content, options),
      'generateSummary'
    );
  }

  /**
   * 分析内容
   */
  async analyzeContent(content: string, options?: AIOptions): Promise<ContentAnalysis> {
    return this.executeWithFallback(
      async (provider) => provider.analyzeContent(content, options),
      'analyzeContent'
    );
  }

  /**
   * 批量处理
   */
  async batchProcess(contents: string[], options?: AIOptions): Promise<ContentAnalysis[]> {
    return this.executeWithFallback(
      async (provider) => provider.batchProcess(contents, options),
      'batchProcess'
    );
  }

  /**
   * 切换提供商
   */
  async switchProvider(reason: string): Promise<void> {
    const oldProvider = this.currentProvider;
    this.currentProvider = this.fallbackProvider;
    
    logger.warn('AI提供商已切换', {
      from: oldProvider,
      to: this.currentProvider,
      reason
    });

    // 这里可以记录切换事件到数据库
  }

  /**
   * 获取所有提供商状态
   */
  async getAllProviderStatus(): Promise<AIHealthStatus[]> {
    const statuses: AIHealthStatus[] = [];
    
    for (const [providerType, provider] of this.providers) {
      try {
        const startTime = Date.now();
        const isHealthy = await provider.healthCheck();
        const responseTime = Date.now() - startTime;
        
        statuses.push({
          provider: providerType,
          isHealthy,
          lastCheck: new Date(),
          responseTime
        });
      } catch (error) {
        statuses.push({
          provider: providerType,
          isHealthy: false,
          lastCheck: new Date(),
          responseTime: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return statuses;
  }

  /**
   * 获取当前提供商状态
   */
  getCurrentProviderStatus(): AIHealthStatus | null {
    return this.healthStatus.get(this.currentProvider) || null;
  }

  /**
   * 执行操作并支持故障切换
   */
  private async executeWithFallback<T>(
    operation: (provider: BaseAIProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempts = 0;
    const maxAttempts = this.config.maxRetries + 1;

    while (attempts < maxAttempts) {
      try {
        const provider = await this.getProvider();
        const result = await operation(provider);
        
        // 如果成功，重置当前提供商为默认提供商
        if (this.currentProvider !== this.config.defaultProvider) {
          this.currentProvider = this.config.defaultProvider;
          logger.info('AI提供商已重置为默认提供商', { provider: this.currentProvider });
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        attempts++;

        if (error instanceof AIRateLimitError) {
          logger.warn('AI API限流，尝试切换提供商', {
            provider: this.currentProvider,
            retryAfter: error.retryAfter,
            attempt: attempts
          });

          // 如果有限流延迟，等待指定时间
          if (error.retryAfter) {
            await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
          }

          // 切换到备用提供商
          await this.switchProvider(`Rate limit exceeded: ${error.message}`);
        } else if (error instanceof AIError) {
          logger.error('AI操作失败', {
            provider: this.currentProvider,
            operation: operationName,
            error: error.message,
            attempt: attempts
          });

          // 如果是最后一次尝试，抛出错误
          if (attempts >= maxAttempts) {
            break;
          }

          // 切换到备用提供商
          await this.switchProvider(`Operation failed: ${error.message}`);
        } else {
          // 其他类型的错误，直接抛出
          throw error;
        }

        // 添加重试延迟
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempts));
        }
      }
    }

    throw lastError || new AIError(
      `所有AI提供商都失败了，操作: ${operationName}`,
      'all',
      operationName
    );
  }

  /**
   * 启动健康检查
   */
  private async startHealthCheck(): Promise<void> {
    // 立即执行一次健康检查
    await this.performHealthCheck();

    // 设置定期健康检查
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    for (const [providerType, provider] of this.providers) {
      try {
        const startTime = Date.now();
        const isHealthy = await provider.healthCheck();
        const responseTime = Date.now() - startTime;
        
        this.healthStatus.set(providerType, {
          provider: providerType,
          isHealthy,
          lastCheck: new Date(),
          responseTime
        });

        if (!isHealthy && this.currentProvider === providerType) {
          logger.warn('当前AI提供商不健康，准备切换', { provider: providerType });
          await this.switchProvider('Provider health check failed');
        }
      } catch (error) {
        this.healthStatus.set(providerType, {
          provider: providerType,
          isHealthy: false,
          lastCheck: new Date(),
          responseTime: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });

        if (this.currentProvider === providerType) {
          logger.error('当前AI提供商健康检查失败', { provider: providerType, error });
          await this.switchProvider('Provider health check error');
        }
      }
    }
  }
}

// 创建全局AI服务管理器实例
export const aiServiceManager = new AIServiceManager({
  defaultProvider: (process.env.AI_DEFAULT_PROVIDER as AIProviderType) || 'gemini',
  fallbackProvider: (process.env.AI_FALLBACK_PROVIDER as AIProviderType) || 'claude',
  maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.AI_RETRY_DELAY_MS || '1000'),
  costLimit: parseFloat(process.env.AI_COST_LIMIT_USD || '100.00'),
  healthCheckInterval: parseInt(process.env.AI_HEALTH_CHECK_INTERVAL_MS || '300000') // 5分钟
});
