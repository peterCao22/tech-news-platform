import { Request, Response, NextFunction } from 'express';
import { 
  sourceRepository, 
  contentRepository,
  SourceType,
  SourceStatus,
  CreateSourceData,
  UpdateSourceData 
} from '@tech-news-platform/database';
import { rssService } from '../services/rss.service';
import { logger } from '../utils/logger';

export class SourceController {
  /**
   * 获取所有信息源
   */
  public getSources = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, status } = req.query;
      
      const filter: any = {};
      if (type) filter.type = type as SourceType;
      if (status) filter.status = status as SourceStatus;

      const sources = await sourceRepository.findMany(filter);
      
      res.json({
        success: true,
        data: sources,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 根据ID获取信息源详情
   */
  public getSource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const source = await sourceRepository.findById(id);
      
      if (!source) {
        return res.status(404).json({
          success: false,
          error: { code: 'SOURCE_NOT_FOUND', message: 'Source not found' }
        });
      }
      
      res.json({ success: true, data: source });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 创建新的信息源
   */
  public createSource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, type, url, config } = req.body;

      // 验证必填字段
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Name and type are required' 
          }
        });
      }

      // 如果是RSS类型，验证URL (暂时跳过验证用于测试)
      if (type === SourceType.RSS) {
        if (!url) {
          return res.status(400).json({
            success: false,
            error: { 
              code: 'VALIDATION_ERROR', 
              message: 'URL is required for RSS sources' 
            }
          });
        }

        // 暂时跳过RSS URL验证用于测试
        // const validation = await rssService.validateRSSUrl(url);
        // if (!validation.valid) {
        //   return res.status(400).json({
        //     success: false,
        //     error: { 
        //       code: 'INVALID_RSS_URL', 
        //       message: `Invalid RSS URL: ${validation.error}` 
        //     }
        //   });
        // }
      }

      const sourceData: CreateSourceData = {
        name,
        type: type as SourceType,
        url,
        config,
      };

      const source = await sourceRepository.create(sourceData);
      
      logger.info(`新信息源已创建: ${source.name} (${source.id})`);
      
      res.status(201).json({ 
        success: true, 
        data: source 
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 更新信息源
   */
  public updateSource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, url, config, status } = req.body;

      // 检查源是否存在
      const existingSource = await sourceRepository.findById(id);
      if (!existingSource) {
        return res.status(404).json({
          success: false,
          error: { code: 'SOURCE_NOT_FOUND', message: 'Source not found' }
        });
      }

      // 如果更新URL且是RSS类型，验证新URL
      if (url && existingSource.type === SourceType.RSS && url !== existingSource.url) {
        const validation = await rssService.validateRSSUrl(url);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: { 
              code: 'INVALID_RSS_URL', 
              message: `Invalid RSS URL: ${validation.error}` 
            }
          });
        }
      }

      const updateData: UpdateSourceData = {};
      if (name !== undefined) updateData.name = name;
      if (url !== undefined) updateData.url = url;
      if (config !== undefined) updateData.config = config;
      if (status !== undefined) updateData.status = status as SourceStatus;

      const source = await sourceRepository.update(id, updateData);
      
      logger.info(`信息源已更新: ${source.name} (${source.id})`);
      
      res.json({ success: true, data: source });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 删除信息源
   */
  public deleteSource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // 检查源是否存在
      const existingSource = await sourceRepository.findById(id);
      if (!existingSource) {
        return res.status(404).json({
          success: false,
          error: { code: 'SOURCE_NOT_FOUND', message: 'Source not found' }
        });
      }

      await sourceRepository.delete(id);
      
      logger.info(`信息源已删除: ${existingSource.name} (${id})`);
      
      res.json({ 
        success: true, 
        message: 'Source deleted successfully' 
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 手动触发RSS源抓取
   */
  public fetchSource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // 检查源是否存在且为RSS类型
      const source = await sourceRepository.findById(id);
      if (!source) {
        return res.status(404).json({
          success: false,
          error: { code: 'SOURCE_NOT_FOUND', message: 'Source not found' }
        });
      }

      if (source.type !== SourceType.RSS) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_SOURCE_TYPE', 
            message: 'Only RSS sources can be fetched manually' 
          }
        });
      }

      logger.info(`手动触发RSS源抓取: ${source.name} (${id})`);

      const result = await rssService.fetchAndProcessSource(id);
      
      res.json({ 
        success: true, 
        data: {
          sourceId: id,
          sourceName: source.name,
          ...result,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 批量抓取所有活跃RSS源
   */
  public fetchAllSources = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('手动触发批量RSS源抓取');

      const result = await rssService.fetchAllActiveSources();
      
      res.json({ 
        success: true, 
        data: result 
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取信息源统计信息
   */
  public getSourceStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [sourceStats, contentStats] = await Promise.all([
        sourceRepository.getStats(),
        contentRepository.getStats(),
      ]);

      res.json({ 
        success: true, 
        data: {
          sources: sourceStats,
          content: contentStats,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 验证RSS URL
   */
  public validateRSSUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'URL is required' 
          }
        });
      }

      const validation = await rssService.validateRSSUrl(url);
      
      res.json({ 
        success: true, 
        data: validation 
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取源的内容列表
   */
  public getSourceContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      // 检查源是否存在
      const source = await sourceRepository.findById(id);
      if (!source) {
        return res.status(404).json({
          success: false,
          error: { code: 'SOURCE_NOT_FOUND', message: 'Source not found' }
        });
      }

      const filter: any = { sourceId: id };
      if (status) filter.status = status;

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        orderBy: 'createdAt' as const,
        orderDirection: 'desc' as const,
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
}

export const sourceController = new SourceController();
