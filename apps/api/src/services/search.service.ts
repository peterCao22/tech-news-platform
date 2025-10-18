/**
 * Story 4.2: 搜索服务
 * 
 * 提供全文搜索、高级筛选、结果高亮等功能
 */

import { prisma } from '@tech-news-platform/database';
import { searchQueryParser, ParseResult } from '../utils/search-query-parser';
import { ContentStatus } from '@tech-news-platform/database';

/**
 * 搜索查询参数
 */
export interface SearchQuery {
  query: string;                    // 搜索关键词
  filters?: SearchFilters;          // 筛选条件
  pagination?: SearchPagination;    // 分页参数
  sort?: SearchSort;                // 排序参数
}

/**
 * 搜索筛选条件
 */
export interface SearchFilters {
  dateRange?: {
    from?: Date | string;
    to?: Date | string;
    preset?: 'today' | '7days' | '30days' | '90days';
  };
  sourceIds?: string[];             // 来源ID
  categories?: string[];            // 分类
  stockCodes?: string[];            // 股票代码
  sentiment?: 'positive' | 'neutral' | 'negative' | 'all';
  scoreRange?: {
    min?: number;                   // 最小评分 0-100
    max?: number;                   // 最大评分 0-100
  };
  status?: ContentStatus;           // 内容状态
}

/**
 * 分页参数
 */
export interface SearchPagination {
  page: number;                     // 页码，从1开始
  limit: number;                    // 每页数量
}

/**
 * 排序参数
 */
export interface SearchSort {
  by: 'relevance' | 'date' | 'score';
  order: 'asc' | 'desc';
}

/**
 * 搜索结果
 */
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  category: string;
  tags: string[];
  source: {
    id: string;
    name: string;
    domain: string | null;
  };
  score: number;                    // AI评分
  sentiment: string | null;
  publishedAt: Date;
  createdAt: Date;
  
  // 搜索相关
  relevanceScore?: number;          // 相关性评分 0-1
  highlights?: {
    title?: string;
    description?: string;
    content?: string;
  };
}

/**
 * 搜索响应
 */
export interface SearchResponse {
  results: SearchResult[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  query: {
    original: string;
    parsed: string;
    tsquery: string;
    filters: SearchFilters;
  };
  performance: {
    searchTime: number;             // 搜索耗时（毫秒）
  };
}

/**
 * 筛选选项
 */
export interface FilterOptions {
  sources: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  categories: Array<{
    value: string;
    label: string;
    count: number;
  }>;
  stockCodes: string[];
  datePresets: Array<{
    value: string;
    label: string;
  }>;
}

/**
 * 搜索服务类
 */
export class SearchService {
  /**
   * 执行搜索
   */
  async searchContent(searchQuery: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      // 1. 解析搜索查询
      const parseResult = this.parseQuery(searchQuery.query);
      if (!parseResult.success || !parseResult.tsquery) {
        throw new Error(parseResult.error || '搜索查询解析失败');
      }
      
      // 2. 构建筛选条件
      const filters = searchQuery.filters || {};
      const pagination = searchQuery.pagination || { page: 1, limit: 20 };
      const sort = searchQuery.sort || { by: 'relevance', order: 'desc' };
      
      // 3. 计算日期范围
      const dateRange = this.calculateDateRange(filters.dateRange);
      
      // 4. 构建基础WHERE条件
      const baseConditions: any = {
        status: filters.status || ContentStatus.PROCESSED,
      };
      
      // 添加日期筛选
      if (dateRange) {
        baseConditions.publishedAt = {
          gte: dateRange.from,
          lte: dateRange.to,
        };
      }
      
      // 添加来源筛选
      if (filters.sourceIds && filters.sourceIds.length > 0) {
        baseConditions.sourceId = {
          in: filters.sourceIds,
        };
      }
      
      // 添加分类筛选
      if (filters.categories && filters.categories.length > 0) {
        baseConditions.category = {
          in: filters.categories,
        };
      }
      
      // 添加情感筛选
      if (filters.sentiment && filters.sentiment !== 'all') {
        baseConditions.sentiment = filters.sentiment;
      }
      
      // 添加评分筛选
      if (filters.scoreRange) {
        baseConditions.score = {};
        if (filters.scoreRange.min !== undefined) {
          baseConditions.score.gte = filters.scoreRange.min;
        }
        if (filters.scoreRange.max !== undefined) {
          baseConditions.score.lte = filters.scoreRange.max;
        }
      }
      
      // 5. 执行全文搜索查询
      const { results, total } = await this.executeFullTextSearch(
        parseResult.tsquery,
        baseConditions,
        pagination,
        sort
      );
      
      // 6. 高亮搜索结果
      const highlightedResults = await this.highlightResults(
        results,
        parseResult.tsquery
      );
      
      // 7. 计算总页数
      const totalPages = Math.ceil(total / pagination.limit);
      
      const searchTime = Date.now() - startTime;
      
      return {
        results: highlightedResults,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages,
        },
        query: {
          original: searchQuery.query,
          parsed: searchQueryParser.simplify(searchQuery.query),
          tsquery: parseResult.tsquery,
          filters,
        },
        performance: {
          searchTime,
        },
      };
    } catch (error) {
      console.error('[SearchService] 搜索失败:', error);
      throw error;
    }
  }

  /**
   * 解析搜索查询
   */
  private parseQuery(query: string): ParseResult {
    return searchQueryParser.parse(query);
  }

  /**
   * 计算日期范围
   */
  private calculateDateRange(
    dateRange?: SearchFilters['dateRange']
  ): { from: Date; to: Date } | null {
    if (!dateRange) return null;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 预设日期范围
    if (dateRange.preset) {
      let daysAgo = 0;
      
      switch (dateRange.preset) {
        case 'today':
          daysAgo = 0;
          break;
        case '7days':
          daysAgo = 7;
          break;
        case '30days':
          daysAgo = 30;
          break;
        case '90days':
          daysAgo = 90;
          break;
        default:
          daysAgo = 7;
      }
      
      const from = new Date(today);
      from.setDate(from.getDate() - daysAgo);
      
      return {
        from,
        to: now,
      };
    }
    
    // 自定义日期范围
    if (dateRange.from || dateRange.to) {
      return {
        from: dateRange.from ? new Date(dateRange.from) : new Date(0),
        to: dateRange.to ? new Date(dateRange.to) : now,
      };
    }
    
    return null;
  }

  /**
   * 执行全文搜索
   */
  private async executeFullTextSearch(
    tsquery: string,
    conditions: any,
    pagination: SearchPagination,
    sort: SearchSort
  ): Promise<{ results: SearchResult[]; total: number }> {
    const offset = (pagination.page - 1) * pagination.limit;
    
    // 构建排序SQL
    let orderByClause = '';
    if (sort.by === 'relevance') {
      orderByClause = 'relevance DESC, c.published_at DESC';
    } else if (sort.by === 'date') {
      orderByClause = `c.published_at ${sort.order.toUpperCase()}`;
    } else if (sort.by === 'score') {
      orderByClause = `c.score ${sort.order.toUpperCase()}, c.published_at DESC`;
    }
    
    // 构建WHERE条件SQL
    const whereClauses: string[] = [
      `c.search_vector @@ to_tsquery('english', $1)`,
      `c.status::text = $2`,
    ];
    const params: any[] = [tsquery, conditions.status];
    let paramIndex = 3;
    
    // 添加日期条件
    if (conditions.publishedAt) {
      whereClauses.push(`c.published_at >= $${paramIndex}`);
      params.push(conditions.publishedAt.gte);
      paramIndex++;
      
      whereClauses.push(`c.published_at <= $${paramIndex}`);
      params.push(conditions.publishedAt.lte);
      paramIndex++;
    }
    
    // 添加来源条件
    if (conditions.sourceId) {
      const sourceIds = conditions.sourceId.in;
      whereClauses.push(`c.source_id = ANY($${paramIndex}::text[])`);
      params.push(sourceIds);
      paramIndex++;
    }
    
    // 添加分类条件
    if (conditions.category) {
      const categories = conditions.category.in;
      whereClauses.push(`c.category = ANY($${paramIndex}::text[])`);
      params.push(categories);
      paramIndex++;
    }
    
    // 添加情感条件（暂不支持，数据库中无sentiment列）
    // if (conditions.sentiment) {
    //   whereClauses.push(`c.sentiment = $${paramIndex}`);
    //   params.push(conditions.sentiment);
    //   paramIndex++;
    // }
    
    // 添加评分条件
    if (conditions.score) {
      if (conditions.score.gte !== undefined) {
        whereClauses.push(`c.score >= $${paramIndex}`);
        params.push(conditions.score.gte);
        paramIndex++;
      }
      if (conditions.score.lte !== undefined) {
        whereClauses.push(`c.score <= $${paramIndex}`);
        params.push(conditions.score.lte);
        paramIndex++;
      }
    }
    
    const whereClause = whereClauses.join(' AND ');
    
    // 执行搜索查询
    const searchSQL = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.content,
        c.url,
        c.category,
        c.tags,
        c.score,
        c.published_at,
        c.created_at,
        s.id as "source_id",
        s.name as "source_name",
        s.url as "source_url",
        ts_rank(c.search_vector, to_tsquery('english', $1)) as relevance
      FROM content c
      LEFT JOIN sources s ON c.source_id = s.id
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;
    
    params.push(pagination.limit, offset);
    
    // 执行计数查询
    const countSQL = `
      SELECT COUNT(*) as count
      FROM content c
      WHERE ${whereClause}
    `;
    
    const [searchResults, countResults] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(searchSQL, ...params),
      prisma.$queryRawUnsafe<any[]>(countSQL, ...params.slice(0, paramIndex - 1)),
    ]);
    
    const total = parseInt(countResults[0]?.count || '0');
    
    // 转换结果格式
    const results: SearchResult[] = searchResults.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      content: row.content || '',
      url: row.url || '',
      category: row.category || '',
      tags: row.tags || [],
      source: {
        id: row.source_id || '',
        name: row.source_name || '',
        domain: row.source_url || null, // 使用url作为domain
      },
      score: parseFloat(row.score || '0'),
      sentiment: null, // 数据库中无此列，暂时返回null
      publishedAt: row.published_at,
      createdAt: row.created_at,
      relevanceScore: parseFloat(row.relevance || '0'),
    }));
    
    return { results, total };
  }

  /**
   * 高亮搜索结果
   */
  private async highlightResults(
    results: SearchResult[],
    tsquery: string
  ): Promise<SearchResult[]> {
    // 对每个结果进行高亮处理
    return results.map((result) => {
      // 简单的高亮实现：使用<mark>标签
      const highlightedResult = { ...result };
      
      // 这里可以使用PostgreSQL的ts_headline函数
      // 或者实现自定义的高亮逻辑
      // 为了简化，这里先返回原结果
      highlightedResult.highlights = {
        title: result.title,
        description: result.description ? this.truncateText(result.description, 200) : '',
        content: result.content ? this.truncateText(result.content, 300) : '',
      };
      
      return highlightedResult;
    });
  }

  /**
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 获取筛选选项
   */
  async getFilterOptions(): Promise<FilterOptions> {
    try {
      // 1. 获取来源列表及其内容数量
      const sources = await prisma.$queryRaw<Array<{
        id: string;
        name: string;
        count: bigint;
      }>>`
        SELECT 
          s.id,
          s.name,
          COUNT(c.id) as count
        FROM sources s
        LEFT JOIN content c ON s.id = c.source_id AND c.status::text = ${ContentStatus.PROCESSED}
        GROUP BY s.id, s.name
        HAVING COUNT(c.id) > 0
        ORDER BY count DESC
        LIMIT 50
      `;
      
      // 2. 获取分类列表及其内容数量
      const categories = await prisma.$queryRaw<Array<{
        category: string;
        count: bigint;
      }>>`
        SELECT 
          category,
          COUNT(*) as count
        FROM content
        WHERE status::text = ${ContentStatus.PROCESSED}
          AND category IS NOT NULL
          AND category != ''
        GROUP BY category
        ORDER BY count DESC
      `;
      
      // 3. 获取常用股票代码（从tags中提取）
      const stockCodesResult = await prisma.$queryRaw<Array<{
        tag: string;
      }>>`
        SELECT DISTINCT unnest(tags) as tag
        FROM content
        WHERE status::text = ${ContentStatus.PROCESSED}
          AND tags IS NOT NULL
          AND array_length(tags, 1) > 0
        LIMIT 100
      `;
      
      // 筛选出看起来像股票代码的tags（通常是大写字母，2-5个字符）
      const stockCodes = stockCodesResult
        .map(r => r.tag)
        .filter(tag => /^[A-Z]{2,5}$/.test(tag))
        .slice(0, 20);
      
      // 4. 日期预设选项
      const datePresets = [
        { value: 'today', label: '今天' },
        { value: '7days', label: '近7天' },
        { value: '30days', label: '近30天' },
        { value: '90days', label: '近90天' },
      ];
      
      return {
        sources: sources.map(s => ({
          id: s.id,
          name: s.name,
          count: Number(s.count),
        })),
        categories: categories.map(c => ({
          name: c.category,
          count: Number(c.count),
        })),
        stockCodes,
        datePresets,
      };
    } catch (error) {
      console.error('[SearchService] 获取筛选选项失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const searchService = new SearchService();
