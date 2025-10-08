/**
 * 内容仓库 - 管理内容的CRUD操作、去重、搜索和版本控制
 */
import { PrismaClient, Content, ContentStatus, ContentType, Prisma } from '../generated';
import { BaseRepository } from './base.repository';
export interface CreateContentData {
    title: string;
    description?: string;
    content?: string;
    summary?: string;
    url?: string;
    imageUrl?: string;
    type?: ContentType;
    category?: string;
    tags?: string[];
    sourceId: string;
    sourceUrl?: string;
    publishedAt?: Date;
    author?: string;
    metadata?: any;
}
export interface UpdateContentData {
    title?: string;
    description?: string;
    content?: string;
    summary?: string;
    url?: string;
    imageUrl?: string;
    type?: ContentType;
    category?: string;
    tags?: string[];
    status?: ContentStatus;
    score?: number;
    priority?: number;
    quality?: number;
    relevance?: number;
    author?: string;
    metadata?: any;
}
export interface ContentSearchFilters {
    status?: ContentStatus;
    type?: ContentType;
    category?: string;
    tags?: string[];
    sourceId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    minScore?: number;
    maxScore?: number;
    priority?: number;
}
export interface ContentWithRelations extends Content {
    source?: any;
    contentTags?: any[];
    reviews?: any[];
    versions?: any[];
    _count?: {
        contentTags: number;
        reviews: number;
        versions: number;
    };
}
export interface DuplicationCheckResult {
    isDuplicate: boolean;
    duplicateId?: string;
    similarity?: number;
    method?: string;
}
export declare class ContentItemRepository extends BaseRepository {
    constructor(prisma: PrismaClient);
    /**
     * 创建内容哈希
     */
    private createContentHash;
    /**
     * 创建标题哈希
     */
    private createTitleHash;
    /**
     * 检查内容是否重复
     */
    checkDuplication(title: string, content?: string, url?: string): Promise<DuplicationCheckResult>;
    /**
     * 计算标题相似度（简单的Jaccard相似度）
     */
    private calculateTitleSimilarity;
    /**
     * 创建内容
     */
    create(data: CreateContentData, userId?: string): Promise<Content>;
    /**
     * 根据ID获取内容
     */
    findById(id: string, includeRelations?: boolean): Promise<ContentWithRelations | null>;
    /**
     * 获取内容列表
     */
    findMany(filters?: ContentSearchFilters, options?: {
        page?: number;
        limit?: number;
        orderBy?: Prisma.ContentOrderByWithRelationInput[];
        includeRelations?: boolean;
    }): Promise<{
        content: ContentWithRelations[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 更新内容
     */
    update(id: string, data: UpdateContentData, userId?: string): Promise<Content>;
    /**
     * 删除内容
     */
    delete(id: string, userId?: string): Promise<void>;
    /**
     * 批量更新内容状态
     */
    updateStatus(ids: string[], status: ContentStatus, userId?: string): Promise<void>;
    /**
     * 增加浏览次数
     */
    incrementViewCount(id: string): Promise<void>;
    /**
     * 增加分享次数
     */
    incrementShareCount(id: string): Promise<void>;
    /**
     * 创建版本记录
     */
    private createVersion;
    /**
     * 创建审计日志
     */
    private createAuditLog;
    /**
     * 获取内容统计信息
     */
    getStatistics(): Promise<{
        totalContent: number;
        contentByStatus: Record<ContentStatus, number>;
        contentByType: Record<ContentType, number>;
        recentContent: number;
        duplicateContent: number;
    }>;
}
