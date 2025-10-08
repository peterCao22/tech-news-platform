import { BaseAIProvider, AIConfig, AIOptions, ContentAnalysis, AIUsageStats, AIError, AIRateLimitError } from './base-ai-provider';
import { logger } from '../../utils/logger';

/**
 * Claude AI配置接口
 */
export interface ClaudeConfig extends AIConfig {
  version?: string;
}

/**
 * Claude API响应接口
 */
interface ClaudeResponse {
  content: Array<{
    text: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason: string;
}

/**
 * Claude AI服务提供商
 */
export class ClaudeProvider extends BaseAIProvider {
  private config: ClaudeConfig;
  private baseURL: string;

  constructor(config: ClaudeConfig) {
    super(config, 'claude');
    this.config = config;
    this.baseURL = config.baseURL || 'https://api.anthropic.com/v1';
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/messages', 'POST', {
        model: this.config.model,
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Hello'
        }]
      });
      const responseTime = Date.now() - startTime;
      
      await this.recordUsage('health_check', 0, 0, responseTime, true);
      return response && response.content && response.content.length > 0;
    } catch (error) {
      const responseTime = Date.now();
      await this.recordUsage('health_check', 0, 0, responseTime, false, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Claude健康检查失败', { error });
      return false;
    }
  }

  /**
   * 生成文本
   */
  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    try {
      const startTime = Date.now();
      const model = options?.model || this.config.model;
      const maxTokens = options?.maxTokens || this.config.maxTokens || 1000;

      const requestBody = {
        model: model,
        max_tokens: maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      };

      const response = await this.makeRequest('/messages', 'POST', requestBody);
      const responseTime = Date.now() - startTime;

      if (!response.content || response.content.length === 0) {
        throw new AIError('No response from Claude', this.name, 'generateText');
      }

      const text = response.content[0].text;
      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;

      await this.recordUsage('generate_text', inputTokens, outputTokens, responseTime, true);
      return text;
    } catch (error) {
      const responseTime = Date.now();
      await this.recordUsage('generate_text', 0, 0, responseTime, false, error instanceof Error ? error.message : 'Unknown error');
      throw this.handleError(error, 'generateText');
    }
  }

  /**
   * 生成摘要
   */
  async generateSummary(content: string, options?: AIOptions): Promise<string> {
    const prompt = `请为以下内容生成一个简洁的摘要（150-200字）：

${content}

摘要要求：
1. 突出主要内容要点
2. 保持客观中立
3. 使用简洁明了的语言
4. 控制在150-200字之间`;

    return this.generateText(prompt, options);
  }

  /**
   * 分析内容
   */
  async analyzeContent(content: string, options?: AIOptions): Promise<ContentAnalysis> {
    const prompt = `请分析以下新闻内容，并以JSON格式返回分析结果：

${content}

请返回以下格式的JSON：
{
  "summary": "内容摘要（150-200字）",
  "keyPoints": ["关键要点1", "关键要点2", "关键要点3"],
  "companies": ["涉及的公司名称"],
  "technologies": ["涉及的技术名称"],
  "stockSymbols": ["股票代码"],
  "importanceScore": 8,
  "sentiment": "positive|neutral|negative",
  "categories": ["分类标签"],
  "confidence": 0.9
}

分析要求：
1. 重要性评分：1-10分，10分为最重要
2. 情感倾向：positive（正面）、neutral（中性）、negative（负面）
3. 分类标签：如"AI技术"、"股票相关"、"新技术"等
4. 置信度：0-1之间，表示分析的可靠性`;

    try {
      const response = await this.generateText(prompt, options);
      
      // 尝试解析JSON响应
      const analysis = JSON.parse(response);
      
      // 验证返回的数据结构
      if (!analysis.summary || !analysis.keyPoints || !Array.isArray(analysis.keyPoints)) {
        throw new AIError('Invalid analysis response format', this.name, 'analyzeContent');
      }

      return {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        companies: analysis.companies || [],
        technologies: analysis.technologies || [],
        stockSymbols: analysis.stockSymbols || [],
        importanceScore: Math.max(1, Math.min(10, analysis.importanceScore || 5)),
        sentiment: ['positive', 'neutral', 'negative'].includes(analysis.sentiment) ? analysis.sentiment : 'neutral',
        categories: analysis.categories || [],
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.8))
      };
    } catch (error) {
      if (error instanceof AIError) {
        throw error;
      }
      
      // 如果JSON解析失败，返回默认分析结果
      logger.warn('Claude分析结果解析失败，使用默认分析', { error, response: response });
      return {
        summary: await this.generateSummary(content, options),
        keyPoints: [],
        companies: [],
        technologies: [],
        stockSymbols: [],
        importanceScore: 5,
        sentiment: 'neutral',
        categories: [],
        confidence: 0.5
      };
    }
  }

  /**
   * 批量处理
   */
  async batchProcess(contents: string[], options?: AIOptions): Promise<ContentAnalysis[]> {
    const results: ContentAnalysis[] = [];
    
    // 为了避免API限制，批量处理时添加延迟
    for (let i = 0; i < contents.length; i++) {
      try {
        const analysis = await this.analyzeContent(contents[i], options);
        results.push(analysis);
        
        // 添加延迟避免API限制
        if (i < contents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error(`批量处理第${i + 1}个内容失败`, { error, content: contents[i] });
        // 添加默认分析结果
        results.push({
          summary: '分析失败',
          keyPoints: [],
          companies: [],
          technologies: [],
          stockSymbols: [],
          importanceScore: 1,
          sentiment: 'neutral',
          categories: [],
          confidence: 0.1
        });
      }
    }
    
    return results;
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(): Promise<AIUsageStats> {
    // 这里应该从数据库获取统计数据
    // 暂时返回模拟数据
    return {
      provider: this.name,
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      successRate: 0,
      lastUsed: new Date()
    };
  }

  /**
   * 发送API请求
   */
  private async makeRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': this.config.version || '2023-06-01'
      },
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new AIRateLimitError(
          'Claude API rate limit exceeded',
          this.name,
          'api_request',
          retryAfter ? parseInt(retryAfter) : undefined
        );
      }
      
      const errorText = await response.text();
      throw new AIError(
        `Claude API error: ${response.status} ${errorText}`,
        this.name,
        'api_request',
        response.status
      );
    }

    return response.json();
  }

  /**
   * 处理错误
   */
  private handleError(error: any, operation: string): AIError {
    if (error instanceof AIError) {
      return error;
    }

    if (error instanceof AIRateLimitError) {
      return error;
    }

    return new AIError(
      error.message || 'Unknown error',
      this.name,
      operation
    );
  }
}
