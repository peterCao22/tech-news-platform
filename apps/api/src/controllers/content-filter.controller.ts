import { Request, Response, NextFunction } from 'express';
import { contentFilterService } from '../services/content-filter.service';
import { logger } from '../utils/logger';

export class ContentFilterController {
  /**
   * 获取当前过滤配置
   */
  async getFilterConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = (contentFilterService as any).config;
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新过滤配置
   */
  async updateFilterConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { includeRules, excludeRules, minIncludeScore, maxExcludeScore } = req.body;
      
      const updateData: any = {};
      if (includeRules) updateData.includeRules = includeRules;
      if (excludeRules) updateData.excludeRules = excludeRules;
      if (minIncludeScore !== undefined) updateData.minIncludeScore = minIncludeScore;
      if (maxExcludeScore !== undefined) updateData.maxExcludeScore = maxExcludeScore;

      contentFilterService.updateConfig(updateData);

      res.json({
        success: true,
        message: '过滤配置更新成功',
        data: (contentFilterService as any).config
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 测试内容过滤
   */
  async testContentFilter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, content } = req.body;

      if (!title) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Title is required' }
        });
        return;
      }

      const result = contentFilterService.shouldFilterContent(title, description, content);

      res.json({
        success: true,
        data: {
          title,
          description,
          content: content ? content.substring(0, 200) + '...' : undefined,
          filterResult: result
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量测试内容过滤
   */
  async batchTestContentFilter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contents } = req.body;

      if (!Array.isArray(contents)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Contents must be an array' }
        });
        return;
      }

      const results = contentFilterService.filterContentBatch(contents);
      const stats = contentFilterService.getFilterStats(results);

      res.json({
        success: true,
        data: {
          results: results.map((result, index) => ({
            ...contents[index],
            filterResult: {
              shouldFilter: result.shouldFilter,
              reason: result.reason,
              includeScore: result.includeScore,
              excludeScore: result.excludeScore
            }
          })),
          statistics: stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取预设的过滤规则模板
   */
  async getFilterTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = {
        techNews: {
          name: '科技新闻',
          description: '专注于科技新闻、产品发布、公司动态',
          includeKeywords: [
            '科技新闻', '产品发布', '融资', '投资', '上市', '收购',
            'breakthrough', 'innovation', 'funding', 'IPO', 'acquisition'
          ],
          excludeKeywords: [
            '编程', '代码', '开发', '机器学习', '算法',
            'programming', 'coding', 'development', 'machine learning'
          ]
        },
        fintech: {
          name: '金融科技',
          description: '专注于金融科技、数字货币、支付创新',
          includeKeywords: [
            '金融科技', 'fintech', '数字货币', 'cryptocurrency', '区块链',
            '支付', 'payment', '银行', 'banking', '保险', 'insurance'
          ],
          excludeKeywords: [
            '编程', '代码', '开发教程', '技术实现',
            'programming', 'coding', 'tutorial', 'implementation'
          ]
        },
        consumer: {
          name: '消费科技',
          description: '专注于消费电子、智能设备、用户体验',
          includeKeywords: [
            '智能手机', 'smartphone', '电动汽车', 'electric vehicle',
            '智能家居', 'smart home', '可穿戴设备', 'wearable'
          ],
          excludeKeywords: [
            '编程', '开发', '技术架构', '代码实现',
            'programming', 'development', 'architecture', 'coding'
          ]
        }
      };

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }
}

export const contentFilterController = new ContentFilterController();
