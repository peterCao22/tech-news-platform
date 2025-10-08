import { Content, ContentStatus, Prisma } from '../generated';
export interface CreateContentData {
    title: string;
    description?: string;
    content?: string;
    url?: string;
    imageUrl?: string;
    category?: string;
    tags?: string[];
    sourceId: string;
    sourceUrl?: string;
    publishedAt?: Date;
    metadata?: Prisma.InputJsonValue;
}
export interface UpdateContentData {
    title?: string;
    description?: string;
    content?: string;
    url?: string;
    imageUrl?: string;
    category?: string;
    tags?: string[];
    status?: ContentStatus;
    score?: number;
    priority?: number;
    metadata?: Prisma.InputJsonValue;
}
export interface ContentFilter {
    status?: ContentStatus;
    sourceId?: string;
    category?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
    orderBy?: 'createdAt' | 'publishedAt' | 'score' | 'priority';
    orderDirection?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class ContentRepository {
    /**
     * 创建新内容
     */
    create(data: CreateContentData): Promise<Content>;
    /**
     * 批量创建内容
     */
    createMany(dataList: CreateContentData[]): Promise<{
        count: number;
    }>;
    /**
     * 根据ID获取内容
     */
    findById(id: string): Promise<Content | null>;
    /**
     * 分页获取内容列表
     */
    findMany(filter?: ContentFilter, pagination?: PaginationOptions): Promise<PaginatedResult<Content>>;
    /**
     * 更新内容
     */
    update(id: string, data: UpdateContentData): Promise<Content>;
    /**
     * 删除内容
     */
    delete(id: string): Promise<Content>;
    /**
     * 检查内容是否已存在（基于URL或标题）
     */
    findDuplicate(title: string, url?: string): Promise<Content | null>;
    /**
     * 获取最近的内容（用于去重检查）
     */
    findRecent(sourceId: string, hours?: number): Promise<Content[]>;
    /**
     * 获取内容统计信息
     */
    getStats(): Promise<{
        total: number;
        byStatus: Record<ContentStatus, number>;
        bySource: Array<{
            sourceId: string;
            sourceName: string;
            count: number;
        }>;
        recentCount: number;
    }>;
    /**
     * 更新内容状态
     */
    updateStatus(id: string, status: ContentStatus): Promise<Content>;
    /**
     * 批量更新内容状态
     */
    updateManyStatus(ids: string[], status: ContentStatus): Promise<{
        count: number;
    }>;
}
export declare const contentRepository: ContentRepository;
