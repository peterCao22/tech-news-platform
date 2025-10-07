/**
 * 搜索服务
 * 提供内容的全文搜索和索引管理功能
 */

import { prisma } from '@tech-news-platform/database';
import { ContentStatus, ContentType } from '@tech-news-platform/database';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  url?: string;
  imageUrl?: string;
  type: ContentType;
  category?: string;
  tags: string[];
  score?: number;
  publishedAt?: Date;
  createdAt: Date;
  source: {
    id: string;
    name: string;
    type: string;
  };
  relevanceScore: number; // 搜索相关性评分
  highlights?: {
    title?: string;
    description?: string;
    content?: string;
  };
}

export interface SearchFilters {
  type?: ContentType;
  category?: string;
  tags?: string[];
  sourceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxScore?: number;
  status?: ContentStatus;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'score' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  includeHighlights?: boolean;
}

export class SearchService {
  /**
   * 全文搜索内容
   */
  async searchContent(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<{
    results: SearchResult[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    searchTime: number;
  }> {
    const startTime = Date.now();
    const {
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeHighlights = true,
    } = options;

    const skip = (page - 1) * limit;

    // 构建搜索条件
    const searchConditions = this.buildSearchConditions(query, filters);
    
    // 执行搜索
    const [results, total] = await Promise.all([
      this.executeSearch(searchConditions, skip, limit, sortBy, sortOrder),
      this.countSearchResults(searchConditions),
    ]);

    // 计算相关性评分和高亮
    const processedResults = await this.processSearchResults(
      results,
      query,
      includeHighlights
    );

    const searchTime = Date.now() - startTime;

    return {
      results: processedResults,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchTime,
    };
  }

  /**
   * 构建搜索条件
   */
  private buildSearchConditions(query: string, filters: SearchFilters) {
    const conditions: any = {
      AND: [],
    };

    // 基本搜索条件
    if (query.trim()) {
      const searchTerms = query.trim().split(/\s+/);
      const searchCondition = {
        OR: [
          // 标题搜索
          {
            title: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
          // 描述搜索
          {
            description: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
          // 内容搜索
          {
            content: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
          // 关键词搜索
          {
            keywords: {
              hasSome: searchTerms,
            },
          },
          // 标签搜索
          {
            contentTags: {
              some: {
                tag: {
                  name: {
                    in: searchTerms,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
          },
        ],
      };
      conditions.AND.push(searchCondition);
    }

    // 应用过滤器
    if (filters.status) {
      conditions.AND.push({ status: filters.status });
    } else {
      // 默认只搜索已发布的内容
      conditions.AND.push({ status: ContentStatus.PUBLISHED });
    }

    if (filters.type) {
      conditions.AND.push({ type: filters.type });
    }

    if (filters.category) {
      conditions.AND.push({ category: filters.category });
    }

    if (filters.sourceId) {
      conditions.AND.push({ sourceId: filters.sourceId });
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.AND.push({
        contentTags: {
          some: {
            tag: {
              name: {
                in: filters.tags,
              },
            },
          },
        },
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateCondition: any = {};
      if (filters.dateFrom) {
        dateCondition.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        dateCondition.lte = filters.dateTo;
      }
      conditions.AND.push({ publishedAt: dateCondition });
    }

    if (filters.minScore !== undefined || filters.maxScore !== undefined) {
      const scoreCondition: any = {};
      if (filters.minScore !== undefined) {
        scoreCondition.gte = filters.minScore;
      }
      if (filters.maxScore !== undefined) {
        scoreCondition.lte = filters.maxScore;
      }
      conditions.AND.push({ score: scoreCondition });
    }

    return conditions;
  }

  /**
   * 执行搜索查询
   */
  private async executeSearch(
    conditions: any,
    skip: number,
    limit: number,
    sortBy: string,
    sortOrder: string
  ) {
    // 构建排序条件
    let orderBy: any[] = [];
    
    switch (sortBy) {
      case 'date':
        orderBy = [{ publishedAt: sortOrder }, { createdAt: sortOrder }];
        break;
      case 'score':
        orderBy = [{ score: sortOrder }];
        break;
      case 'popularity':
        orderBy = [{ viewCount: sortOrder }, { shareCount: sortOrder }];
        break;
      case 'relevance':
      default:
        // 相关性排序会在后处理中计算
        orderBy = [{ score: 'desc' }, { publishedAt: 'desc' }];
        break;
    }

    return prisma.content.findMany({
      where: conditions,
      skip,
      take: limit,
      orderBy,
      include: {
        source: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        contentTags: {
          include: {
            tag: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 计算搜索结果数量
   */
  private async countSearchResults(conditions: any): Promise<number> {
    return prisma.content.count({
      where: conditions,
    });
  }

  /**
   * 处理搜索结果（计算相关性和高亮）
   */
  private async processSearchResults(
    results: any[],
    query: string,
    includeHighlights: boolean
  ): Promise<SearchResult[]> {
    return results.map(result => {
      const relevanceScore = this.calculateRelevanceScore(result, query);
      const highlights = includeHighlights 
        ? this.generateHighlights(result, query)
        : undefined;

      return {
        id: result.id,
        title: result.title,
        description: result.description,
        summary: result.summary,
        url: result.url,
        imageUrl: result.imageUrl,
        type: result.type,
        category: result.category,
        tags: result.contentTags.map((ct: any) => ct.tag.name),
        score: result.score,
        publishedAt: result.publishedAt,
        createdAt: result.createdAt,
        source: result.source,
        relevanceScore,
        highlights,
      };
    });
  }

  /**
   * 计算搜索相关性评分
   */
  private calculateRelevanceScore(content: any, query: string): number {
    if (!query.trim()) return 0;

    const queryTerms = query.toLowerCase().split(/\s+/);
    let score = 0;

    // 标题匹配权重最高
    const titleMatches = this.countMatches(content.title?.toLowerCase() || '', queryTerms);
    score += titleMatches * 3;

    // 描述匹配
    const descriptionMatches = this.countMatches(content.description?.toLowerCase() || '', queryTerms);
    score += descriptionMatches * 2;

    // 内容匹配
    const contentMatches = this.countMatches(content.content?.toLowerCase() || '', queryTerms);
    score += contentMatches * 1;

    // 标签匹配
    const tagNames = content.contentTags.map((ct: any) => ct.tag.name.toLowerCase());
    const tagMatches = queryTerms.filter(term => 
      tagNames.some((tagName: string) => tagName.includes(term))
    ).length;
    score += tagMatches * 2;

    // 关键词匹配
    const keywordMatches = content.keywords?.filter((keyword: string) =>
      queryTerms.some(term => keyword.toLowerCase().includes(term))
    ).length || 0;
    score += keywordMatches * 1.5;

    // 归一化评分 (0-1)
    const maxPossibleScore = queryTerms.length * 10; // 假设最大可能评分
    return Math.min(score / maxPossibleScore, 1);
  }

  /**
   * 计算文本中查询词的匹配次数
   */
  private countMatches(text: string, queryTerms: string[]): number {
    return queryTerms.reduce((count, term) => {
      const matches = (text.match(new RegExp(term, 'gi')) || []).length;
      return count + matches;
    }, 0);
  }

  /**
   * 生成搜索高亮
   */
  private generateHighlights(content: any, query: string): {
    title?: string;
    description?: string;
    content?: string;
  } {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const highlights: any = {};

    // 高亮标题
    if (content.title) {
      highlights.title = this.highlightText(content.title, queryTerms);
    }

    // 高亮描述
    if (content.description) {
      highlights.description = this.highlightText(
        this.truncateText(content.description, 200),
        queryTerms
      );
    }

    // 高亮内容片段
    if (content.content) {
      const snippet = this.extractSnippet(content.content, queryTerms, 300);
      highlights.content = this.highlightText(snippet, queryTerms);
    }

    return highlights;
  }

  /**
   * 高亮文本中的查询词
   */
  private highlightText(text: string, queryTerms: string[]): string {
    let highlightedText = text;
    
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
  }

  /**
   * 提取包含查询词的文本片段
   */
  private extractSnippet(text: string, queryTerms: string[], maxLength: number): string {
    const lowerText = text.toLowerCase();
    
    // 找到第一个匹配的位置
    let firstMatchIndex = -1;
    for (const term of queryTerms) {
      const index = lowerText.indexOf(term.toLowerCase());
      if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
        firstMatchIndex = index;
      }
    }

    if (firstMatchIndex === -1) {
      return this.truncateText(text, maxLength);
    }

    // 以匹配位置为中心提取片段
    const start = Math.max(0, firstMatchIndex - Math.floor(maxLength / 2));
    const end = Math.min(text.length, start + maxLength);
    
    let snippet = text.substring(start, end);
    
    // 添加省略号
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 搜索建议（自动补全）
   */
  async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query.trim()) return [];

    const suggestions = new Set<string>();

    // 从标题中获取建议
    const titleSuggestions = await prisma.content.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
        status: ContentStatus.PUBLISHED,
      },
      select: { title: true },
      take: limit,
    });

    titleSuggestions.forEach(item => {
      const words = item.title.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.includes(query.toLowerCase()) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });

    // 从标签中获取建议
    const tagSuggestions = await prisma.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: { name: true },
      take: limit,
    });

    tagSuggestions.forEach(tag => {
      suggestions.add(tag.name);
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * 更新搜索索引
   */
  async updateSearchIndex(contentId: string): Promise<void> {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        contentTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!content) return;

    // 提取关键词
    const keywords = this.extractKeywords(content.title, content.content || '');
    
    // 生成搜索向量（简化版本，实际可以使用更复杂的向量化）
    const searchVector = this.generateSearchVector(content.title, content.description || '', content.content || '');

    // 更新或创建搜索索引
    await prisma.searchIndex.upsert({
      where: { contentId },
      update: {
        titleTokens: this.tokenize(content.title),
        contentTokens: this.tokenize(content.content || ''),
        keywords,
        updatedAt: new Date(),
      },
      create: {
        contentId,
        titleTokens: this.tokenize(content.title),
        contentTokens: this.tokenize(content.content || ''),
        keywords,
      },
    });

    // 更新内容的关键词字段
    await prisma.content.update({
      where: { id: contentId },
      data: {
        keywords,
        searchVector,
      },
    });
  }

  /**
   * 提取关键词
   */
  private extractKeywords(title: string, content?: string): string[] {
    const text = `${title} ${content || ''}`.toLowerCase();
    
    // 简单的关键词提取
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));

    // 统计词频
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 返回最常见的词
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * 文本分词
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  /**
   * 生成搜索向量
   */
  private generateSearchVector(title: string, description?: string, content?: string): string {
    // 简化的向量生成，实际应用中可以使用TF-IDF或其他算法
    const allText = `${title} ${description || ''} ${content || ''}`;
    const tokens = this.tokenize(allText);
    return tokens.join(' ');
  }

  /**
   * 检查是否为停用词
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      // 中文停用词
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很',
      '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'
    ]);

    return stopWords.has(word);
  }

  /**
   * 批量更新搜索索引
   */
  async batchUpdateSearchIndex(contentIds?: string[]): Promise<void> {
    const whereCondition = contentIds ? { id: { in: contentIds } } : {};
    
    const contents = await prisma.content.findMany({
      where: whereCondition,
      select: { id: true },
    });

    for (const content of contents) {
      await this.updateSearchIndex(content.id);
    }
  }
}
