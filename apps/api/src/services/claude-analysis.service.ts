/**
 * Claude AI 内容分析服务
 * Story 2.3: 使用Claude AI分析和总结新闻内容
 */

import { db } from '@tech-news-platform/database';
import { logger } from '../utils/logger';
import { aiServiceManager } from './ai/ai-service-manager';

/**
 * 关键信息接口
 */
export interface KeyInfo {
  companies?: string[];
  technologies?: string[];
  stockCodes?: string[];
  people?: string[];
}

/**
 * 重要性评分接口
 */
export interface ImportanceScore {
  score: number;      // 1-10
  reason: string;
}

/**
 * 情感分析接口
 */
export interface SentimentAnalysis {
  type: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1
  explanation: string;
}

/**
 * 完整分析结果接口
 */
export interface AnalysisResult {
  summary: string;
  keyInfo: KeyInfo;
  importance: ImportanceScore;
  sentiment: SentimentAnalysis;
  categories: string[];
  tokensUsed: number;
  costUsd: number;
}

/**
 * 批量分析结果接口
 */
export interface BatchAnalysisResult {
  contentId: string;
  success: boolean;
  result?: AnalysisResult;
  error?: string;
}

/**
 * Claude分析服务类
 */
export class ClaudeAnalysisService {
  private readonly MAX_CONCURRENT = 3; // 最大并发数
  private readonly SUMMARY_LENGTH = { min: 150, max: 200 };

  /**
   * 分析单条新闻内容
   */
  async analyzeContent(contentId: string): Promise<AnalysisResult> {
    try {
      logger.info('开始分析内容', { contentId });

      // 1. 获取内容
      const content = await db.content.findUnique({
        where: { id: contentId },
        include: { source: true }
      });

      if (!content) {
        throw new Error(`内容不存在: ${contentId}`);
      }

      // 2. 执行各项分析（并行）
      const [summary, keyInfo, importance, sentiment, categories] = await Promise.all([
        this.generateSummary(content.content || content.title),
        this.extractKeyInfo(content.content || content.title),
        this.calculateImportance(content.content || content.title),
        this.analyzeSentiment(content.content || content.title),
        this.categorizeContent(content.content || content.title)
      ]);

      // 3. 计算总Token使用和成本（简化估算）
      const tokensUsed = 1000; // 实际应从AI响应中获取
      const costUsd = tokensUsed * 0.000003; // Claude价格

      // 4. 更新数据库
      await this.saveAnalysisResult(contentId, {
        summary,
        keyInfo,
        importance,
        sentiment,
        categories,
        tokensUsed,
        costUsd
      });

      logger.info('内容分析完成', { contentId, tokensUsed, costUsd });

      return {
        summary,
        keyInfo,
        importance,
        sentiment,
        categories,
        tokensUsed,
        costUsd
      };
    } catch (error) {
      logger.error('内容分析失败', { contentId, error });
      throw error;
    }
  }

  /**
   * 批量分析新闻内容
   */
  async batchAnalyze(contentIds: string[]): Promise<BatchAnalysisResult[]> {
    logger.info('开始批量分析', { total: contentIds.length });

    const results: BatchAnalysisResult[] = [];
    const chunks = this.chunkArray(contentIds, this.MAX_CONCURRENT);

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(async (contentId) => {
          try {
            const result = await this.analyzeContent(contentId);
            return { contentId, success: true, result };
          } catch (error) {
            return {
              contentId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      chunkResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error('批量分析单项失败', { error: result.reason });
        }
      });

      // 添加延迟避免API限流
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.delay(1000);
      }
    }

    logger.info('批量分析完成', {
      total: contentIds.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * 生成摘要
   */
  async generateSummary(content: string): Promise<string> {
    const prompt = `请为以下新闻生成一个150-200字的中文摘要，保留关键信息和重要细节：

${content}

要求：
1. 摘要应该简洁明了，突出重点
2. 保留重要的数据、时间、人物、公司名称
3. 使用专业的新闻语言
4. 字数控制在150-200字之间

请直接返回摘要文本，不要添加额外说明。`;

    try {
      const summary = await aiServiceManager.generateText(prompt, {
        maxTokens: 300,
        temperature: 0.3
      });

      return summary.trim();
    } catch (error) {
      logger.error('摘要生成失败', { error });
      throw new Error('摘要生成失败');
    }
  }

  /**
   * 提取关键信息
   */
  async extractKeyInfo(content: string): Promise<KeyInfo> {
    const prompt = `请从以下新闻中提取关键信息，并以JSON格式返回：

${content}

需要提取的信息：
1. companies: 涉及的公司名称（数组）
2. technologies: 涉及的技术或产品名称（数组）
3. stockCodes: 股票代码（数组，如果有）
4. people: 重要人物（数组）

返回格式（纯JSON，不要markdown代码块）：
{
  "companies": ["公司1", "公司2"],
  "technologies": ["技术1", "技术2"],
  "stockCodes": ["AAPL", "GOOGL"],
  "people": ["人物1", "人物2"]
}`;

    try {
      const response = await aiServiceManager.generateText(prompt, {
        maxTokens: 500,
        temperature: 0.2
      });

      // 清理响应并解析JSON
      const cleanedResponse = this.cleanJsonResponse(response);
      const keyInfo = JSON.parse(cleanedResponse);

      return {
        companies: keyInfo.companies || [],
        technologies: keyInfo.technologies || [],
        stockCodes: keyInfo.stockCodes || [],
        people: keyInfo.people || []
      };
    } catch (error) {
      logger.error('关键信息提取失败', { error });
      return {
        companies: [],
        technologies: [],
        stockCodes: [],
        people: []
      };
    }
  }

  /**
   * 计算重要性评分
   */
  async calculateImportance(content: string): Promise<ImportanceScore> {
    const prompt = `请评估以下新闻的重要性，给出1-10分的评分和理由：

${content}

评分标准：
- 10分: 重大突破或行业变革
- 7-9分: 重要新闻，有显著影响
- 4-6分: 一般新闻，值得关注
- 1-3分: 常规信息，影响有限

返回JSON格式（纯JSON，不要markdown代码块）：
{
  "score": 8,
  "reason": "评分理由说明"
}`;

    try {
      const response = await aiServiceManager.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.3
      });

      const cleanedResponse = this.cleanJsonResponse(response);
      const importance = JSON.parse(cleanedResponse);

      return {
        score: Math.max(1, Math.min(10, importance.score || 5)),
        reason: importance.reason || '无法生成评分理由'
      };
    } catch (error) {
      logger.error('重要性评分失败', { error });
      return {
        score: 5,
        reason: '评分失败，使用默认值'
      };
    }
  }

  /**
   * 情感分析
   */
  async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    const prompt = `请分析以下新闻的情感倾向：

${content}

分类：
- positive: 正面（积极、乐观、利好）
- neutral: 中性（客观、平衡）
- negative: 负面（消极、悲观、利空）

返回JSON格式（纯JSON，不要markdown代码块）：
{
  "type": "positive",
  "confidence": 0.85,
  "explanation": "情感分析解释"
}`;

    try {
      const response = await aiServiceManager.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.2
      });

      const cleanedResponse = this.cleanJsonResponse(response);
      const sentiment = JSON.parse(cleanedResponse);

      return {
        type: sentiment.type || 'neutral',
        confidence: Math.max(0, Math.min(1, sentiment.confidence || 0.5)),
        explanation: sentiment.explanation || '无法生成情感解释'
      };
    } catch (error) {
      logger.error('情感分析失败', { error });
      return {
        type: 'neutral',
        confidence: 0.5,
        explanation: '情感分析失败，使用默认值'
      };
    }
  }

  /**
   * 内容分类
   */
  async categorizeContent(content: string): Promise<string[]> {
    const prompt = `请为以下新闻选择合适的分类标签（可多选）：

${content}

可选标签：
- AI技术
- 机器学习
- 大语言模型
- 计算机视觉
- 自然语言处理
- 芯片硬件
- 软件开发
- 云计算
- 数据科学
- 股票市场
- 公司财报
- 投资并购
- 产品发布
- 技术突破
- 行业动态
- 监管政策

返回JSON格式的标签数组（纯JSON，不要markdown代码块）：
["标签1", "标签2", "标签3"]`;

    try {
      const response = await aiServiceManager.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.2
      });

      const cleanedResponse = this.cleanJsonResponse(response);
      const categories = JSON.parse(cleanedResponse);

      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      logger.error('内容分类失败', { error });
      return [];
    }
  }

  /**
   * 保存分析结果到数据库
   */
  private async saveAnalysisResult(contentId: string, result: AnalysisResult): Promise<void> {
    try {
      // 组装元数据为普通JSON对象，确保类型兼容Prisma InputJsonValue
      const metadataPayload = {
        summary: result.summary,
        key_info: {
          companies: result.keyInfo?.companies || [],
          technologies: result.keyInfo?.technologies || [],
          stockCodes: result.keyInfo?.stockCodes || [],
          people: result.keyInfo?.people || []
        },
        importance: {
          score: result.importance?.score ?? 0,
          reason: result.importance?.reason || ''
        },
        sentiment: {
          type: result.sentiment?.type || 'neutral',
          confidence: result.sentiment?.confidence ?? 0,
          explanation: result.sentiment?.explanation || ''
        },
        categories: Array.isArray(result.categories) ? result.categories : [],
        claude_analysis: {
          analyzed_at: new Date().toISOString(),
          model: 'claude',
          tokens_used: result.tokensUsed,
          cost_usd: result.costUsd
        }
      } as const;

      await db.content.update({
        where: { id: contentId },
        data: {
          // 直接写入 JSON（绕过复杂类型约束）
          metadata: metadataPayload as any
        }
      });

      logger.debug('分析结果已保存', { contentId });
    } catch (error) {
      logger.error('保存分析结果失败', { contentId, error });
      throw error;
    }
  }

  /**
   * 清理JSON响应（移除markdown代码块等）
   */
  private cleanJsonResponse(response: string): string {
    // 移除markdown代码块
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // 移除前后空白
    cleaned = cleaned.trim();
    
    // 尝试提取JSON对象或数组
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
    
    return cleaned;
  }

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取分析统计
   */
  async getAnalysisStats(): Promise<{
    totalAnalyzed: number;
    avgImportance: number;
    sentimentDistribution: Record<string, number>;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    try {
      // 查询最近100条有Claude分析的内容
      // 先取最近的内容，再在内存中过滤有 claude_analysis 的数据
      const recentContents = await db.content.findMany({
        take: 200,
        orderBy: { createdAt: 'desc' }
      });
      const contents = recentContents
        .filter((c: any) => !!(c.metadata as any)?.claude_analysis)
        .slice(0, 100);

      const totalAnalyzed = contents.length;
      
      // 计算平均重要性
      const importanceScores = contents
        .map((c: any) => (c.metadata as any)?.importance?.score)
        .filter((s: any) => typeof s === 'number');
      const avgImportance = importanceScores.length > 0
        ? importanceScores.reduce((a, b) => a + b, 0) / importanceScores.length
        : 0;

      // 情感分布
      const sentimentDistribution: Record<string, number> = {
        positive: 0,
        neutral: 0,
        negative: 0
      };
      contents.forEach((c: any) => {
        const sentiment = (c.metadata as any)?.sentiment?.type;
        if (sentiment && sentimentDistribution[sentiment] !== undefined) {
          sentimentDistribution[sentiment]++;
        }
      });

      // 热门分类（简化版）
      const categoryMap = new Map<string, number>();
      contents.forEach((c: any) => {
        const categories = (c.metadata as any)?.categories || [];
        categories.forEach((cat: string) => {
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });
      });

      const topCategories = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalAnalyzed,
        avgImportance,
        sentimentDistribution,
        topCategories
      };
    } catch (error) {
      logger.error('获取分析统计失败', { error });
      return {
        totalAnalyzed: 0,
        avgImportance: 0,
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        topCategories: []
      };
    }
  }
}

// 导出单例
export const claudeAnalysisService = new ClaudeAnalysisService();

