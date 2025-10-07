export interface Content {
    id: string;
    title: string;
    description?: string;
    content?: string;
    url?: string;
    imageUrl?: string;
    category?: string;
    tags: string[];
    status: 'RAW' | 'PROCESSING' | 'PROCESSED' | 'REVIEWED' | 'PUBLISHED' | 'REJECTED';
    score?: number;
    priority: number;
    sourceId: string;
    sourceUrl?: string;
    publishedAt?: string;
    viewCount?: number;
    shareCount?: number;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
    source: {
        id: string;
        name: string;
        type: string;
    };
}
export interface ContentFilter {
    status?: string;
    sourceId?: string;
    category?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'publishedAt' | 'createdAt' | 'title' | 'score';
    sortOrder?: 'asc' | 'desc';
    excludeId?: string;
    page?: number;
    limit?: number;
}
export interface ContentStats {
    total: number;
    byStatus: Record<string, number>;
    bySource: Array<{
        sourceId: string;
        sourceName: string;
        count: number;
    }>;
    recentCount: number;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare const contentApi: {
    getContents(filters?: ContentFilter): Promise<import("@/lib/api").ApiResponse<Content[]>>;
    getContent(id: string): Promise<import("@/lib/api").ApiResponse<Content>>;
    getRecentContent(sourceId?: string, hours?: number): Promise<import("@/lib/api").ApiResponse<Content[]>>;
    searchContent(query: string, page?: number, limit?: number): Promise<import("@/lib/api").ApiResponse<{
        data: Content[];
        pagination: PaginationInfo;
    }>>;
    updateContentStatus(id: string, status: string): Promise<import("@/lib/api").ApiResponse<Content>>;
    batchUpdateContentStatus(ids: string[], status: string): Promise<import("@/lib/api").ApiResponse<{
        data: Content[];
        message: string;
    }>>;
    updateContent(id: string, data: Partial<Content>): Promise<import("@/lib/api").ApiResponse<Content>>;
    deleteContent(id: string): Promise<import("@/lib/api").ApiResponse<{
        message: string;
    }>>;
    getContentStats(): Promise<import("@/lib/api").ApiResponse<ContentStats>>;
    incrementViewCount(id: string): Promise<import("@/lib/api").ApiResponse<{
        message: string;
    }>>;
    incrementShareCount(id: string): Promise<import("@/lib/api").ApiResponse<{
        message: string;
    }>>;
    getTrendingContent(limit?: number): Promise<import("@/lib/api").ApiResponse<Content[]>>;
    getRelatedContent(id: string, limit?: number): Promise<import("@/lib/api").ApiResponse<Content[]>>;
};
