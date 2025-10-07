// 科技新闻聚合平台 - Alpha Vantage 数据获取服务
// 定期获取 Alpha Vantage 新闻数据并保存到数据库

import { ApiConfigurationService, ApiProvider } from './api-configuration.service';
import { AlphaVantageClient, StandardizedNewsItem } from './api/alpha-vantage-client';
import { ContentItemService } from './content-item.service';
import { SourceRepository } from '@tech-news-platform/database';
import { logger } from '../utils/logger';

export class AlphaVantageService {
  private contentService: ContentItemService;
  private sourceRepository: SourceRepository;

  constructor() {
    this.contentService = new ContentItemService();
    this.sourceRepository = new SourceRepository();
  }

  /**
   * 获取并保存 Alpha Vantage 科技新闻
   */
  public async fetchAndSaveTechNews(limit = 50): Promise<{
    success: boolean;
    totalFetched: number;
    totalSaved: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      totalFetched: 0,
      totalSaved: 0,
      errors: [] as string[]
    };

    try {
      logger.info('开始获取 Alpha Vantage 科技新闻', { limit });

      // 1. 获取 Alpha Vantage 客户端
      const client = await ApiConfigurationService.getAlphaVantageClient();
      
      // 2. 获取科技新闻数据
      const newsItems = await client.getStandardizedTechNews(limit);
      result.totalFetched = newsItems.length;

      logger.info(`获取到 ${newsItems.length} 条科技新闻`);

      // 3. 获取或创建 Alpha Vantage 源
      const source = await this.getOrCreateAlphaVantageSource();

      // 4. 保存新闻到数据库
      for (const newsItem of newsItems) {
        try {
          await this.saveNewsItem(newsItem, source.id);
          result.totalSaved++;
        } catch (error) {
          const errorMsg = `保存新闻失败: ${newsItem.title} - ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      result.success = result.totalSaved > 0;

      logger.info('Alpha Vantage 科技新闻获取完成', {
        totalFetched: result.totalFetched,
        totalSaved: result.totalSaved,
        errorCount: result.errors.length
      });

    } catch (error) {
      const errorMsg = `获取 Alpha Vantage 科技新闻失败: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }

    return result;
  }

  /**
   * 获取并保存 Alpha Vantage AI 新闻
   */
  public async fetchAndSaveAINews(limit = 30): Promise<{
    success: boolean;
    totalFetched: number;
    totalSaved: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      totalFetched: 0,
      totalSaved: 0,
      errors: [] as string[]
    };

    try {
      logger.info('开始获取 Alpha Vantage AI 新闻', { limit });

      // 1. 获取 Alpha Vantage 客户端
      const client = await ApiConfigurationService.getAlphaVantageClient();
      
      // 2. 获取 AI 新闻数据
      const newsItems = await client.getStandardizedAINews(limit);
      result.totalFetched = newsItems.length;

      logger.info(`获取到 ${newsItems.length} 条 AI 新闻`);

      // 3. 获取或创建 Alpha Vantage 源
      const source = await this.getOrCreateAlphaVantageSource();

      // 4. 保存新闻到数据库
      for (const newsItem of newsItems) {
        try {
          await this.saveNewsItem(newsItem, source.id);
          result.totalSaved++;
        } catch (error) {
          const errorMsg = `保存 AI 新闻失败: ${newsItem.title} - ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      result.success = result.totalSaved > 0;

      logger.info('Alpha Vantage AI 新闻获取完成', {
        totalFetched: result.totalFetched,
        totalSaved: result.totalSaved,
        errorCount: result.errors.length
      });

    } catch (error) {
      const errorMsg = `获取 Alpha Vantage AI 新闻失败: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }

    return result;
  }

  /**
   * 获取并保存特定公司的新闻
   */
  public async fetchAndSaveCompanyNews(
    ticker: string, 
    limit = 20
  ): Promise<{
    success: boolean;
    totalFetched: number;
    totalSaved: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      totalFetched: 0,
      totalSaved: 0,
      errors: [] as string[]
    };

    try {
      logger.info('开始获取公司新闻', { ticker, limit });

      // 1. 获取 Alpha Vantage 客户端
      const client = await ApiConfigurationService.getAlphaVantageClient();
      
      // 2. 获取公司新闻数据
      const newsItems = await client.searchCompanyNews(ticker, undefined, undefined, limit);
      result.totalFetched = newsItems.length;

      logger.info(`获取到 ${newsItems.length} 条 ${ticker} 新闻`);

      // 3. 获取或创建 Alpha Vantage 源
      const source = await this.getOrCreateAlphaVantageSource();

      // 4. 保存新闻到数据库
      for (const newsItem of newsItems) {
        try {
          await this.saveNewsItem(newsItem, source.id);
          result.totalSaved++;
        } catch (error) {
          const errorMsg = `保存 ${ticker} 新闻失败: ${newsItem.title} - ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      result.success = result.totalSaved > 0;

      logger.info(`${ticker} 新闻获取完成`, {
        totalFetched: result.totalFetched,
        totalSaved: result.totalSaved,
        errorCount: result.errors.length
      });

    } catch (error) {
      const errorMsg = `获取 ${ticker} 新闻失败: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }

    return result;
  }

  /**
   * 获取或创建 Alpha Vantage 源
   */
  private async getOrCreateAlphaVantageSource() {
    try {
      // 尝试查找现有的 Alpha Vantage 源
      const allSources = await this.sourceRepository.findMany();
      const existingSources = allSources.filter(source => 
        source.name.includes('Alpha Vantage')
      );

      if (existingSources.length > 0) {
        return existingSources[0];
      }

      // 创建新的 Alpha Vantage 源
      const sourceData = {
        name: 'Alpha Vantage - 金融新闻',
        type: 'API' as const,
        url: 'https://www.alphavantage.co/query',
        status: 'ACTIVE' as const,
        config: {
          provider: 'alpha_vantage',
          apiType: 'NEWS_SENTIMENT',
          description: 'Alpha Vantage 金融新闻 API，提供股票相关新闻和情感分析'
        }
      };

      const newSource = await this.sourceRepository.create(sourceData);
      logger.info('创建新的 Alpha Vantage 源', { id: newSource.id, name: newSource.name });
      
      return newSource;
    } catch (error) {
      logger.error('获取或创建 Alpha Vantage 源失败', { error });
      throw error;
    }
  }

  /**
   * 保存新闻项目到数据库
   */
  private async saveNewsItem(newsItem: StandardizedNewsItem, sourceId: string) {
    try {
      // 检查是否已存在相同的新闻（基于 URL）
      // 注意：这里需要根据实际的 ContentItemService 接口来调整
      // 暂时跳过重复检查，直接保存
      logger.debug('准备保存新闻', { url: newsItem.url, title: newsItem.title });

      // 创建内容数据
      const contentData = {
        title: newsItem.title,
        description: newsItem.description,
        content: newsItem.description, // 使用描述作为内容
        url: newsItem.url,
        imageUrl: newsItem.imageUrl,
        category: newsItem.category || 'Finance',
        tags: newsItem.tags,
        status: 'RAW' as const,
        sourceId: sourceId,
        sourceUrl: newsItem.url,
        publishedAt: newsItem.publishedAt,
        metadata: {
          sentiment: newsItem.metadata.sentiment,
          tickers: newsItem.metadata.tickers,
          topics: newsItem.metadata.topics,
          source: newsItem.source,
          originalProvider: 'alpha_vantage'
        }
      };

      // 保存到数据库
      const savedContent = await this.contentService.createContent(contentData);
      
      logger.debug('新闻保存成功', { 
        id: savedContent.id, 
        title: savedContent.title,
        source: newsItem.source 
      });

      return savedContent;
    } catch (error) {
      logger.error('保存新闻项目失败', { 
        error: error instanceof Error ? error.message : String(error),
        title: newsItem.title,
        url: newsItem.url 
      });
      throw error;
    }
  }

  /**
   * 执行完整的 Alpha Vantage 数据获取任务
   */
  public async executeFullFetchTask(): Promise<{
    success: boolean;
    results: {
      techNews: any;
      aiNews: any;
      companyNews: any;
    };
    totalSaved: number;
    totalErrors: number;
  }> {
    logger.info('开始执行完整的 Alpha Vantage 数据获取任务');

    const results = {
      techNews: { success: false, totalFetched: 0, totalSaved: 0, errors: [] as string[] },
      aiNews: { success: false, totalFetched: 0, totalSaved: 0, errors: [] as string[] },
      companyNews: { success: false, totalFetched: 0, totalSaved: 0, errors: [] as string[] }
    };

    try {
      // 1. 获取科技新闻
      results.techNews = await this.fetchAndSaveTechNews(30);
      
      // 2. 获取 AI 新闻
      results.aiNews = await this.fetchAndSaveAINews(20);
      
      // 3. 获取热门科技公司新闻
      const techCompanies = ['NVDA', 'AAPL', 'GOOGL', 'MSFT', 'TSLA'];
      for (const ticker of techCompanies) {
        try {
          const companyResult = await this.fetchAndSaveCompanyNews(ticker, 5);
          results.companyNews.totalFetched += companyResult.totalFetched;
          results.companyNews.totalSaved += companyResult.totalSaved;
          results.companyNews.errors.push(...companyResult.errors);
        } catch (error) {
          results.companyNews.errors.push(`${ticker}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      results.companyNews.success = results.companyNews.totalSaved > 0;

      const totalSaved = results.techNews.totalSaved + results.aiNews.totalSaved + results.companyNews.totalSaved;
      const totalErrors = results.techNews.errors.length + results.aiNews.errors.length + results.companyNews.errors.length;

      logger.info('Alpha Vantage 完整数据获取任务完成', {
        totalSaved,
        totalErrors,
        techNews: results.techNews.totalSaved,
        aiNews: results.aiNews.totalSaved,
        companyNews: results.companyNews.totalSaved
      });

      return {
        success: totalSaved > 0,
        results,
        totalSaved,
        totalErrors
      };

    } catch (error) {
      logger.error('Alpha Vantage 完整数据获取任务失败', { error });
      throw error;
    }
  }
}

// 创建单例实例
export const alphaVantageService = new AlphaVantageService();
