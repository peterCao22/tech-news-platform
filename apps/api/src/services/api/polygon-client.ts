// 科技新闻聚合平台 - Polygon API客户端
// 集成Polygon API获取股票新闻和市场数据

import { BaseApiClient, ApiClientConfig, AuthType } from './base-api-client';
import { logger } from '../../utils/logger';

/**
 * Polygon新闻数据接口
 */
export interface PolygonNewsItem {
  id: string;
  publisher: {
    name: string;
    homepage_url: string;
    logo_url: string;
    favicon_url: string;
  };
  title: string;
  author: string;
  published_utc: string;
  article_url: string;
  tickers: string[];
  image_url?: string;
  description?: string;
  keywords?: string[];
  amp_url?: string;
}

/**
 * Polygon新闻响应接口
 */
export interface PolygonNewsResponse {
  status: string;
  request_id: string;
  count: number;
  next_url?: string;
  results: PolygonNewsItem[];
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
 * Polygon API客户端
 */
export class PolygonClient extends BaseApiClient {
  constructor(apiKey: string) {
    const config: ApiClientConfig = {
      baseURL: 'https://api.polygon.io',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        maxRequests: 5, // Polygon免费版限制：每分钟5次请求
        windowMs: 60000 // 每分钟
      },
      auth: {
        type: AuthType.BEARER_TOKEN,
        token: apiKey,
        headerName: 'Authorization' // Polygon使用Authorization header
      }
    };

    super(config);
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // 使用市场状态检查API是否可用
      const response = await this.get('/v1/marketstatus/now');

      // 检查响应是否有效（有 serverTime 字段表示API正常）
      return response && response.serverTime;
    } catch (error) {
      logger.error('Polygon健康检查失败', { error });
      return false;
    }
  }

  /**
   * 获取股票新闻
   */
  public async getStockNews(options?: {
    ticker?: string; // 股票代码
    limit?: number; // 限制数量
    published_utc?: string; // 发布日期
    order?: 'asc' | 'desc'; // 排序
  }): Promise<PolygonNewsResponse> {
    try {
      const params: any = {
        limit: options?.limit || 50
      };

      if (options?.ticker) {
        params.ticker = options.ticker;
      }

      if (options?.published_utc) {
        params.published_utc = options.published_utc;
      }

      if (options?.order) {
        params.order = options.order;
      }

      const response = await this.get('/v2/reference/news', { params });
      return response;
    } catch (error) {
      logger.error('获取Polygon股票新闻失败', { error });
      throw error;
    }
  }

  /**
   * 获取科技股票新闻
   */
  public async getTechNews(limit = 50): Promise<PolygonNewsItem[]> {
    try {
      // 获取科技相关股票新闻
      const techTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'ADBE', 'CRM'];
      const allNews: PolygonNewsItem[] = [];

      // 由于API限制，我们获取一般新闻然后过滤科技相关内容
      const response = await this.getStockNews({ limit: Math.min(limit * 2, 100) });
      
      if (response.results) {
        // 过滤科技相关新闻
        const techNews = response.results.filter(news => {
          const title = news.title.toLowerCase();
          const description = news.description?.toLowerCase() || '';
          const tickers = news.tickers || [];
          
          // 检查是否包含科技关键词
          const techKeywords = [
            'technology', 'tech', 'ai', 'artificial intelligence', 'software', 'hardware',
            'computer', 'digital', 'internet', 'mobile', 'app', 'cloud', 'data',
            'cyber', 'security', 'blockchain', 'crypto', 'startup', 'innovation'
          ];
          
          const hasTechKeywords = techKeywords.some(keyword => 
            title.includes(keyword) || description.includes(keyword)
          );
          
          // 检查是否包含科技股票代码
          const hasTechTicker = tickers.some(ticker => 
            techTickers.includes(ticker.toUpperCase())
          );
          
          return hasTechKeywords || hasTechTicker;
        });

        allNews.push(...techNews.slice(0, limit));
      }

      return allNews;
    } catch (error) {
      logger.error('获取Polygon科技新闻失败', { error });
      throw error;
    }
  }

  /**
   * 获取AI相关新闻
   */
  public async getAINews(limit = 30): Promise<PolygonNewsItem[]> {
    try {
      const response = await this.getStockNews({ limit: Math.min(limit * 3, 100) });
      
      if (response.results) {
        // 过滤AI相关新闻
        const aiNews = response.results.filter(news => {
          const title = news.title.toLowerCase();
          const description = news.description?.toLowerCase() || '';
          
          const aiKeywords = [
            'ai', 'artificial intelligence', 'machine learning', 'deep learning',
            'neural network', 'chatgpt', 'openai', 'automation', 'robotics',
            'algorithm', 'data science', 'nlp', 'computer vision'
          ];
          
          return aiKeywords.some(keyword => 
            title.includes(keyword) || description.includes(keyword)
          );
        });

        return aiNews.slice(0, limit);
      }

      return [];
    } catch (error) {
      logger.error('获取Polygon AI新闻失败', { error });
      throw error;
    }
  }

  /**
   * 搜索特定公司新闻
   */
  public async searchCompanyNews(symbol: string, limit = 20): Promise<PolygonNewsItem[]> {
    try {
      const response = await this.getStockNews({
        ticker: symbol,
        limit
      });
      
      return response.results || [];
    } catch (error) {
      logger.error('搜索Polygon公司新闻失败', { error, symbol });
      throw error;
    }
  }

  /**
   * 标准化新闻数据
   */
  public standardizeNewsData(polygonNews: PolygonNewsItem[]): StandardizedNewsItem[] {
    return polygonNews.map(item => {
      // 转换时间戳为日期
      const publishedAt = new Date(item.published_utc);

      // 提取标签
      const tags: string[] = [];
      
      // 添加股票代码标签
      if (item.tickers && item.tickers.length > 0) {
        item.tickers.forEach(ticker => {
          tags.push(`stock:${ticker}`);
        });
      }

      // 添加发布者标签
      if (item.publisher?.name) {
        tags.push(`publisher:${item.publisher.name.toLowerCase()}`);
      }

      // 添加关键词标签
      if (item.keywords && item.keywords.length > 0) {
        tags.push(...item.keywords.map(keyword => keyword.toLowerCase()));
      }

      // 添加科技相关标签
      const title = item.title.toLowerCase();
      const description = item.description?.toLowerCase() || '';
      
      if (title.includes('ai') || title.includes('artificial intelligence')) {
        tags.push('artificial-intelligence');
      }
      
      if (title.includes('tech') || title.includes('technology')) {
        tags.push('technology');
      }
      
      if (title.includes('crypto') || title.includes('blockchain')) {
        tags.push('cryptocurrency');
      }

      // 简单的情感分析（基于关键词）
      let sentimentScore = 0;
      const positiveWords = ['growth', 'profit', 'success', 'gain', 'rise', 'up', 'positive', 'breakthrough', 'innovation'];
      const negativeWords = ['loss', 'decline', 'fall', 'down', 'negative', 'crisis', 'drop', 'crash', 'failure'];
      
      const text = (item.title + ' ' + (item.description || '')).toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) sentimentScore += 0.1;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) sentimentScore -= 0.1;
      });

      // 限制分数范围
      sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

      return {
        title: item.title,
        description: item.description || '',
        url: item.article_url,
        imageUrl: item.image_url,
        publishedAt,
        source: item.publisher?.name || 'Polygon',
        category: 'stock-news',
        tags,
        metadata: {
          sentiment: {
            score: sentimentScore,
            label: sentimentScore > 0.2 ? 'Positive' : sentimentScore < -0.2 ? 'Negative' : 'Neutral'
          },
          relevance: 0.8, // 默认相关性
          source: 'polygon'
        }
      };
    });
  }

  /**
   * 获取标准化的科技新闻
   */
  public async getStandardizedTechNews(limit: number = 50): Promise<StandardizedNewsItem[]> {
    try {
      const techNews = await this.getTechNews(limit);
      return this.standardizeNewsData(techNews);
    } catch (error) {
      logger.error('获取标准化Polygon科技新闻失败', { error });
      throw error;
    }
  }

  /**
   * 获取标准化的AI新闻
   */
  public async getStandardizedAINews(limit: number = 30): Promise<StandardizedNewsItem[]> {
    try {
      const aiNews = await this.getAINews(limit);
      return this.standardizeNewsData(aiNews);
    } catch (error) {
      logger.error('获取标准化Polygon AI新闻失败', { error });
      throw error;
    }
  }
}
