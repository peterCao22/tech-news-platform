/**
 * Content Management Service
 * 手工内容管理服务
 * Story 3.3: Manual Content Management
 */

import { prisma, Content, BatchImport, ContentReviewStatus, ContentStatus, SourceType, SourceStatus } from '@tech-news-platform/database';
import urlScraperService from './url-scraper.service';
import sanitizeHtml from 'sanitize-html';

interface CreateContentInput {
  title: string;
  description?: string;
  content?: string;
  url?: string;
  category?: string;
  tags?: string[];
  sourceId?: string;
  customSource?: {
    name: string;
    domain: string;
  };
  publishedAt?: Date;
  reviewStatus?: ContentReviewStatus;
  createdBy: string;
}

interface ImportUrlInput {
  url: string;
  autoFill?: boolean;
  userId: string;
}

interface BatchImportInput {
  type: 'urls' | 'text' | 'json';
  data: {
    urls?: string[];
    text?: string;
    items?: Array<Partial<CreateContentInput>>;
  };
  options?: {
    autoApprove?: boolean;
    defaultCategory?: string;
    defaultTags?: string[];
  };
  userId: string;
}

interface ValidationResult {
  valid: boolean;
  issues: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  suggestions: string[];
}

class ContentManagementService {
  /**
   * 创建手工内容
   */
  async createManualContent(input: CreateContentInput): Promise<Content> {
    try {
      // 清理HTML内容
      let cleanContent = input.content;
      if (cleanContent) {
        cleanContent = this.sanitizeContent(cleanContent);
      }

      // 处理来源
      let sourceId = input.sourceId;
      if (!sourceId && input.customSource) {
        // 创建或获取自定义来源
        sourceId = await this.getOrCreateCustomSource(
          input.customSource.name,
          input.customSource.domain
        );
      }

      // 如果仍然没有来源，使用默认的"手工创建"来源
      if (!sourceId) {
        sourceId = await this.getOrCreateCustomSource('手工创建', 'manual.internal');
      }

      // 创建内容
      const content = await prisma.content.create({
        data: {
          title: input.title,
          description: input.description,
          content: cleanContent,
          url: input.url,
          category: input.category || 'GENERAL',
          tags: input.tags || [],
          sourceId: sourceId!,
          publishedAt: input.publishedAt || new Date(),
          reviewStatus: input.reviewStatus || 'DRAFT',
          status: ContentStatus.PROCESSED,
          lastEditedBy: input.createdBy,
          lastEditedAt: new Date(),
        },
        include: {
          source: true,
          editor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      console.log(`[Content Management] Manual content created: ${content.id}`);
      return content;
    } catch (error: any) {
      console.error('[Content Management] Create content error:', error);
      throw new Error(`创建内容失败: ${error.message}`);
    }
  }

  /**
   * 从URL导入内容
   */
  async importFromUrl(input: ImportUrlInput) {
    try {
      console.log(`[Content Management] Importing from URL: ${input.url}`);

      // 抓取URL内容
      const scrapedData = await urlScraperService.scrapeURL(input.url, {
        extractFullContent: true,
        includeImages: true,
      });

      // 如果自动填充，则创建内容
      if (input.autoFill) {
        const content = await this.createManualContent({
          title: scrapedData.title,
          description: scrapedData.description,
          content: scrapedData.content,
          url: input.url,
          customSource: {
            name: scrapedData.metadata.siteName || scrapedData.metadata.domain,
            domain: scrapedData.metadata.domain,
          },
          publishedAt: scrapedData.publishedAt,
          createdBy: input.userId,
          reviewStatus: 'PENDING_REVIEW',
        });

        return {
          success: true,
          content,
        };
      }

      // 否则只返回抓取的数据
      return {
        success: true,
        data: scrapedData,
      };
    } catch (error: any) {
      console.error('[Content Management] Import from URL error:', error);
      throw new Error(`URL导入失败: ${error.message}`);
    }
  }

  /**
   * 批量导入内容
   */
  async batchImport(input: BatchImportInput): Promise<BatchImport> {
    try {
      console.log(`[Content Management] Starting batch import: ${input.type}`);

      let urls: string[] = [];
      let items: Array<Partial<CreateContentInput>> = [];

      // 解析输入数据
      if (input.type === 'urls' && input.data.urls) {
        urls = input.data.urls;
      } else if (input.type === 'text' && input.data.text) {
        // 从文本中提取URLs（一行一个）
        urls = input.data.text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && this.isValidUrl(line));
      } else if (input.type === 'json' && input.data.items) {
        items = input.data.items;
      }

      const totalItems = urls.length + items.length;

      // 创建批量导入记录
      const batchImport = await prisma.batchImport.create({
        data: {
          importType: input.type,
          totalItems,
          status: 'processing',
          createdBy: input.userId,
        },
      });

      // 异步处理导入
      this.processBatchImport(batchImport.id, urls, items, input.options || {}, input.userId)
        .catch(error => {
          console.error('[Content Management] Batch import processing error:', error);
        });

      return batchImport;
    } catch (error: any) {
      console.error('[Content Management] Batch import error:', error);
      throw new Error(`批量导入失败: ${error.message}`);
    }
  }

  /**
   * 处理批量导入（异步）
   */
  private async processBatchImport(
    batchId: string,
    urls: string[],
    items: Array<Partial<CreateContentInput>>,
    options: NonNullable<BatchImportInput['options']>,
    userId: string
  ): Promise<void> {
    const results: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      // 处理URLs
      if (urls.length > 0) {
        const scrapedResults = await urlScraperService.scrapeMultipleURLs(urls);

        for (const result of scrapedResults) {
          try {
            if (result.success && result.data) {
              await this.createManualContent({
                title: result.data.title,
                description: result.data.description,
                content: result.data.content,
                url: result.url,
                category: options.defaultCategory,
                tags: options.defaultTags,
                customSource: {
                  name: result.data.metadata.siteName || result.data.metadata.domain,
                  domain: result.data.metadata.domain,
                },
                publishedAt: result.data.publishedAt,
                reviewStatus: options.autoApprove ? 'APPROVED' : 'PENDING_REVIEW',
                createdBy: userId,
              });

              successCount++;
              results.push({ url: result.url, success: true });
            } else {
              failedCount++;
              results.push({ url: result.url, success: false, error: result.error });
            }
          } catch (error: any) {
            failedCount++;
            results.push({ url: result.url, success: false, error: error.message });
          }
        }
      }

      // 处理直接传入的items
      for (const item of items) {
        try {
          await this.createManualContent({
            ...item,
            category: item.category || options.defaultCategory,
            tags: item.tags || options.defaultTags,
            reviewStatus: options.autoApprove ? 'APPROVED' : ('PENDING_REVIEW' as ContentReviewStatus),
            createdBy: userId,
          } as CreateContentInput);

          successCount++;
          results.push({ item, success: true });
        } catch (error: any) {
          failedCount++;
          results.push({ item, success: false, error: error.message });
        }
      }

      // 更新批量导入记录
      await prisma.batchImport.update({
        where: { id: batchId },
        data: {
          status: 'completed',
          successCount,
          failedCount,
          errorLog: results.filter(r => !r.success),
        },
      });

      console.log(`[Content Management] Batch import completed: ${successCount} success, ${failedCount} failed`);
    } catch (error: any) {
      console.error('[Content Management] Batch import processing error:', error);

      await prisma.batchImport.update({
        where: { id: batchId },
        data: {
          status: 'failed',
          successCount,
          failedCount,
          errorLog: { error: error.message, results },
        },
      });
    }
  }

  /**
   * 获取批量导入状态
   */
  async getBatchImportStatus(batchId: string): Promise<BatchImport | null> {
    try {
      return await prisma.batchImport.findUnique({
        where: { id: batchId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error: any) {
      console.error('[Content Management] Get batch import status error:', error);
      throw new Error(`获取批量导入状态失败: ${error.message}`);
    }
  }

  /**
   * 验证内容
   */
  async validateContent(input: Partial<CreateContentInput>): Promise<ValidationResult> {
    const issues: Array<{ field: string; message: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];
    const suggestions: string[] = [];

    // 必填字段检查
    if (!input.title || input.title.trim().length === 0) {
      issues.push({ field: 'title', message: '标题不能为空' });
    } else if (input.title.length < 10) {
      warnings.push({ field: 'title', message: '标题过短，建议至少10个字符' });
    }

    if (!input.description || input.description.trim().length === 0) {
      warnings.push({ field: 'description', message: '建议添加描述' });
    }

    if (!input.content || input.content.trim().length === 0) {
      warnings.push({ field: 'content', message: '建议添加正文内容' });
    }

    // URL检查
    if (input.url) {
      if (!this.isValidUrl(input.url)) {
        issues.push({ field: 'url', message: 'URL格式不正确' });
      } else {
        // 检查URL是否已存在
        const existing = await prisma.content.findFirst({
          where: { url: input.url },
        });

        if (existing) {
          warnings.push({ field: 'url', message: 'URL已存在，可能是重复内容' });
        }
      }
    }

    // 标签建议
    if (!input.tags || input.tags.length === 0) {
      suggestions.push('建议添加至少2-3个相关标签');
    }

    // 分类建议
    if (!input.category) {
      suggestions.push('建议选择适当的内容分类');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      suggestions,
    };
  }

  /**
   * 清理HTML内容
   */
  private sanitizeContent(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'u', 's', 'code', 'pre',
        'ul', 'ol', 'li',
        'a', 'img',
        'blockquote',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      allowedAttributes: {
        'a': ['href', 'target', 'rel'],
        'img': ['src', 'alt', 'width', 'height'],
        'code': ['class'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    });
  }

  /**
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取或创建自定义来源
   */
  private async getOrCreateCustomSource(name: string, domain: string): Promise<string> {
    try {
      // 查找现有来源
      let source = await prisma.source.findFirst({
        where: {
          OR: [
            { name },
            { url: { contains: domain } },
          ],
        },
      });

      // 如果不存在则创建
      if (!source) {
        source = await prisma.source.create({
          data: {
            name,
            url: `https://${domain}`,
            type: SourceType.MANUAL,
            status: SourceStatus.ACTIVE,
          },
        });
      }

      return source.id;
    } catch (error: any) {
      console.error('[Content Management] Get or create source error:', error);
      throw new Error(`获取或创建来源失败: ${error.message}`);
    }
  }
}

export default new ContentManagementService();

