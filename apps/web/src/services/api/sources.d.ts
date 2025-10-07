export interface Source {
    id: string;
    name: string;
    type: 'RSS' | 'API' | 'AI_QUERY' | 'EMAIL' | 'MANUAL';
    url?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'RATE_LIMITED';
    config?: any;
    lastFetchAt?: string;
    fetchCount: number;
    errorCount: number;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateSourceData {
    name: string;
    type: 'RSS' | 'API' | 'AI_QUERY' | 'EMAIL' | 'MANUAL';
    url?: string;
    config?: any;
}
export interface UpdateSourceData {
    name?: string;
    url?: string;
    config?: any;
    status?: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'RATE_LIMITED';
}
export interface SourceStats {
    total: number;
    active: number;
    error: number;
    byType: Record<string, number>;
}
export interface ValidationResult {
    valid: boolean;
    title?: string;
    description?: string;
    itemCount?: number;
    error?: string;
}
export declare const sourcesApi: {
    getSources(params?: {
        type?: string;
        status?: string;
    }): Promise<import("@/lib/api").ApiResponse<Source[]>>;
    getSource(id: string): Promise<import("@/lib/api").ApiResponse<Source>>;
    createSource(data: CreateSourceData): Promise<import("@/lib/api").ApiResponse<Source>>;
    updateSource(id: string, data: UpdateSourceData): Promise<import("@/lib/api").ApiResponse<Source>>;
    deleteSource(id: string): Promise<import("@/lib/api").ApiResponse<{
        message: string;
    }>>;
    validateRSSUrl(url: string): Promise<import("@/lib/api").ApiResponse<ValidationResult>>;
    fetchSource(id: string): Promise<import("@/lib/api").ApiResponse<{
        sourceId: string;
        sourceName: string;
        success: boolean;
        newItemsCount: number;
        error?: string;
    }>>;
    fetchAllSources(): Promise<import("@/lib/api").ApiResponse<{
        totalSources: number;
        successCount: number;
        totalNewItems: number;
        errors: Array<{
            sourceId: string;
            error: string;
        }>;
    }>>;
    getSourceStats(): Promise<import("@/lib/api").ApiResponse<{
        sources: SourceStats;
        content: any;
    }>>;
    getSourceContent(id: string, params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<import("@/lib/api").ApiResponse<{
        data: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>>;
};
