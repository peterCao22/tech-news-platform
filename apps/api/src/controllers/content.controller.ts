import { Request, Response, NextFunction } from 'express';
import { 
  contentRepository, 
  ContentStatus,
  UpdateContentData 
} from '@tech-news-platform/database';
import { logger } from '../utils/logger';

export class ContentController {
  /**
   * 获取内容列表（支持分页和筛选）
   */
  public getContents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        sourceId, 
        category, 
        tags, 
        dateFrom, 
        dateTo, 
        search,
        orderBy = 'createdAt',
        orderDirection = 'desc'
      } = req.query;

      // 构建筛选条件
      const filter: any = {};
      if (status) filter.status = status as ContentStatus;
      if (sourceId) filter.sourceId = sourceId as string;
      if (category) filter.category = category as string;
      if (tags) {
        filter.tags = Array.isArray(tags) ? tags as string[] : [tags as string];
      }
      if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
      if (dateTo) filter.dateTo = new Date(dateTo as string);
      if (search) filter.search = search as string;

      // 构建分页选项
      const pagination = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100), // 限制最大每页数量
        orderBy: orderBy as 'createdAt' | 'publishedAt' | 'score' | 'priority',
        orderDirection: orderDirection as 'asc' | 'desc',
      };

      const result = await contentRepository.findMany(filter, pagination);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 根据ID获取内容详情
   */
  public getContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const content = await contentRepository.findById(id);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          error: { code: 'CONTENT_NOT_FOUND', message: 'Content not found' }
        });
      }
      
      res.json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 更新内容
   */
  public updateContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { 
        title, 
        description, 
        content, 
        category, 
        tags, 
        status, 
        score, 
        priority,
        metadata 
      } = req.body;

      // 检查内容是否存在
      const existingContent = await contentRepository.findById(id);
      if (!existingContent) {
        return res.status(404).json({
          success: false,
          error: { code: 'CONTENT_NOT_FOUND', message: 'Content not found' }
        });
      }

      const updateData: UpdateContentData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (content !== undefined) updateData.content = content;
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;
      if (status !== undefined) updateData.status = status as ContentStatus;
      if (score !== undefined) updateData.score = score;
      if (priority !== undefined) updateData.priority = priority;
      if (metadata !== undefined) updateData.metadata = metadata;

      const updatedContent = await contentRepository.update(id, updateData);
      
      logger.info(`内容已更新: ${updatedContent.title} (${updatedContent.id})`);
      
      res.json({ success: true, data: updatedContent });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 删除内容
   */
  public deleteContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // 检查内容是否存在
      const existingContent = await contentRepository.findById(id);
      if (!existingContent) {
        return res.status(404).json({
          success: false,
          error: { code: 'CONTENT_NOT_FOUND', message: 'Content not found' }
        });
      }

      await contentRepository.delete(id);
      
      logger.info(`内容已删除: ${existingContent.title} (${id})`);
      
      res.json({ 
        success: true, 
        message: 'Content deleted successfully' 
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 批量更新内容状态
   */
  public batchUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取内容统计信息
   */
  public getContentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await contentRepository.getStats();
      
      res.json({ 
        success: true, 
        data: stats 
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 搜索内容
   */
  public searchContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        q: search, 
        page = 1, 
        limit = 20,
        status,
        category,
        tags,
        dateFrom,
        dateTo
      } = req.query;

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
      const filter: any = { search: search as string };
      if (status) filter.status = status as ContentStatus;
      if (category) filter.category = category as string;
      if (tags) {
        filter.tags = Array.isArray(tags) ? tags as string[] : [tags as string];
      }
      if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
      if (dateTo) filter.dateTo = new Date(dateTo as string);

      // 构建分页选项
      const pagination = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
        orderBy: 'createdAt' as const,
        orderDirection: 'desc' as const,
      };

      const result = await contentRepository.findMany(filter, pagination);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        query: search,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取最近内容
   */
  public getRecentContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hours = 24, limit = 50 } = req.query;

      const since = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);
      
      const filter = {
        dateFrom: since,
        status: ContentStatus.PUBLISHED,
      };

      const pagination = {
        page: 1,
        limit: Math.min(parseInt(limit as string), 100),
        orderBy: 'createdAt' as const,
        orderDirection: 'desc' as const,
      };

      const result = await contentRepository.findMany(filter, pagination);
      
      res.json({
        success: true,
        data: result.data,
        meta: {
          since,
          hours: parseInt(hours as string),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const contentController = new ContentController();
