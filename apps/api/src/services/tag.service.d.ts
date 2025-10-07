/**
 * 标签管理服务
 * 提供标签的业务逻辑处理
 */
import { CreateTagData, UpdateTagData, TagSearchFilters, TagWithUsage } from '@tech-news-platform/database';
import { TagType } from '@tech-news-platform/database';
export declare class TagService {
    private tagRepository;
    constructor();
    /**
     * 获取标签列表
     */
    getTags(filters?: TagSearchFilters, options?: {
        page?: number;
        limit?: number;
        orderBy?: any[];
    }): Promise<{
        tags: TagWithUsage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 根据ID获取标签
     */
    getTagById(id: string): Promise<TagWithUsage | null>;
    /**
     * 创建标签
     */
    createTag(data: CreateTagData): Promise<{
        description: string | null;
        type: import("@tech-news-platform/database").$Enums.TagType;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        color: string | null;
        parentId: string | null;
        usageCount: number;
    }>;
    /**
     * 更新标签
     */
    updateTag(id: string, data: UpdateTagData): Promise<{
        description: string | null;
        type: import("@tech-news-platform/database").$Enums.TagType;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        color: string | null;
        parentId: string | null;
        usageCount: number;
    }>;
    /**
     * 删除标签
     */
    deleteTag(id: string): Promise<void>;
    /**
     * 获取根标签
     */
    getRootTags(type?: TagType): Promise<TagWithUsage[]>;
    /**
     * 获取子标签
     */
    getChildTags(parentId: string): Promise<TagWithUsage[]>;
    /**
     * 获取标签路径
     */
    getTagPath(tagId: string): Promise<{
        description: string | null;
        type: import("@tech-news-platform/database").$Enums.TagType;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        color: string | null;
        parentId: string | null;
        usageCount: number;
    }[]>;
    /**
     * 获取热门标签
     */
    getPopularTags(limit?: number, type?: TagType): Promise<TagWithUsage[]>;
    /**
     * 搜索标签建议
     */
    searchSuggestions(query: string, limit?: number, type?: TagType): Promise<{
        description: string | null;
        type: import("@tech-news-platform/database").$Enums.TagType;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        color: string | null;
        parentId: string | null;
        usageCount: number;
    }[]>;
    /**
     * 获取标签统计信息
     */
    getStatistics(): Promise<{
        totalTags: number;
        tagsByType: Record<TagType, number>;
        topTags: TagWithUsage[];
        unusedTags: number;
    }>;
    /**
     * 批量创建标签
     */
    batchCreateTags(tags: CreateTagData[]): Promise<{
        success: {
            description: string | null;
            type: import("@tech-news-platform/database").$Enums.TagType;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            color: string | null;
            parentId: string | null;
            usageCount: number;
        }[];
        errors: {
            tagData: CreateTagData;
            error: string;
        }[];
        successCount: number;
        errorCount: number;
    }>;
    /**
     * 更新所有标签的使用次数
     */
    updateAllUsageCounts(): Promise<void>;
    /**
     * 获取标签树结构
     */
    getTagTree(type?: TagType): Promise<TagWithUsage[]>;
    /**
     * 合并标签
     */
    mergeTags(sourceTagId: string, targetTagId: string): Promise<void>;
    /**
     * 清理未使用的标签
     */
    cleanupUnusedTags(): Promise<{
        deletedCount: number;
        deletedTags: string[];
    }>;
    /**
     * 根据内容自动建议标签
     */
    suggestTagsForContent(title: string, content?: string, category?: string): Promise<TagWithUsage[]>;
    /**
     * 从文本中提取关键词
     */
    private extractKeywords;
    /**
     * 检查是否为停用词
     */
    private isStopWord;
}
