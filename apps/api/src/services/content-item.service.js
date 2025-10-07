/**
 * 内容管理服务
 * 提供内容的业务逻辑处理
 */
import { ContentItemRepository } from '@tech-news-platform/database';
import { TagRepository, ContentTagRepository } from '@tech-news-platform/database';
import { prisma } from '@tech-news-platform/database';
import { ContentStatus } from '@tech-news-platform/database';
export class ContentItemService {
    contentRepository;
    tagRepository;
    contentTagRepository;
    constructor() {
        this.contentRepository = new ContentItemRepository(prisma);
        this.tagRepository = new TagRepository(prisma);
        this.contentTagRepository = new ContentTagRepository(prisma);
    }
    /**
     * 获取内容列表
     */
    async getContent(filters = {}, options = {}) {
        return this.contentRepository.findMany(filters, options);
    }
    /**
     * 根据ID获取内容
     */
    async getContentById(id, includeRelations = true) {
        return this.contentRepository.findById(id, includeRelations);
    }
    /**
     * 创建内容
     */
    async createContent(data, userId) {
        // 验证来源是否存在
        const sourceExists = await this.contentRepository.exists('source', { id: data.sourceId });
        if (!sourceExists) {
            throw new Error('指定的来源不存在');
        }
        return this.contentRepository.create(data, userId);
    }
    /**
     * 更新内容
     */
    async updateContent(id, data, userId) {
        return this.contentRepository.update(id, data, userId);
    }
    /**
     * 删除内容
     */
    async deleteContent(id, userId) {
        return this.contentRepository.delete(id, userId);
    }
    /**
     * 批量更新内容状态
     */
    async updateContentStatus(ids, status, userId) {
        return this.contentRepository.updateStatus(ids, status, userId);
    }
    /**
     * 为内容添加标签
     */
    async addContentTags(contentId, tagIds, tagNames) {
        const content = await this.contentRepository.findById(contentId, false);
        if (!content) {
            throw new Error('内容不存在');
        }
        const tagsToAdd = [];
        // 处理标签ID
        if (tagIds && tagIds.length > 0) {
            tagsToAdd.push(...tagIds);
        }
        // 处理标签名称（如果标签不存在则创建）
        if (tagNames && tagNames.length > 0) {
            for (const tagName of tagNames) {
                let tag = await this.tagRepository.findByName(tagName);
                if (!tag) {
                    // 创建新标签
                    const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    tag = await this.tagRepository.create({
                        name: tagName,
                        slug,
                        type: 'TOPIC', // 默认类型
                    });
                }
                tagsToAdd.push(tag.id);
            }
        }
        // 添加标签关联
        const addPromises = tagsToAdd.map(tagId => this.contentTagRepository.addTagToContent(contentId, tagId));
        await Promise.all(addPromises);
        // 更新标签使用次数
        const updateUsagePromises = tagsToAdd.map(tagId => this.tagRepository.incrementUsage(tagId));
        await Promise.all(updateUsagePromises);
        return this.contentRepository.findById(contentId, true);
    }
    /**
     * 移除内容标签
     */
    async removeContentTags(contentId, tagIds) {
        const content = await this.contentRepository.findById(contentId, false);
        if (!content) {
            throw new Error('内容不存在');
        }
        // 移除标签关联
        const removePromises = tagIds.map(tagId => this.contentTagRepository.removeTagFromContent(contentId, tagId));
        await Promise.all(removePromises);
        // 更新标签使用次数
        const updateUsagePromises = tagIds.map(tagId => this.tagRepository.decrementUsage(tagId));
        await Promise.all(updateUsagePromises);
    }
    /**
     * 检查内容重复
     */
    async checkDuplication(title, content, url) {
        return this.contentRepository.checkDuplication(title, content, url);
    }
    /**
     * 增加浏览次数
     */
    async incrementViewCount(id) {
        return this.contentRepository.incrementViewCount(id);
    }
    /**
     * 增加分享次数
     */
    async incrementShareCount(id) {
        return this.contentRepository.incrementShareCount(id);
    }
    /**
     * 获取统计信息
     */
    async getStatistics() {
        return this.contentRepository.getStatistics();
    }
    /**
     * 搜索内容
     */
    async searchContent(query, filters = {}, options = {}) {
        const searchFilters = {
            ...filters,
            search: query,
        };
        return this.contentRepository.findMany(searchFilters, options);
    }
    /**
     * 获取相关内容
     */
    async getRelatedContent(contentId, limit = 5) {
        const content = await this.contentRepository.findById(contentId, true);
        if (!content) {
            throw new Error('内容不存在');
        }
        // 基于标签和分类查找相关内容
        const filters = {
            status: ContentStatus.PUBLISHED,
        };
        // 如果有分类，优先按分类查找
        if (content.category) {
            filters.category = content.category;
        }
        // 如果有标签，按标签查找
        if (content.contentTags && content.contentTags.length > 0) {
            filters.tags = content.contentTags.map((ct) => ct.tag.name);
        }
        const result = await this.contentRepository.findMany(filters, {
            limit: limit + 1, // 多查一个，排除当前内容
            orderBy: [{ score: 'desc' }, { publishedAt: 'desc' }],
        });
        // 排除当前内容
        return result.content.filter(c => c.id !== contentId).slice(0, limit);
    }
    /**
     * 获取热门内容
     */
    async getPopularContent(timeRange = 'week', limit = 10) {
        const now = new Date();
        let dateFrom;
        switch (timeRange) {
            case 'day':
                dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        const filters = {
            status: ContentStatus.PUBLISHED,
            dateFrom,
        };
        const result = await this.contentRepository.findMany(filters, {
            limit,
            orderBy: [
                { viewCount: 'desc' },
                { shareCount: 'desc' },
                { score: 'desc' },
            ],
        });
        return result.content;
    }
    /**
     * 获取最新内容
     */
    async getLatestContent(limit = 10) {
        const filters = {
            status: ContentStatus.PUBLISHED,
        };
        const result = await this.contentRepository.findMany(filters, {
            limit,
            orderBy: [{ publishedAt: 'desc' }],
        });
        return result.content;
    }
    /**
     * 按分类获取内容
     */
    async getContentByCategory(category, options = {}) {
        const filters = {
            status: ContentStatus.PUBLISHED,
            category,
        };
        return this.contentRepository.findMany(filters, options);
    }
    /**
     * 按标签获取内容
     */
    async getContentByTags(tags, options = {}) {
        const filters = {
            status: ContentStatus.PUBLISHED,
            tags,
        };
        return this.contentRepository.findMany(filters, options);
    }
    /**
     * 获取待审核内容
     */
    async getPendingContent(options = {}) {
        const filters = {
            status: ContentStatus.PROCESSED,
        };
        return this.contentRepository.findMany(filters, {
            ...options,
            orderBy: [{ createdAt: 'asc' }], // 按创建时间升序，优先处理早期内容
        });
    }
    /**
     * 批量处理内容
     */
    async batchProcessContent(action, contentIds, userId) {
        let status;
        switch (action) {
            case 'approve':
                status = ContentStatus.PUBLISHED;
                break;
            case 'reject':
                status = ContentStatus.REJECTED;
                break;
            case 'archive':
                status = ContentStatus.ARCHIVED;
                break;
            default:
                throw new Error('无效的操作类型');
        }
        await this.contentRepository.updateStatus(contentIds, status, userId);
        return {
            processedCount: contentIds.length,
            action,
            status,
        };
    }
}
