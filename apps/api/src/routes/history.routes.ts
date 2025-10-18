/**
 * Story 4.3: 历史内容分析与趋势 - API Routes
 * 
 * API端点：
 * - GET /api/history/personal-vs-platform - 个人vs平台对比分析
 * - GET /api/history/daily-reading - 每日阅读记录
 * - GET /api/history/trends/keywords - 关键词趋势
 * - GET /api/history/trends/categories - 分类趋势
 * - GET /api/history/trends/report - 完整趋势报告
 * - GET /api/history/company/:name - 公司新闻追踪
 * - GET /api/history/following-companies - 关注公司动态
 * - POST /api/history/trends/aggregate - 手动触发趋势聚合（管理员）
 */

import { Router, Request, Response } from 'express';
import { personalAnalysisService, TimePeriod } from '../services/personal-analysis.service';
import { dailyReadingService, ExportFormat } from '../services/daily-reading.service';
import { trendAnalysisService } from '../services/trend-analysis.service';
import { companyTrackingService } from '../services/company-tracking.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router: Router = Router();

// 所有路由都需要身份验证
router.use(authenticateToken);

/**
 * GET /api/history/personal-vs-platform
 * 获取个人vs平台对比分析
 * 
 * Query参数:
 * - period: '7d' | '30d' (默认30d)
 */
router.get('/personal-vs-platform', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const period = (req.query.period as TimePeriod) || '30d';

    if (!['7d', '30d'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '时间范围必须是 7d 或 30d',
      });
    }

    const result = await personalAnalysisService.comparePersonalVsPlatform(
      userId,
      period
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('获取个人vs平台对比分析失败:', error);
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取对比分析失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/history/daily-reading
 * 获取每日阅读记录
 * 
 * Query参数:
 * - date: YYYY-MM-DD格式（必填）
 * - category: 分类筛选（可选）
 * - export: 导出格式 'json' | 'csv' | 'markdown'（可选）
 */
router.get('/daily-reading', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const date = req.query.date as string;
    const category = req.query.category as string | undefined;
    const exportFormat = req.query.export as ExportFormat | undefined;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '缺少必填参数: date',
      });
    }

    // 验证日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '日期格式必须是 YYYY-MM-DD',
      });
    }

    // 如果请求导出
    if (exportFormat) {
      if (!['json', 'csv', 'markdown'].includes(exportFormat)) {
        return res.status(400).json({
          success: false,
          error: 'InvalidParameter',
          message: '导出格式必须是 json, csv 或 markdown',
        });
      }

      const exportData = await dailyReadingService.exportDailyReading(
        userId,
        date,
        exportFormat
      );

      // 设置响应头
      const contentType =
        exportFormat === 'json'
          ? 'application/json'
          : exportFormat === 'csv'
          ? 'text/csv'
          : 'text/markdown';

      const filename = `reading-${date}.${exportFormat}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      return res.send(exportData);
    }

    // 正常查询
    const result = await dailyReadingService.getDailyReading(
      userId,
      date,
      category
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('获取每日阅读记录失败:', error);
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取阅读记录失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/history/trends/keywords
 * 获取关键词趋势
 * 
 * Query参数:
 * - period: '7d' | '30d' (默认7d)
 * - limit: 返回数量（默认20）
 */
router.get('/trends/keywords', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as '7d' | '30d') || '7d';
    const limit = parseInt(req.query.limit as string) || 20;

    if (!['7d', '30d'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '时间范围必须是 7d 或 30d',
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: 'limit 必须在 1-100 之间',
      });
    }

    const trends = await trendAnalysisService.getKeywordTrends(period, limit);

    return res.json({
      success: true,
      data: {
        period,
        limit,
        trends,
      },
    });
  } catch (error: any) {
    console.error('获取关键词趋势失败:', error);
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取趋势数据失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/history/trends/categories
 * 获取分类趋势
 * 
 * Query参数:
 * - period: '7d' | '30d' (默认7d)
 * - limit: 返回数量（默认10）
 */
router.get('/trends/categories', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as '7d' | '30d') || '7d';
    const limit = parseInt(req.query.limit as string) || 10;

    if (!['7d', '30d'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '时间范围必须是 7d 或 30d',
      });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: 'limit 必须在 1-50 之间',
      });
    }

    const trends = await trendAnalysisService.getCategoryTrends(period, limit);

    return res.json({
      success: true,
      data: {
        period,
        limit,
        trends,
      },
    });
  } catch (error: any) {
    console.error('获取分类趋势失败:', error);
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取趋势数据失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/history/trends/report
 * 获取完整趋势报告
 * 
 * Query参数:
 * - period: '7d' | '30d' (默认7d)
 */
router.get('/trends/report', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as '7d' | '30d') || '7d';

    if (!['7d', '30d'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '时间范围必须是 7d 或 30d',
      });
    }

    const report = await trendAnalysisService.getTrendReport(period);

    return res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('获取趋势报告失败:', error);
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取趋势报告失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/history/company/:name
 * 追踪公司新闻历史
 * 
 * Path参数:
 * - name: 公司名称或股票代码
 * 
 * Query参数:
 * - period: '7d' | '30d' (默认30d)
 */
router.get('/company/:name', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const companyName = decodeURIComponent(req.params.name);
    const period = (req.query.period as '7d' | '30d') || '30d';

    if (!companyName) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '缺少公司名称',
      });
    }

    if (!['7d', '30d'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '时间范围必须是 7d 或 30d',
      });
    }

    const result = await companyTrackingService.trackCompanyNews(
      companyName,
      period,
      userId
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('追踪公司新闻失败:', error);
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取公司新闻失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/history/following-companies
 * 获取关注公司的新闻动态
 * 
 * Query参数:
 * - period: '7d' | '30d' (默认7d)
 */
router.get('/following-companies', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const period = (req.query.period as '7d' | '30d') || '7d';

    if (!['7d', '30d'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '时间范围必须是 7d 或 30d',
      });
    }

    const result = await companyTrackingService.getFollowedCompaniesNews(
      userId,
      period
    );

    return res.json({
      success: true,
      data: {
        period,
        companies: result,
      },
    });
  } catch (error: any) {
    console.error('获取关注公司动态失败:', error);
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取关注公司动态失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/history/trends/aggregate
 * 手动触发趋势数据聚合（管理员功能）
 * 
 * Body参数:
 * - date: YYYY-MM-DD格式（可选，默认前一天）
 */
router.post('/trends/aggregate', async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;

    // 只允许管理员执行
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '只有管理员可以执行此操作',
      });
    }

    const dateStr = req.body.date as string | undefined;
    let targetDate: Date | undefined;

    if (dateStr) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return res.status(400).json({
          success: false,
          error: 'InvalidParameter',
          message: '日期格式必须是 YYYY-MM-DD',
        });
      }
      targetDate = new Date(dateStr);
    }

    // 并行执行关键词和分类趋势聚合
    const [keywordCount, categoryCount] = await Promise.all([
      trendAnalysisService.aggregateKeywordTrends(targetDate),
      trendAnalysisService.aggregateCategoryTrends(targetDate),
    ]);

    return res.json({
      success: true,
      data: {
        date: targetDate
          ? targetDate.toISOString().split('T')[0]
          : new Date(Date.now() - 86400000).toISOString().split('T')[0],
        keywordCount,
        categoryCount,
      },
      message: '趋势数据聚合完成',
    });
  } catch (error: any) {
    console.error('趋势数据聚合失败:', error);
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '趋势数据聚合失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;

