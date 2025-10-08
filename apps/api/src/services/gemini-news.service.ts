import { aiServiceManager } from './ai/ai-service-manager';
import { ContentItemRepository, db } from '@tech-news-platform/database';
import { logger } from '../utils/logger';

/**
 * 新闻查询类型
 */
export type NewsQueryType = 'tech_news' | 'ai_news' | 'stock_news';

/**
 * 新闻数据模型
 */
export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: Date;
  url: string;
  category: string;
  importance: number;
  tags: string[];
  content?: string;
  imageUrl?: string;
}

/**
 * 新闻获取结果
 */
export interface NewsFetchResult {
  success: boolean;
  totalFetched: number;
  totalSaved: number;
  errors: string[];
  newsItems: NewsItem[];
  queryTime: Date;
  queryType: NewsQueryType;
}

/**
 * 查询记录
 */
export interface QueryRecord {
  id: string;
  queryType: NewsQueryType;
  queryTime: Date;
  resultCount: number;
  success: boolean;
  errorMessage?: string;
  duration: number;
}

/**
 * Gemini查询提示词模板
 */
const GEMINI_QUERY_PROMPTS = {
  tech_news: `
请搜索今天最新的科技新闻，重点关注：
1. 人工智能和机器学习发展
2. 新技术发布和产品更新
3. 科技公司动态和投资消息
4. 科技创新和研发成果

请以JSON格式返回结果，包含以下字段：
- title: 新闻标题
- summary: 新闻摘要（150-200字）
- source: 新闻来源
- publishedAt: 发布时间
- url: 原文链接
- category: 新闻分类
- importance: 重要性评分（1-10）
- tags: 相关标签数组

请返回5-10条最新的科技新闻。
`,

  ai_news: `
请搜索今天最新的AI相关新闻，重点关注：
1. 大语言模型和AI技术突破
2. AI产品发布和更新
3. AI公司融资和合作消息
4. AI政策和监管动态

请以JSON格式返回结果，包含以下字段：
- title: 新闻标题
- summary: 新闻摘要（150-200字）
- source: 新闻来源
- publishedAt: 发布时间
- url: 原文链接
- category: 新闻分类
- importance: 重要性评分（1-10）
- tags: 相关标签数组

请返回5-10条最新的AI相关新闻。
`,

  stock_news: `
请搜索今天最新的股票和投资相关新闻，重点关注：
1. 科技股表现和财报消息
2. 投资和融资动态
3. 市场分析和预测
4. 经济政策影响

请以JSON格式返回结果，包含以下字段：
- title: 新闻标题
- summary: 新闻摘要（150-200字）
- source: 新闻来源
- publishedAt: 发布时间
- url: 原文链接
- category: 新闻分类
- importance: 重要性评分（1-10）
- tags: 相关标签数组

请返回5-10条最新的股票相关新闻。
`
};

/**
 * Gemini新闻获取服务
 */
export class GeminiNewsService {
  private contentItemRepository: ContentItemRepository;
  private queryHistory: Map<string, QueryRecord> = new Map();

  constructor() {
    this.contentItemRepository = new ContentItemRepository(db);
  }

  /**
   * 获取每日新闻
   */
  async fetchDailyNews(queryType: NewsQueryType): Promise<NewsFetchResult> {
    const startTime = Date.now();
    const queryTime = new Date();
    
    try {
      logger.info(`开始获取Gemini ${queryType} 新闻`, { queryType, queryTime });

      // 检查是否已经查询过（避免重复查询）
      const lastQuery = this.getLastQuery(queryType);
      if (lastQuery && this.isRecentQuery(lastQuery, 1)) { // 1小时内不重复查询
        logger.info(`跳过重复查询: ${queryType}`, { lastQuery: lastQuery.queryTime });
        return {
          success: true,
          totalFetched: 0,
          totalSaved: 0,
          errors: ['跳过重复查询'],
          newsItems: [],
          queryTime,
          queryType
        };
      }

      // 获取新闻数据
      const newsItems = await this.fetchNewsByType(queryType);
      
      // 保存新闻到数据库
      const savedCount = await this.saveNewsItems(newsItems, queryType);
      
      const duration = Date.now() - startTime;
      
      // 记录查询历史
      this.recordQuery({
        id: `${queryType}_${queryTime.getTime()}`,
        queryType,
        queryTime,
        resultCount: newsItems.length,
        success: true,
        duration
      });

      logger.info(`Gemini ${queryType} 新闻获取完成`, {
        totalFetched: newsItems.length,
        totalSaved: savedCount,
        duration: `${duration}ms`
      });

      return {
        success: true,
        totalFetched: newsItems.length,
        totalSaved: savedCount,
        errors: [],
        newsItems,
        queryTime,
        queryType
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 记录失败的查询
      this.recordQuery({
        id: `${queryType}_${queryTime.getTime()}`,
        queryType,
        queryTime,
        resultCount: 0,
        success: false,
        errorMessage,
        duration
      });

      logger.error(`Gemini ${queryType} 新闻获取失败`, { error: errorMessage, duration: `${duration}ms` });

      return {
        success: false,
        totalFetched: 0,
        totalSaved: 0,
        errors: [errorMessage],
        newsItems: [],
        queryTime,
        queryType
      };
    }
  }

  /**
   * 获取科技新闻
   */
  async fetchTechNews(): Promise<NewsItem[]> {
    return this.fetchNewsByType('tech_news');
  }

  /**
   * 获取AI新闻
   */
  async fetchAINews(): Promise<NewsItem[]> {
    return this.fetchNewsByType('ai_news');
  }

  /**
   * 获取股票新闻
   */
  async fetchStockNews(): Promise<NewsItem[]> {
    return this.fetchNewsByType('stock_news');
  }

  /**
   * 根据类型获取新闻
   */
  private async fetchNewsByType(queryType: NewsQueryType): Promise<NewsItem[]> {
    try {
      const prompt = GEMINI_QUERY_PROMPTS[queryType];
      
      // 使用AI服务生成新闻
      const response = await aiServiceManager.generateText(prompt, {
        maxTokens: 2000,
        temperature: 0.3
      });

      // 解析响应
      const newsItems = this.parseNewsResponse(response, queryType);
      
      logger.info(`成功解析 ${queryType} 新闻`, { count: newsItems.length });
      return newsItems;
    } catch (error) {
      logger.error(`获取 ${queryType} 新闻失败`, { error });
      throw error;
    }
  }

  /**
   * 解析新闻响应
   */
  private parseNewsResponse(response: string, queryType: NewsQueryType): NewsItem[] {
    try {
      // 尝试解析JSON响应
      const data = JSON.parse(response);
      
      if (Array.isArray(data)) {
        return data.map(item => this.normalizeNewsItem(item, queryType));
      } else if (data.news && Array.isArray(data.news)) {
        return data.news.map((item: any) => this.normalizeNewsItem(item, queryType));
      } else {
        logger.warn('Gemini响应格式不符合预期', { response });
        return [];
      }
    } catch (error) {
      logger.error('解析Gemini新闻响应失败', { error, response });
      
      // 尝试从文本中提取新闻信息
      return this.extractNewsFromText(response, queryType);
    }
  }

  /**
   * 从文本中提取新闻信息
   */
  private extractNewsFromText(text: string, queryType: NewsQueryType): NewsItem[] {
    // 简单的文本解析逻辑
    const lines = text.split('\n').filter(line => line.trim());
    const newsItems: NewsItem[] = [];
    
    for (const line of lines) {
      if (line.length > 50 && line.includes(':')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const title = parts[0].trim();
          const summary = parts.slice(1).join(':').trim();
          
          if (title.length > 10 && summary.length > 20) {
            newsItems.push({
              title,
              summary: summary.substring(0, 200),
              source: 'Gemini AI',
              publishedAt: new Date(),
              url: '',
              category: queryType,
              importance: 5,
              tags: [queryType]
            });
          }
        }
      }
    }
    
    return newsItems.slice(0, 10); // 最多返回10条
  }

  /**
   * 标准化新闻项目
   */
  private normalizeNewsItem(item: any, queryType: NewsQueryType): NewsItem {
    return {
      title: item.title || '无标题',
      summary: item.summary || item.description || '',
      source: item.source || 'Gemini AI',
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
      url: item.url || '',
      category: item.category || queryType,
      importance: Math.max(1, Math.min(10, item.importance || 5)),
      tags: Array.isArray(item.tags) ? item.tags : [queryType],
      content: item.content || '',
      imageUrl: item.imageUrl || item.image_url || ''
    };
  }

  /**
   * 保存新闻项目到数据库
   */
  private async saveNewsItems(newsItems: NewsItem[], queryType: NewsQueryType): Promise<number> {
    let savedCount = 0;
    
    for (const newsItem of newsItems) {
      try {
        // 检查是否已存在相同标题的新闻
        const existingContent = await this.contentItemRepository.findMany({
          search: newsItem.title,
          dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
        });

        if (existingContent.content.length > 0) {
          logger.debug('跳过重复新闻', { title: newsItem.title });
          continue;
        }

        // 创建内容项目
        const contentData = {
          title: newsItem.title,
          description: newsItem.summary,
          content: newsItem.content || newsItem.summary,
          url: newsItem.url,
          imageUrl: newsItem.imageUrl,
          category: newsItem.category,
          tags: newsItem.tags,
          status: 'RAW' as const,
          score: newsItem.importance,
          priority: newsItem.importance,
          sourceId: 'gemini-ai', // 需要创建Gemini AI源
          type: 'NEWS' as const,
          publishedAt: newsItem.publishedAt,
          metadata: {
            query_type: queryType,
            source: newsItem.source,
            importance: newsItem.importance,
            gemini_generated: true
          }
        };

        await this.contentItemRepository.create(contentData);
        savedCount++;
        
        logger.debug('保存Gemini新闻成功', { title: newsItem.title });
      } catch (error) {
        logger.error('保存Gemini新闻失败', { 
          title: newsItem.title, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return savedCount;
  }

  /**
   * 获取查询历史
   */
  getQueryHistory(queryType?: NewsQueryType): QueryRecord[] {
    const history = Array.from(this.queryHistory.values());
    
    if (queryType) {
      return history.filter(record => record.queryType === queryType);
    }
    
    return history.sort((a, b) => b.queryTime.getTime() - a.queryTime.getTime());
  }

  /**
   * 获取最后一次查询
   */
  private getLastQuery(queryType: NewsQueryType): QueryRecord | null {
    const history = this.getQueryHistory(queryType);
    return history.length > 0 ? history[0] : null;
  }

  /**
   * 检查是否为最近查询
   */
  private isRecentQuery(query: QueryRecord, hours: number): boolean {
    const now = new Date();
    const queryTime = new Date(query.queryTime);
    const diffHours = (now.getTime() - queryTime.getTime()) / (1000 * 60 * 60);
    return diffHours < hours;
  }

  /**
   * 记录查询
   */
  private recordQuery(record: QueryRecord): void {
    this.queryHistory.set(record.id, record);
    
    // 保持历史记录在合理范围内
    if (this.queryHistory.size > 100) {
      const oldestKey = Array.from(this.queryHistory.keys())[0];
      this.queryHistory.delete(oldestKey);
    }
  }

  /**
   * 获取查询统计
   */
  getQueryStats(): {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageResponseTime: number;
    queriesByType: Record<NewsQueryType, number>;
  } {
    const history = Array.from(this.queryHistory.values());
    
    const totalQueries = history.length;
    const successfulQueries = history.filter(q => q.success).length;
    const failedQueries = totalQueries - successfulQueries;
    const averageResponseTime = history.reduce((sum, q) => sum + q.duration, 0) / totalQueries || 0;
    
    const queriesByType = {
      tech_news: history.filter(q => q.queryType === 'tech_news').length,
      ai_news: history.filter(q => q.queryType === 'ai_news').length,
      stock_news: history.filter(q => q.queryType === 'stock_news').length
    };
    
    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      averageResponseTime,
      queriesByType
    };
  }
}

// 创建全局实例
export const geminiNewsService = new GeminiNewsService();
