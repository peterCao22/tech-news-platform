// 科技新闻聚合平台 - Polygon 新闻服务
// 集成 Polygon API 获取股票新闻和市场数据

import { PolygonClient, StandardizedNewsItem } from './api/polygon-client';
import { ApiConfigurationService, ApiProvider } from './api-configuration.service';
import { ContentItemService } from './content-item.service';
import { SourceRepository, SourceType, ContentStatus } from '@tech-news-platform/database';
import { logger } from '../utils/logger';

export class PolygonNewsService {
  private polygonClient: PolygonClient | null = null;
  private contentItemService: ContentItemService;
  private sourceRepository: SourceRepository;

  constructor() {
    this.contentItemService = new ContentItemService();
    this.sourceRepository = new SourceRepository();
  }

  /**
   * 获取 Polygon 客户端
   */
  private async getClient(): Promise<PolygonClient> {
    if (!this.polygonClient) {
      this.polygonClient = await ApiConfigurationService.getPolygonClient();
    }
    return this.polygonClient;
  }

  /**
   * 获取或创建 Polygon 源
   */
  private async getOrCreatePolygonSource() {
    try {
      // 尝试查找现有的 Polygon 源
      const allSources = await this.sourceRepository.findMany();
      const existingSources = allSources.filter(source => 
        source.name.includes('Polygon')
      );

      if (existingSources.length > 0) {
        return existingSources[0];
      }

      // 创建新的 Polygon 源
      const sourceData = {
        name: 'Polygon - 股票新闻',
        type: 'API' as const,
        url: 'https://api.polygon.io',
        status: 'ACTIVE' as const,
        config: {
          provider: 'polygon',
          apiType: 'NEWS',
          description: 'Polygon 股票新闻 API，提供实时股票相关新闻和市场数据'
        }
      };

      const newSource = await this.sourceRepository.create(sourceData);
      logger.info('创建新的 Polygon 源', { id: newSource.id, name: newSource.name });
      
      return newSource;
    } catch (error) {
      logger.error('获取或创建 Polygon 源失败', { error });
      throw error;
    }
  }

  /**
   * 保存新闻项目到数据库
   */
  private async saveNewsItem(newsItem: StandardizedNewsItem, sourceId: string) {
    try {
      logger.debug('准备保存新闻', { url: newsItem.url, title: newsItem.title });

      const contentData = {
        title: newsItem.title,
        description: newsItem.description,
        content: newsItem.description,
        url: newsItem.url,
        imageUrl: newsItem.imageUrl,
        category: newsItem.category,
        tags: newsItem.tags,
        status: ContentStatus.RAW,
        score: newsItem.metadata.sentiment.score,
        priority: 0,
        sourceId: sourceId,
        sourceUrl: newsItem.url,
        publishedAt: newsItem.publishedAt,
        metadata: newsItem.metadata,
        author: newsItem.source,
        contentHash: null,
        duplicateOf: null,
        keywords: [],
        quality: null,
        relevance: null,
        shareCount: 0,
        summary: newsItem.description,
        titleHash: null,
        type: 'NEWS' as const,
        viewCount: 0,
      };

      const savedContent = await this.contentItemService.createContent(contentData);
      logger.info('新闻保存成功', { contentId: savedContent.id, title: savedContent.title });
      return savedContent;
    } catch (error) {
      logger.error('保存新闻项目失败', { error, newsItemTitle: newsItem.title });
      throw error;
    }
  }

  /**
   * 获取并保存 Polygon 科技新闻
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
      logger.info('开始获取 Polygon 科技新闻', { limit });

      // 1. 获取 Polygon 客户端
      const client = await this.getClient();
      
      // 2. 获取科技新闻数据
      const newsItems = await client.getStandardizedTechNews(limit);
      result.totalFetched = newsItems.length;

      logger.info(`获取到 ${newsItems.length} 条科技新闻`);

      // 3. 获取或创建 Polygon 源
      const source = await this.getOrCreatePolygonSource();

      // 4. 保存新闻到数据库
      for (const newsItem of newsItems) {
        try {
          await this.saveNewsItem(newsItem, source.id);
          result.totalSaved++;
        } catch (error) {
          const errorMsg = `保存科技新闻失败: ${newsItem.title} - ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      result.success = result.totalSaved > 0;

      logger.info('Polygon 科技新闻获取完成', {
        totalFetched: result.totalFetched,
        totalSaved: result.totalSaved,
        errorCount: result.errors.length
      });

    } catch (error) {
      const errorMsg = `获取 Polygon 科技新闻失败: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }

    return result;
  }

  /**
   * 获取并保存 Polygon AI 新闻
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
      logger.info('开始获取 Polygon AI 新闻', { limit });

      // 1. 获取 Polygon 客户端
      const client = await this.getClient();
      
      // 2. 获取 AI 新闻数据
      const newsItems = await client.getStandardizedAINews(limit);
      result.totalFetched = newsItems.length;

      logger.info(`获取到 ${newsItems.length} 条 AI 新闻`);

      // 3. 获取或创建 Polygon 源
      const source = await this.getOrCreatePolygonSource();

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

      logger.info('Polygon AI 新闻获取完成', {
        totalFetched: result.totalFetched,
        totalSaved: result.totalSaved,
        errorCount: result.errors.length
      });

    } catch (error) {
      const errorMsg = `获取 Polygon AI 新闻失败: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }

    return result;
  }

  /**
   * 获取并保存公司新闻
   */
  public async fetchAndSaveCompanyNews(symbol: string, limit = 20): Promise<{
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
      logger.info('开始获取 Polygon 公司新闻', { symbol, limit });

      // 1. 获取 Polygon 客户端
      const client = await this.getClient();
      
      // 2. 获取公司新闻数据
      const newsItems = await client.searchCompanyNews(symbol);
      const limitedNews = newsItems.slice(0, limit);
      result.totalFetched = limitedNews.length;

      logger.info(`获取到 ${limitedNews.length} 条 ${symbol} 公司新闻`);

      // 3. 获取或创建 Polygon 源
      const source = await this.getOrCreatePolygonSource();

      // 4. 保存新闻到数据库
      for (const newsItem of limitedNews) {
        try {
          const standardizedNews = client.standardizeNewsData([newsItem])[0];
          await this.saveNewsItem(standardizedNews, source.id);
          result.totalSaved++;
        } catch (error) {
          const errorMsg = `保存公司新闻失败: ${newsItem.title} - ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      result.success = result.totalSaved > 0;

      logger.info('Polygon 公司新闻获取完成', {
        symbol,
        totalFetched: result.totalFetched,
        totalSaved: result.totalSaved,
        errorCount: result.errors.length
      });

    } catch (error) {
      const errorMsg = `获取 Polygon 公司新闻失败: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }

    return result;
  }

  /**
   * 执行完整的数据获取任务
   */
  public async executeFullFetchTask(): Promise<{
    success: boolean;
    totalSaved: number;
    totalErrors: number;
    results: {
      techNews: { totalSaved: number; errors: string[] };
      aiNews: { totalSaved: number; errors: string[] };
      companyNews: { totalSaved: number; errors: string[] };
    };
  }> {
    logger.info('开始执行完整的 Polygon 数据获取任务');
    
    let totalSaved = 0;
    let totalErrors = 0;
    const results = {
      techNews: { totalSaved: 0, errors: [] as string[] },
      aiNews: { totalSaved: 0, errors: [] as string[] },
      companyNews: { totalSaved: 0, errors: [] as string[] },
    };

    try {
      // 获取科技新闻
      const techResult = await this.fetchAndSaveTechNews();
      results.techNews = techResult;
      totalSaved += techResult.totalSaved;
      totalErrors += techResult.errors.length;
      logger.info(`科技新闻获取完成，保存 ${techResult.totalSaved} 条`);

      // 获取 AI 新闻
      const aiResult = await this.fetchAndSaveAINews();
      results.aiNews = aiResult;
      totalSaved += aiResult.totalSaved;
      totalErrors += aiResult.errors.length;
      logger.info(`AI 新闻获取完成，保存 ${aiResult.totalSaved} 条`);

      // 获取热门公司新闻
      const topCompanies = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];
      for (const symbol of topCompanies) {
        const companyResult = await this.fetchAndSaveCompanyNews(symbol);
        results.companyNews.totalSaved += companyResult.totalSaved;
        results.companyNews.errors.push(...companyResult.errors);
        totalSaved += companyResult.totalSaved;
        totalErrors += companyResult.errors.length;
        logger.info(`公司新闻 (${symbol}) 获取完成，保存 ${companyResult.totalSaved} 条`);
      }

      return { success: true, totalSaved, totalErrors, results };
    } catch (error) {
      logger.error('执行完整的 Polygon 数据获取任务失败', { error });
      return { success: false, totalSaved, totalErrors, results };
    }
  }
}

export const polygonService = new PolygonNewsService();
