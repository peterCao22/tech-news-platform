import Parser from 'rss-parser';
import { logger } from '../utils/logger';
import { 
  sourceRepository, 
  contentRepository, 
  CreateContentData,
  SourceType,
  SourceStatus 
} from '@tech-news-platform/database';

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  categories?: string[];
  creator?: string;
  summary?: string;
  enclosure?: {
    url: string;
    type: string;
  };
  'content:encoded'?: string;
  'dc:creator'?: string;
  [key: string]: any; // 允许其他自定义字段
}

interface RSSFeed {
  title?: string;
  description?: string;
  link?: string;
  items: RSSItem[];
  language?: string;
  copyright?: string;
  managingEditor?: string;
  [key: string]: any; // 允许其他自定义字段
}

export class RSSService {
  private parser: Parser<RSSFeed, RSSItem>;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'TechNews-Platform/1.0 (RSS Reader)',
      },
      customFields: {
        feed: ['language', 'copyright', 'managingEditor'],
        item: ['media:content', 'media:thumbnail', 'dc:creator', 'content:encoded'],
      },
    }) as Parser<RSSFeed, RSSItem>;
  }

  /**
   * 解析单个RSS源
   */
  async parseFeed(url: string): Promise<RSSFeed> {
    try {
      logger.info(`开始解析RSS源: ${url}`);
      const feed = await this.parser.parseURL(url);
      
      logger.info(`成功解析RSS源: ${url}, 获得 ${feed.items.length} 条内容`);
      return feed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`解析RSS源失败: ${url}`, { error: errorMessage });
      throw new Error(`Failed to parse RSS feed: ${errorMessage}`);
    }
  }

  /**
   * 将RSS项目转换为内容数据
   */
  private convertRSSItemToContent(item: RSSItem, sourceId: string): CreateContentData {
    // 提取图片URL
    let imageUrl: string | undefined;
    if (item.enclosure?.type?.startsWith('image/')) {
      imageUrl = item.enclosure.url;
    }

    // 处理发布时间
    let publishedAt: Date | undefined;
    if (item.pubDate) {
      publishedAt = new Date(item.pubDate);
      // 验证日期是否有效
      if (isNaN(publishedAt.getTime())) {
        publishedAt = undefined;
      }
    }

    // 处理内容和摘要
    const content = item.content || item['content:encoded'] || item.contentSnippet;
    const description = item.summary || item.contentSnippet || 
      (content ? this.extractSummary(content) : undefined);

    // 处理标签
    const tags = item.categories || [];

    return {
      title: item.title || 'Untitled',
      description,
      content,
      url: item.link,
      imageUrl,
      category: 'tech', // 默认分类，后续可以通过AI分析改进
      tags,
      sourceId,
      sourceUrl: item.link,
      publishedAt,
      metadata: {
        guid: item.guid,
        creator: item.creator || item['dc:creator'],
        originalCategories: item.categories,
      },
    };
  }

  /**
   * 从内容中提取摘要
   */
  private extractSummary(content: string, maxLength: number = 200): string {
    // 移除HTML标签
    const textContent = content.replace(/<[^>]*>/g, '');
    
    // 截取指定长度
    if (textContent.length <= maxLength) {
      return textContent;
    }
    
    // 在单词边界截取
    const truncated = textContent.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * 获取并处理单个RSS源的内容
   */
  async fetchAndProcessSource(sourceId: string): Promise<{
    success: boolean;
    newItemsCount: number;
    error?: string;
  }> {
    try {
      // 获取源信息
      const source = await sourceRepository.findById(sourceId);
      if (!source || !source.url) {
        throw new Error('Source not found or URL missing');
      }

      logger.info(`开始处理RSS源: ${source.name} (${source.url})`);

      // 解析RSS
      const feed = await this.parseFeed(source.url);

      // 获取最近的内容用于去重
      const recentContent = await contentRepository.findRecent(sourceId, 48); // 48小时内的内容
      const existingUrls = new Set(recentContent.map(c => c.url).filter(Boolean));
      const existingTitles = new Set(recentContent.map(c => c.title.toLowerCase()));

      // 过滤新内容
      const newItems = feed.items.filter(item => {
        if (item.link && existingUrls.has(item.link)) {
          return false;
        }
        if (item.title && existingTitles.has(item.title.toLowerCase())) {
          return false;
        }
        return true;
      });

      logger.info(`过滤后的新内容数量: ${newItems.length}`);

      // 转换并保存新内容
      let savedCount = 0;
      if (newItems.length > 0) {
        const contentDataList = newItems.map(item => 
          this.convertRSSItemToContent(item, sourceId)
        );

        try {
          const result = await contentRepository.createMany(contentDataList);
          savedCount = result.count;
          logger.info(`成功保存 ${savedCount} 条新内容`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error('批量保存内容失败，尝试逐个保存', { error: errorMessage });
          
          // 如果批量保存失败，尝试逐个保存
          for (const contentData of contentDataList) {
            try {
              await contentRepository.create(contentData);
              savedCount++;
            } catch (itemError) {
              const itemErrorMessage = itemError instanceof Error ? itemError.message : String(itemError);
              logger.error(`保存单条内容失败: ${contentData.title}`, { 
                error: itemErrorMessage 
              });
            }
          }
        }
      }

      // 更新源的抓取统计
      await sourceRepository.updateFetchStats(sourceId, true);

      return {
        success: true,
        newItemsCount: savedCount,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`处理RSS源失败: ${sourceId}`, { error: errorMessage });

      // 更新源的错误统计
      try {
        await sourceRepository.updateFetchStats(sourceId, false, errorMessage);
      } catch (updateError) {
        const updateErrorMessage = updateError instanceof Error ? updateError.message : String(updateError);
        logger.error('更新源统计失败', { error: updateErrorMessage });
      }

      return {
        success: false,
        newItemsCount: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * 批量处理所有活跃的RSS源
   */
  async fetchAllActiveSources(): Promise<{
    totalSources: number;
    successCount: number;
    totalNewItems: number;
    errors: Array<{ sourceId: string; error: string }>;
  }> {
    logger.info('开始批量处理所有活跃RSS源');

    const activeSources = await sourceRepository.findActiveRssSources();
    logger.info(`找到 ${activeSources.length} 个活跃RSS源`);

    const results = {
      totalSources: activeSources.length,
      successCount: 0,
      totalNewItems: 0,
      errors: [] as Array<{ sourceId: string; error: string }>,
    };

    // 并发处理，但限制并发数量
    const concurrencyLimit = 3;
    const chunks = [];
    
    for (let i = 0; i < activeSources.length; i += concurrencyLimit) {
      chunks.push(activeSources.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(source => 
        this.fetchAndProcessSource(source.id)
      );

      const chunkResults = await Promise.allSettled(promises);

      chunkResults.forEach((result, index) => {
        const source = chunk[index];
        
        if (result.status === 'fulfilled') {
          const { success, newItemsCount, error } = result.value;
          
          if (success) {
            results.successCount++;
            results.totalNewItems += newItemsCount;
          } else {
            results.errors.push({
              sourceId: source.id,
              error: error || 'Unknown error',
            });
          }
        } else {
          results.errors.push({
            sourceId: source.id,
            error: result.reason?.message || 'Promise rejected',
          });
        }
      });

      // 在处理下一批之前稍作延迟，避免过度负载
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('批量处理完成', {
      totalSources: results.totalSources,
      successCount: results.successCount,
      totalNewItems: results.totalNewItems,
      errorCount: results.errors.length,
    });

    return results;
  }

  /**
   * 验证RSS源URL是否有效
   */
  async validateRSSUrl(url: string): Promise<{
    valid: boolean;
    title?: string;
    description?: string;
    itemCount?: number;
    error?: string;
  }> {
    try {
      const feed = await this.parseFeed(url);
      
      return {
        valid: true,
        title: feed.title,
        description: feed.description,
        itemCount: feed.items.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error: errorMessage,
      };
    }
  }
}

export const rssService = new RSSService();
