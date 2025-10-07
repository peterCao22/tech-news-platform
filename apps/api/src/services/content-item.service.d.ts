/**
 * 内容管理服务
 * 提供内容的业务逻辑处理
 */
import { CreateContentItemData as CreateContentData, UpdateContentItemData as UpdateContentData, ContentSearchFilters, ContentWithRelations, DuplicationCheckResult } from '@tech-news-platform/database';
import { ContentStatus } from '@tech-news-platform/database';
export declare class ContentItemService {
    private contentRepository;
    private tagRepository;
    private contentTagRepository;
    constructor();
    /**
     * 获取内容列表
     */
    getContent(filters?: ContentSearchFilters, options?: {
        page?: number;
        limit?: number;
        orderBy?: any[];
        includeRelations?: boolean;
    }): Promise<{
        content: ContentWithRelations[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 根据ID获取内容
     */
    getContentById(id: string, includeRelations?: boolean): Promise<ContentWithRelations | null>;
    /**
     * 创建内容
     */
    createContent(data: CreateContentData, userId?: string): Promise<{
        title: string;
        content: string | null;
        summary: string | null;
        description: string | null;
        type: import("@tech-news-platform/database").$Enums.ContentType;
        id: string;
        url: string | null;
        status: import("@tech-news-platform/database").$Enums.ContentStatus;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        category: string | null;
        tags: string[];
        score: number | null;
        priority: number;
        sourceId: string;
        sourceUrl: string | null;
        publishedAt: Date | null;
        metadata: import("packages/database/dist/generated/runtime/library").JsonValue | null;
        author: string | null;
        contentHash: string | null;
        duplicateOf: string | null;
        keywords: string[];
        quality: number | null;
        relevance: number | null;
        searchVector: string | null;
        shareCount: number;
        titleHash: string | null;
        viewCount: number;
    }>;
    /**
     * 更新内容
     */
    updateContent(id: string, data: UpdateContentData, userId?: string): Promise<{
        title: string;
        content: string | null;
        summary: string | null;
        description: string | null;
        type: import("@tech-news-platform/database").$Enums.ContentType;
        id: string;
        url: string | null;
        status: import("@tech-news-platform/database").$Enums.ContentStatus;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        category: string | null;
        tags: string[];
        score: number | null;
        priority: number;
        sourceId: string;
        sourceUrl: string | null;
        publishedAt: Date | null;
        metadata: import("packages/database/dist/generated/runtime/library").JsonValue | null;
        author: string | null;
        contentHash: string | null;
        duplicateOf: string | null;
        keywords: string[];
        quality: number | null;
        relevance: number | null;
        searchVector: string | null;
        shareCount: number;
        titleHash: string | null;
        viewCount: number;
    }>;
    /**
     * 删除内容
     */
    deleteContent(id: string, userId?: string): Promise<void>;
    /**
     * 批量更新内容状态
     */
    updateContentStatus(ids: string[], status: ContentStatus, userId?: string): Promise<void>;
    /**
     * 为内容添加标签
     */
    addContentTags(contentId: string, tagIds?: string[], tagNames?: string[]): Promise<ContentWithRelations | null>;
    /**
     * 移除内容标签
     */
    removeContentTags(contentId: string, tagIds: string[]): Promise<void>;
    /**
     * 检查内容重复
     */
    checkDuplication(title: string, content?: string, url?: string): Promise<DuplicationCheckResult>;
    /**
     * 增加浏览次数
     */
    incrementViewCount(id: string): Promise<void>;
    /**
     * 增加分享次数
     */
    incrementShareCount(id: string): Promise<void>;
    /**
     * 获取统计信息
     */
    getStatistics(): Promise<{
        totalContent: number;
        contentByStatus: Record<ContentStatus, number>;
        contentByType: Record<import("@tech-news-platform/database").ContentType, number>;
        recentContent: number;
        duplicateContent: number;
    }>;
    /**
     * 搜索内容
     */
    searchContent(query: string, filters?: Partial<ContentSearchFilters>, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        content: ContentWithRelations[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 获取相关内容
     */
    getRelatedContent(contentId: string, limit?: number): Promise<ContentWithRelations[]>;
    /**
     * 获取热门内容
     */
    getPopularContent(timeRange?: 'day' | 'week' | 'month', limit?: number): Promise<ContentWithRelations[]>;
    /**
     * 获取最新内容
     */
    getLatestContent(limit?: number): Promise<ContentWithRelations[]>;
    /**
     * 按分类获取内容
     */
    getContentByCategory(category: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        content: ContentWithRelations[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 按标签获取内容
     */
    getContentByTags(tags: string[], options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        content: ContentWithRelations[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 获取待审核内容
     */
    getPendingContent(options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        content: ContentWithRelations[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 批量处理内容
     */
    batchProcessContent(action: 'approve' | 'reject' | 'archive', contentIds: string[], userId?: string): Promise<{
        processedCount: number;
        action: "approve" | "reject" | "archive";
        status: "PUBLISHED" | "REJECTED" | "ARCHIVED";
    }>;
}
