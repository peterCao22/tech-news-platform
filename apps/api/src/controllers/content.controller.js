import { contentRepository, ContentStatus } from '@tech-news-platform/database';
import { logger } from '../utils/logger';
export class ContentController {
    /**
     * 获取内容列表（支持分页和筛选）
     */
    getContents = async (req, res, next) => {
        try {
            const { page = 1, limit = 20, status, sourceId, category, tags, dateFrom, dateTo, search, orderBy = 'createdAt', orderDirection = 'desc' } = req.query;
            // 构建筛选条件
            const filter = {};
            if (status)
                filter.status = status;
            if (sourceId)
                filter.sourceId = sourceId;
            if (category)
                filter.category = category;
            if (tags) {
                filter.tags = Array.isArray(tags) ? tags : [tags];
            }
            if (dateFrom)
                filter.dateFrom = new Date(dateFrom);
            if (dateTo)
                filter.dateTo = new Date(dateTo);
            if (search)
                filter.search = search;
            // 构建分页选项
            const pagination = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100), // 限制最大每页数量
                orderBy: orderBy,
                orderDirection: orderDirection,
            };
            const result = await contentRepository.findMany(filter, pagination);
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * 根据ID获取内容详情
     */
    getContent = async (req, res, next) => {
        try {
            const { id } = req.params;
            const content = await contentRepository.findById(id);
            if (!content) {
                return res.status(404).json({
                    success: false,
                    code: 'CONTENT_NOT_FOUND',
                    message: 'Content not found'
                });
            }
            res.json({ success: true, data: content });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * 更新内容
     */
    updateContent = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { title, description, content, category, tags, status, score, priority, metadata } = req.body;
            // 检查内容是否存在
            const existingContent = await contentRepository.findById(id);
            if (!existingContent) {
                return res.status(404).json({
                    success: false,
                    code: 'CONTENT_NOT_FOUND',
                    message: 'Content not found'
                });
            }
            const updateData = {};
            if (title !== undefined)
                updateData.title = title;
            if (description !== undefined)
                updateData.description = description;
            if (content !== undefined)
                updateData.content = content;
            if (category !== undefined)
                updateData.category = category;
            if (tags !== undefined)
                updateData.tags = tags;
            if (status !== undefined)
                updateData.status = status;
            if (score !== undefined)
                updateData.score = score;
            if (priority !== undefined)
                updateData.priority = priority;
            if (metadata !== undefined)
                updateData.metadata = metadata;
            const updatedContent = await contentRepository.update(id, updateData);
            logger.info(`内容已更新: ${updatedContent.title} (${updatedContent.id})`);
            res.json({ success: true, data: updatedContent });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * 删除内容
     */
    deleteContent = async (req, res, next) => {
        try {
            const { id } = req.params;
            // 检查内容是否存在
            const existingContent = await contentRepository.findById(id);
            if (!existingContent) {
                return res.status(404).json({
                    success: false,
                    code: 'CONTENT_NOT_FOUND',
                    message: 'Content not found'
                });
            }
            await contentRepository.delete(id);
            logger.info(`内容已删除: ${existingContent.title} (${id})`);
            res.json({
                success: true,
                message: 'Content deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * 批量更新内容状态
     */
    batchUpdateStatus = async (req, res, next) => {
        try {
            const { ids, status } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'IDs array is required and cannot be empty'
                    }
                });
            }
            if (!Object.values(ContentStatus).includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid status value'
                    }
                });
            }
            const result = await contentRepository.updateManyStatus(ids, status);
            logger.info(`批量更新内容状态: ${result.count} 条内容更新为 ${status}`);
            res.json({
                success: true,
                data: {
                    updatedCount: result.count,
                    status
                }
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * 获取内容统计信息
     */
    getContentStats = async (req, res, next) => {
        try {
            const stats = await contentRepository.getStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * 搜索内容
     */
    searchContent = async (req, res, next) => {
        try {
            const { q: search, page = 1, limit = 20, status, category, tags, dateFrom, dateTo } = req.query;
            if (!search) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Search query is required'
                    }
                });
            }
            // 构建筛选条件
            const filter = { search: search };
            if (status)
                filter.status = status;
            if (category)
                filter.category = category;
            if (tags) {
                filter.tags = Array.isArray(tags) ? tags : [tags];
            }
            if (dateFrom)
                filter.dateFrom = new Date(dateFrom);
            if (dateTo)
                filter.dateTo = new Date(dateTo);
            // 构建分页选项
            const pagination = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100),
                orderBy: 'createdAt',
                orderDirection: 'desc',
            };
            const result = await contentRepository.findMany(filter, pagination);
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
                query: search,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * 获取最近内容
     */
    getRecentContent = async (req, res, next) => {
        try {
            const { hours = 24, limit = 50 } = req.query;
            const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
            const filter = {
                dateFrom: since,
                status: ContentStatus.PUBLISHED,
            };
            const pagination = {
                page: 1,
                limit: Math.min(parseInt(limit), 100),
                orderBy: 'createdAt',
                orderDirection: 'desc',
            };
            const result = await contentRepository.findMany(filter, pagination);
            res.json({
                success: true,
                data: result.data,
                meta: {
                    since,
                    hours: parseInt(hours),
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
export const contentController = new ContentController();
