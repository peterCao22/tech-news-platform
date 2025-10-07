/**
 * 内容管理控制器
 * 提供内容的CRUD操作、搜索、标签管理等功能
 */

import { Request, Response } from 'express';
import { ContentItemService } from '../services/content-item.service';
import { TagService } from '../services/tag.service';
import { ContentStatus, ContentType, TagType } from '@tech-news-platform/database';

export class ContentItemController {
  private contentService: ContentItemService;
  private tagService: TagService;

  constructor() {
    this.contentService = new ContentItemService();
    this.tagService = new TagService();
  }

  /**
   * 获取内容列表
   */
  public getContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        category,
        tags,
        sourceId,
        dateFrom,
        dateTo,
        search,
        minScore,
        maxScore,
        priority,
        sortBy = 'publishedAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        status: status as ContentStatus,
        type: type as ContentType,
        category: category as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        sourceId: sourceId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        search: search as string,
        minScore: minScore ? parseFloat(minScore as string) : undefined,
        maxScore: maxScore ? parseFloat(maxScore as string) : undefined,
        priority: priority ? parseInt(priority as string) : undefined,
      };

      const options = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100), // 限制最大100条
        orderBy: [{ [sortBy as string]: sortOrder }],
      };

      const result = await this.contentService.getContent(filters, options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('获取内容列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取内容列表失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 根据ID获取内容详情
   */
  public getContentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { includeRelations = 'true' } = req.query;

      const content = await this.contentService.getContentById(
        id,
        includeRelations === 'true'
      );

      if (!content) {
        res.status(404).json({
          success: false,
          message: '内容不存在',
        });
        return;
      }

      // 增加浏览次数
      await this.contentService.incrementViewCount(id);

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      console.error('获取内容详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取内容详情失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 创建内容
   */
  public createContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const contentData = req.body;

      // 验证必需字段
      if (!contentData.title || !contentData.sourceId) {
        res.status(400).json({
          success: false,
          message: '标题和来源ID是必需的',
        });
        return;
      }

      const content = await this.contentService.createContent(contentData, userId);

      res.status(201).json({
        success: true,
        data: content,
        message: '内容创建成功',
      });
    } catch (error) {
      console.error('创建内容失败:', error);
      
      if (error instanceof Error && error.message.includes('重复内容')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '创建内容失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 更新内容
   */
  public updateContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      const content = await this.contentService.updateContent(id, updateData, userId);

      res.json({
        success: true,
        data: content,
        message: '内容更新成功',
      });
    } catch (error) {
      console.error('更新内容失败:', error);
      
      if (error instanceof Error && error.message.includes('不存在')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '更新内容失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 删除内容
   */
  public deleteContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await this.contentService.deleteContent(id, userId);

      res.json({
        success: true,
        message: '内容删除成功',
      });
    } catch (error) {
      console.error('删除内容失败:', error);
      
      if (error instanceof Error && error.message.includes('不存在')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '删除内容失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 批量更新内容状态
   */
  public updateContentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ids, status } = req.body;
      const userId = req.user?.id;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的内容ID数组',
        });
        return;
      }

      if (!Object.values(ContentStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: '无效的内容状态',
        });
        return;
      }

      await this.contentService.updateContentStatus(ids, status, userId);

      res.json({
        success: true,
        message: `成功更新 ${ids.length} 条内容的状态`,
      });
    } catch (error) {
      console.error('批量更新状态失败:', error);
      res.status(500).json({
        success: false,
        message: '批量更新状态失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 为内容添加标签
   */
  public addContentTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { tagIds, tagNames } = req.body;

      if (!tagIds && !tagNames) {
        res.status(400).json({
          success: false,
          message: '请提供标签ID或标签名称',
        });
        return;
      }

      const result = await this.contentService.addContentTags(id, tagIds, tagNames);

      res.json({
        success: true,
        data: result,
        message: '标签添加成功',
      });
    } catch (error) {
      console.error('添加标签失败:', error);
      res.status(500).json({
        success: false,
        message: '添加标签失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 移除内容标签
   */
  public removeContentTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { tagIds } = req.body;

      if (!Array.isArray(tagIds) || tagIds.length === 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的标签ID数组',
        });
        return;
      }

      await this.contentService.removeContentTags(id, tagIds);

      res.json({
        success: true,
        message: '标签移除成功',
      });
    } catch (error) {
      console.error('移除标签失败:', error);
      res.status(500).json({
        success: false,
        message: '移除标签失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 检查内容重复
   */
  public checkDuplication = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, content, url } = req.body;

      if (!title) {
        res.status(400).json({
          success: false,
          message: '标题是必需的',
        });
        return;
      }

      const result = await this.contentService.checkDuplication(title, content, url);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('检查重复失败:', error);
      res.status(500).json({
        success: false,
        message: '检查重复失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 获取内容统计信息
   */
  public getContentStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const statistics = await this.contentService.getStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error('获取统计信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计信息失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 增加分享次数
   */
  public shareContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.contentService.incrementShareCount(id);

      res.json({
        success: true,
        message: '分享记录成功',
      });
    } catch (error) {
      console.error('记录分享失败:', error);
      res.status(500).json({
        success: false,
        message: '记录分享失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  // 标签相关方法

  /**
   * 获取标签列表
   */
  public getTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 50,
        type,
        parentId,
        search,
        hasParent,
        sortBy = 'usageCount',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        type: type as TagType,
        parentId: parentId as string,
        search: search as string,
        hasParent: hasParent ? hasParent === 'true' : undefined,
      };

      const options = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
        orderBy: [{ [sortBy as string]: sortOrder }],
      };

      const result = await this.tagService.getTags(filters, options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('获取标签列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取标签列表失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 创建标签
   */
  public createTag = async (req: Request, res: Response): Promise<void> => {
    try {
      const tagData = req.body;

      // 验证必需字段
      if (!tagData.name || !tagData.slug) {
        res.status(400).json({
          success: false,
          message: '标签名称和标识符是必需的',
        });
        return;
      }

      const tag = await this.tagService.createTag(tagData);

      res.status(201).json({
        success: true,
        data: tag,
        message: '标签创建成功',
      });
    } catch (error) {
      console.error('创建标签失败:', error);
      
      if (error instanceof Error && error.message.includes('已存在')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '创建标签失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 获取标签建议
   */
  public getTagSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, limit = 10, type } = req.query;

      if (!query) {
        res.status(400).json({
          success: false,
          message: '查询参数是必需的',
        });
        return;
      }

      const suggestions = await this.tagService.searchSuggestions(
        query as string,
        parseInt(limit as string),
        type as TagType
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      console.error('获取标签建议失败:', error);
      res.status(500).json({
        success: false,
        message: '获取标签建议失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 获取热门标签
   */
  public getPopularTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = 20, type } = req.query;

      const tags = await this.tagService.getPopularTags(
        parseInt(limit as string),
        type as TagType
      );

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      console.error('获取热门标签失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门标签失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  };
}
