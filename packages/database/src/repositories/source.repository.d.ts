import { Source, SourceType, SourceStatus, Prisma } from '../generated';
export interface CreateSourceData {
    name: string;
    type: SourceType;
    url?: string;
    config?: Prisma.InputJsonValue;
    status?: SourceStatus;
}
export interface UpdateSourceData {
    name?: string;
    url?: string;
    config?: Prisma.InputJsonValue;
    status?: SourceStatus;
    lastFetchAt?: Date;
    fetchCount?: number;
    errorCount?: number;
    lastError?: string | null;
}
export interface SourceFilter {
    type?: SourceType;
    status?: SourceStatus;
    enabled?: boolean;
}
export declare class SourceRepository {
    /**
     * 创建新的信息源
     */
    create(data: CreateSourceData): Promise<Source>;
    /**
     * 根据ID获取信息源
     */
    findById(id: string): Promise<Source | null>;
    /**
     * 获取所有信息源（支持筛选）
     */
    findMany(filter?: SourceFilter): Promise<Source[]>;
    /**
     * 获取活跃的RSS源
     */
    findActiveRssSources(): Promise<Source[]>;
    /**
     * 更新信息源
     */
    update(id: string, data: UpdateSourceData): Promise<Source>;
    /**
     * 删除信息源
     */
    delete(id: string): Promise<Source>;
    /**
     * 更新抓取统计信息
     */
    updateFetchStats(id: string, success: boolean, error?: string): Promise<Source>;
    /**
     * 获取源统计信息
     */
    getStats(): Promise<{
        total: number;
        active: number;
        error: number;
        byType: Record<SourceType, number>;
    }>;
}
export declare const sourceRepository: SourceRepository;
