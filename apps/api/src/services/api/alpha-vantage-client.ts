// 科技新闻聚合平台 - Alpha Vantage API客户端
// 集成Alpha Vantage API获取股票相关新闻

import { BaseApiClient, ApiClientConfig, AuthType } from './base-api-client';
import { logger } from '../../utils/logger';

/**
 * Alpha Vantage新闻数据接口
 */
export interface AlphaVantageNewsItem {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  banner_image?: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  topics: Array<{
    topic: string;
    relevance_score: string;
  }>;
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: Array<{
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }>;
}

/**
 * Alpha Vantage新闻响应接口
 */
export interface AlphaVantageNewsResponse {
  items: string;
  sentiment_score_definition: string;
  relevance_score_definition: string;
  feed: AlphaVantageNewsItem[];
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
  category?: string;
  tags: string[];
  metadata: {
    sentiment: {
      score: number;
      label: string;
    };
    tickers?: Array<{
      symbol: string;
      relevance: number;
      sentiment: number;
    }>;
    topics?: Array<{
      name: string;
      relevance: number;
    }>;
  };
}

/**
 * Alpha Vantage API客户端
 */
export class AlphaVantageClient extends BaseApiClient {
  constructor(apiKey: string) {
    const config: ApiClientConfig = {
      baseURL: 'https://www.alphavantage.co/query',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        maxRequests: 5, // Alpha Vantage免费版限制
        windowMs: 60000 // 每分钟5次
      },
      auth: {
        type: AuthType.API_KEY,
        apiKey,
        headerName: 'apikey' // Alpha Vantage使用查询参数而不是header
      }
    };

    super(config);
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // 使用新闻情感分析来检查API是否可用
      const response = await this.get('', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: 'AAPL',
          apikey: this.config.auth?.apiKey,
          limit: 1
        }
      });

      return response && !response['Error Message'] && !response['Note'] && response.feed && Array.isArray(response.feed) && response.feed.length > 0;
    } catch (error) {
      logger.error('Alpha Vantage健康检查失败', { error });
      return false;
    }
  }

  /**
   * 获取市场新闻
   */
  public async getMarketNews(options?: {
    tickers?: string[]; // 股票代码列表
    topics?: string[]; // 主题列表 (technology, earnings, ipo, etc.)
    timeFrom?: string; // 开始时间 (YYYYMMDDTHHMM)
    timeTo?: string; // 结束时间 (YYYYMMDDTHHMM)
    sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
    limit?: number; // 最大返回数量 (1-1000)
  }): Promise<AlphaVantageNewsResponse> {
    try {
      const params: any = {
        function: 'NEWS_SENTIMENT',
        apikey: this.config.auth?.apiKey,
        sort: options?.sort || 'LATEST',
        limit: options?.limit || 50
      };

      if (options?.tickers && options.tickers.length > 0) {
        params.tickers = options.tickers.join(',');
      }

      if (options?.topics && options.topics.length > 0) {
        params.topics = options.topics.join(',');
      }

      if (options?.timeFrom) {
        params.time_from = options.timeFrom;
      }

      if (options?.timeTo) {
        params.time_to = options.timeTo;
      }

      const response = await this.get<AlphaVantageNewsResponse>('', { params });

      if ((response as any)['Error Message']) {
        throw new Error(`Alpha Vantage API错误: ${(response as any)['Error Message']}`);
      }

      if ((response as any)['Note']) {
        throw new Error(`Alpha Vantage API限制: ${(response as any)['Note']}`);
      }

      return response;
    } catch (error) {
      logger.error('获取Alpha Vantage市场新闻失败', { error, options });
      throw error;
    }
  }

  /**
   * 获取科技股新闻
   */
  public async getTechStockNews(limit = 50): Promise<AlphaVantageNewsResponse> {
    const techTickers = [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX',
      'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'ADBE', 'NOW', 'SNOW'
    ];

    return this.getMarketNews({
      tickers: techTickers,
      topics: ['technology', 'earnings', 'ipo'],
      sort: 'LATEST',
      limit
    });
  }

  /**
   * 获取AI相关股票新闻
   */
  public async getAIStockNews(limit = 30): Promise<AlphaVantageNewsResponse> {
    const aiTickers = [
      'NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'AMD', 'INTC',
      'CRM', 'NOW', 'PLTR', 'AI', 'SNOW', 'DDOG'
    ];

    return this.getMarketNews({
      tickers: aiTickers,
      topics: ['technology'],
      sort: 'RELEVANCE',
      limit
    });
  }

  /**
   * 标准化新闻数据
   */
  public standardizeNewsData(alphaVantageNews: AlphaVantageNewsItem[]): StandardizedNewsItem[] {
    return alphaVantageNews.map(item => {
      // 解析发布时间
      const publishedAt = new Date(item.time_published.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));

      // 提取标签
      const tags: string[] = [];
      
      // 添加主题标签
      if (item.topics) {
        item.topics.forEach(topic => {
          if (parseFloat(topic.relevance_score) > 0.3) {
            tags.push(topic.topic);
          }
        });
      }

      // 添加股票标签
      if (item.ticker_sentiment) {
        item.ticker_sentiment.forEach(ticker => {
          if (parseFloat(ticker.relevance_score) > 0.3) {
            tags.push(`stock:${ticker.ticker}`);
          }
        });
      }

      // 添加情感标签
      if (item.overall_sentiment_label) {
        tags.push(`sentiment:${item.overall_sentiment_label.toLowerCase()}`);
      }

      // 添加来源标签
      tags.push(`source:${item.source_domain}`);

      return {
        title: item.title,
        description: item.summary,
        url: item.url,
        imageUrl: item.banner_image,
        publishedAt,
        source: item.source,
        category: item.category_within_source,
        tags,
        metadata: {
          sentiment: {
            score: item.overall_sentiment_score,
            label: item.overall_sentiment_label
          },
          tickers: item.ticker_sentiment?.map(ticker => ({
            symbol: ticker.ticker,
            relevance: parseFloat(ticker.relevance_score),
            sentiment: parseFloat(ticker.ticker_sentiment_score)
          })),
          topics: item.topics?.map(topic => ({
            name: topic.topic,
            relevance: parseFloat(topic.relevance_score)
          }))
        }
      };
    });
  }

  /**
   * 获取并标准化科技新闻
   */
  public async getStandardizedTechNews(limit = 50): Promise<StandardizedNewsItem[]> {
    try {
      const response = await this.getTechStockNews(limit);
      return this.standardizeNewsData(response.feed);
    } catch (error) {
      logger.error('获取标准化科技新闻失败', { error });
      throw error;
    }
  }

  /**
   * 获取并标准化AI新闻
   */
  public async getStandardizedAINews(limit = 30): Promise<StandardizedNewsItem[]> {
    try {
      const response = await this.getAIStockNews(limit);
      return this.standardizeNewsData(response.feed);
    } catch (error) {
      logger.error('获取标准化AI新闻失败', { error });
      throw error;
    }
  }

  /**
   * 搜索特定公司的新闻
   */
  public async searchCompanyNews(
    ticker: string, 
    timeFrom?: string, 
    timeTo?: string,
    limit = 20
  ): Promise<StandardizedNewsItem[]> {
    try {
      const response = await this.getMarketNews({
        tickers: [ticker],
        timeFrom,
        timeTo,
        sort: 'LATEST',
        limit
      });

      return this.standardizeNewsData(response.feed);
    } catch (error) {
      logger.error('搜索公司新闻失败', { error, ticker });
      throw error;
    }
  }
}
