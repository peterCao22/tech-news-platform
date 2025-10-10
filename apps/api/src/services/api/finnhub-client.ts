// 科技新闻聚合平台 - Finnhub API客户端
// 集成Finnhub API获取金融新闻和市场数据

import { BaseApiClient, ApiClientConfig, AuthType } from './base-api-client';
import { logger } from '../../utils/logger';

/**
 * Finnhub新闻数据接口
 */
export interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

/**
 * Finnhub新闻响应接口
 */
export interface FinnhubNewsResponse {
  category: string;
  data: FinnhubNewsItem[];
}

/**
 * 标准化新闻数据接口
 */
export interface StandardizedNewsItem {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  source: string;
  category: string;
  tags: string[];
  metadata: {
    sentiment: {
      score: number;
      label: string;
    };
    relevance: number;
    source: string;
  };
}

/**
 * Finnhub API客户端
 */
export class FinnhubClient extends BaseApiClient {
  constructor(apiKey: string) {
    const config: ApiClientConfig = {
      baseURL: 'https://finnhub.io/api/v1',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        maxRequests: 60, // Finnhub免费版限制
        windowMs: 60000 // 每分钟60次
      },
      auth: {
        type: AuthType.API_KEY,
        apiKey,
        headerName: 'X-Finnhub-Token' // Finnhub使用header认证
      }
    };

    super(config);
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // 使用公司概览来检查API是否可用
      const response = await this.get('/stock/profile2', {
        params: {
          symbol: 'AAPL'
        }
      });

      return response && !response.error;
    } catch (error) {
      logger.error('Finnhub健康检查失败', { error });
      return false;
    }
  }

  /**
   * 获取公司新闻
   * @param symbol 股票代码（必需）
   * @param from 开始日期 YYYY-MM-DD（必需）
   * @param to 结束日期 YYYY-MM-DD（必需）
   */
  public async getCompanyNews(
    symbol: string,
    from: string,
    to: string
  ): Promise<FinnhubNewsItem[]> {
    try {
      const params: any = {
        symbol,
        from,
        to
      };

      const response = await this.get('/company-news', { params });
      // Finnhub company-news 直接返回数组，不是包装在对象中
      return Array.isArray(response) ? response : [];
    } catch (error) {
      logger.error('获取Finnhub公司新闻失败', { error, symbol, from, to });
      throw error;
    }
  }

  /**
   * 获取市场新闻
   * @param category 新闻类别（必需），如 'general', 'forex', 'crypto', 'merger'
   */
  public async getMarketNews(category: string = 'general'): Promise<FinnhubNewsItem[]> {
    try {
      const params: any = {
        category
      };

      const response = await this.get('/news', { params });
      // Finnhub /news 直接返回数组
      return Array.isArray(response) ? response : [];
    } catch (error) {
      logger.error('获取Finnhub市场新闻失败', { error, category });
      throw error;
    }
  }

  /**
   * 获取科技新闻（实际上Finnhub没有单独的technology分类，使用general并过滤）
   */
  public async getTechNews(): Promise<FinnhubNewsItem[]> {
    try {
      const news = await this.getMarketNews('general');
      // 过滤科技相关新闻
      return news.filter(item => 
        item.headline.toLowerCase().includes('tech') ||
        item.summary.toLowerCase().includes('tech') ||
        item.category.toLowerCase() === 'technology'
      );
    } catch (error) {
      logger.error('获取Finnhub科技新闻失败', { error });
      throw error;
    }
  }

  /**
   * 获取AI相关新闻
   */
  public async getAINews(): Promise<FinnhubNewsItem[]> {
    try {
      const news = await this.getMarketNews('general');
      // 过滤AI相关新闻
      return news.filter(item => 
        item.headline.toLowerCase().includes('ai') ||
        item.headline.toLowerCase().includes('artificial intelligence') ||
        item.headline.toLowerCase().includes('machine learning') ||
        item.summary.toLowerCase().includes('ai') ||
        item.summary.toLowerCase().includes('artificial intelligence')
      );
    } catch (error) {
      logger.error('获取Finnhub AI新闻失败', { error });
      throw error;
    }
  }

  /**
   * 搜索公司新闻
   * @param symbol 股票代码
   * @param from 开始日期 YYYY-MM-DD（默认7天前）
   * @param to 结束日期 YYYY-MM-DD（默认今天）
   */
  public async searchCompanyNews(
    symbol: string, 
    from?: string, 
    to?: string
  ): Promise<FinnhubNewsItem[]> {
    try {
      // 如果没有提供日期，默认查询最近7天
      const toDate = to || new Date().toISOString().split('T')[0];
      const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      return await this.getCompanyNews(symbol, fromDate, toDate);
    } catch (error) {
      logger.error('搜索Finnhub公司新闻失败', { error, symbol });
      throw error;
    }
  }

  /**
   * 标准化新闻数据
   */
  public standardizeNewsData(finnhubNews: FinnhubNewsItem[]): StandardizedNewsItem[] {
    return finnhubNews.map(item => {
      // 转换时间戳为日期
      const publishedAt = new Date(item.datetime * 1000);

      // 提取标签
      const tags: string[] = [];
      
      // 添加类别标签
      if (item.category) {
        tags.push(item.category.toLowerCase());
      }

      // 添加相关股票标签
      if (item.related) {
        tags.push(`stock:${item.related}`);
      }

      // 添加来源标签
      if (item.source) {
        tags.push(`source:${item.source.toLowerCase()}`);
      }

      // 添加科技相关标签
      if (item.headline.toLowerCase().includes('tech') || 
          item.headline.toLowerCase().includes('technology')) {
        tags.push('technology');
      }

      if (item.headline.toLowerCase().includes('ai') ||
          item.headline.toLowerCase().includes('artificial intelligence')) {
        tags.push('artificial-intelligence');
      }

      // 简单的情感分析（基于关键词）
      let sentimentScore = 0;
      const positiveWords = ['growth', 'profit', 'success', 'gain', 'rise', 'up', 'positive'];
      const negativeWords = ['loss', 'decline', 'fall', 'down', 'negative', 'crisis', 'drop'];
      
      const text = (item.headline + ' ' + item.summary).toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) sentimentScore += 0.1;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) sentimentScore -= 0.1;
      });

      // 限制分数范围
      sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

      return {
        title: item.headline,
        description: item.summary,
        url: item.url,
        imageUrl: item.image,
        publishedAt,
        source: item.source,
        category: item.category,
        tags,
        metadata: {
          sentiment: {
            score: sentimentScore,
            label: sentimentScore > 0.2 ? 'Positive' : sentimentScore < -0.2 ? 'Negative' : 'Neutral'
          },
          relevance: 0.8, // 默认相关性
          source: 'finnhub'
        }
      };
    });
  }

  /**
   * 获取标准化的科技新闻
   */
  public async getStandardizedTechNews(limit: number = 50): Promise<StandardizedNewsItem[]> {
    try {
      const techNews = await this.getTechNews();
      const limitedNews = techNews.slice(0, limit);
      return this.standardizeNewsData(limitedNews);
    } catch (error) {
      logger.error('获取标准化Finnhub科技新闻失败', { error });
      throw error;
    }
  }

  /**
   * 获取标准化的AI新闻
   */
  public async getStandardizedAINews(limit: number = 30): Promise<StandardizedNewsItem[]> {
    try {
      const aiNews = await this.getAINews();
      const limitedNews = aiNews.slice(0, limit);
      return this.standardizeNewsData(limitedNews);
    } catch (error) {
      logger.error('获取标准化Finnhub AI新闻失败', { error });
      throw error;
    }
  }
}
