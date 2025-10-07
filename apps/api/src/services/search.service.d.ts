/**
 * 搜索服务
 * 提供内容的全文搜索和索引管理功能
 */
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
    relevanceScore: number;
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
export declare class SearchService {
    /**
     * 全文搜索内容
     */
    searchContent(query: string, filters?: SearchFilters, options?: SearchOptions): Promise<{
        results: SearchResult[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        searchTime: number;
    }>;
    /**
     * 构建搜索条件
     */
    private buildSearchConditions;
    /**
     * 执行搜索查询
     */
    private executeSearch;
    /**
     * 计算搜索结果数量
     */
    private countSearchResults;
    /**
     * 处理搜索结果（计算相关性和高亮）
     */
    private processSearchResults;
    /**
     * 计算搜索相关性评分
     */
    private calculateRelevanceScore;
    /**
     * 计算文本中查询词的匹配次数
     */
    private countMatches;
    /**
     * 生成搜索高亮
     */
    private generateHighlights;
    /**
     * 高亮文本中的查询词
     */
    private highlightText;
    /**
     * 提取包含查询词的文本片段
     */
    private extractSnippet;
    /**
     * 截断文本
     */
    private truncateText;
    /**
     * 转义正则表达式特殊字符
     */
    private escapeRegex;
    /**
     * 搜索建议（自动补全）
     */
    getSearchSuggestions(query: string, limit?: number): Promise<string[]>;
    /**
     * 更新搜索索引
     */
    updateSearchIndex(contentId: string): Promise<void>;
    /**
     * 提取关键词
     */
    private extractKeywords;
    /**
     * 文本分词
     */
    private tokenize;
    /**
     * 生成搜索向量
     */
    private generateSearchVector;
    /**
     * 检查是否为停用词
     */
    private isStopWord;
    /**
     * 批量更新搜索索引
     */
    batchUpdateSearchIndex(contentIds?: string[]): Promise<void>;
}
