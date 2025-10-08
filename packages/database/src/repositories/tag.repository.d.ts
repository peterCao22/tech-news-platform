/**
 * 标签仓库 - 管理标签的CRUD操作
 * 支持层级标签结构和使用统计
 */
import { PrismaClient, Tag, TagType, Prisma } from '../generated';
import { BaseRepository } from './base.repository';
export interface CreateTagData {
    name: string;
    slug: string;
    type: TagType;
    description?: string;
    color?: string;
    parentId?: string;
}
export interface UpdateTagData {
    name?: string;
    slug?: string;
    type?: TagType;
    description?: string;
    color?: string;
    parentId?: string;
}
export interface TagSearchFilters {
    type?: TagType;
    parentId?: string;
    search?: string;
    hasParent?: boolean;
}
export interface TagWithUsage extends Tag {
    _count?: {
        contentTags: number;
        children: number;
    };
}
export declare class TagRepository extends BaseRepository {
    constructor(prisma: PrismaClient);
    /**
     * 创建新标签
     */
    create(data: CreateTagData): Promise<Tag>;
    /**
     * 根据ID获取标签
     */
    findById(id: string): Promise<TagWithUsage | null>;
    /**
     * 根据名称获取标签
     */
    findByName(name: string): Promise<Tag | null>;
    /**
     * 根据标识符获取标签
     */
    findBySlug(slug: string): Promise<Tag | null>;
    /**
     * 获取标签列表
     */
    findMany(filters?: TagSearchFilters, options?: {
        page?: number;
        limit?: number;
        orderBy?: Prisma.TagOrderByWithRelationInput[];
    }): Promise<{
        tags: TagWithUsage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 获取根标签（没有父标签的标签）
     */
    findRootTags(type?: TagType): Promise<TagWithUsage[]>;
    /**
     * 获取标签的子标签
     */
    findChildren(parentId: string): Promise<TagWithUsage[]>;
    /**
     * 获取标签路径（从根到当前标签）
     */
    getTagPath(tagId: string): Promise<Tag[]>;
    /**
     * 更新标签
     */
    update(id: string, data: UpdateTagData): Promise<Tag>;
    /**
     * 增加标签使用次数
     */
    incrementUsage(tagId: string): Promise<void>;
    /**
     * 减少标签使用次数
     */
    decrementUsage(tagId: string): Promise<void>;
    /**
     * 批量更新标签使用次数
     */
    updateUsageCounts(): Promise<void>;
    /**
     * 删除标签
     */
    delete(id: string): Promise<void>;
    /**
     * 获取热门标签
     */
    getPopularTags(limit?: number, type?: TagType): Promise<TagWithUsage[]>;
    /**
     * 搜索标签建议
     */
    searchSuggestions(query: string, limit?: number, type?: TagType): Promise<Tag[]>;
    /**
     * 获取标签统计信息
     */
    getStatistics(): Promise<{
        totalTags: number;
        tagsByType: Record<TagType, number>;
        topTags: TagWithUsage[];
        unusedTags: number;
    }>;
}
