/**
 * 内容标签关联仓库 - 管理内容和标签的多对多关系
 */
import { PrismaClient, ContentTag } from '../generated';
import { BaseRepository } from './base.repository';
export interface CreateContentTagData {
    contentId: string;
    tagId: string;
    relevance?: number;
}
export declare class ContentTagRepository extends BaseRepository {
    constructor(prisma: PrismaClient);
    /**
     * 为内容添加标签
     */
    addTagToContent(contentId: string, tagId: string, relevance?: number): Promise<ContentTag>;
    /**
     * 从内容中移除标签
     */
    removeTagFromContent(contentId: string, tagId: string): Promise<void>;
    /**
     * 获取内容的所有标签
     */
    getContentTags(contentId: string): Promise<ContentTag[]>;
    /**
     * 获取标签的所有内容
     */
    getTagContents(tagId: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        contentTags: ContentTag[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 批量添加标签到内容
     */
    batchAddTagsToContent(contentId: string, tagIds: string[]): Promise<ContentTag[]>;
    /**
     * 批量移除内容的标签
     */
    batchRemoveTagsFromContent(contentId: string, tagIds: string[]): Promise<void>;
    /**
     * 更新内容标签的相关性
     */
    updateRelevance(contentId: string, tagId: string, relevance: number): Promise<ContentTag>;
    /**
     * 检查内容是否有指定标签
     */
    hasTag(contentId: string, tagId: string): Promise<boolean>;
    /**
     * 获取内容标签统计
     */
    getContentTagStats(contentId: string): Promise<{
        totalTags: number;
        tagsByType: Record<string, number>;
        averageRelevance: number;
    }>;
    /**
     * 获取标签使用统计
     */
    getTagUsageStats(tagId: string): Promise<{
        totalContent: number;
        averageRelevance: number;
        recentUsage: number;
    }>;
    /**
     * 查找相似内容（基于共同标签）
     */
    findSimilarContent(contentId: string, limit?: number): Promise<{
        contentId: string;
        similarity: number;
        commonTags: number;
    }[]>;
    /**
     * 清理孤立的内容标签关联
     */
    cleanupOrphanedAssociations(): Promise<number>;
    /**
     * 获取热门标签组合
     */
    getPopularTagCombinations(limit?: number): Promise<{
        tags: string[];
        count: number;
    }[]>;
}
