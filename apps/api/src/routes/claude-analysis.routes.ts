/**
 * Claude AI 内容分析路由
 * Story 2.3: Claude AI内容分析与摘要
 */

import { Router, Request, Response } from 'express';
import { claudeAnalysisService } from '../services/claude-analysis.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// 应用认证中间件
router.use(authMiddleware.authenticate);

/**
 * POST /api/claude-analysis/analyze/:contentId
 * 分析单条新闻内容
 */
router.post('/analyze/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    logger.info('收到内容分析请求', { contentId });

    const result = await claudeAnalysisService.analyzeContent(contentId);

    res.json({
      success: true,
      data: result,
      message: '内容分析完成'
    });
  } catch (error) {
    logger.error('内容分析失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '内容分析失败'
    });
  }
});

/**
 * POST /api/claude-analysis/batch
 * 批量分析新闻内容
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { contentIds } = req.body;

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的内容ID数组'
      });
    }

    if (contentIds.length > 20) {
      return res.status(400).json({
        success: false,
        message: '批量分析最多支持20条内容'
      });
    }

    logger.info('收到批量分析请求', { count: contentIds.length });

    const results = await claudeAnalysisService.batchAnalyze(contentIds);

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: contentIds.length,
          success: successCount,
          failed: failedCount
        }
      },
      message: `批量分析完成: ${successCount}条成功, ${failedCount}条失败`
    });
  } catch (error) {
    logger.error('批量分析失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '批量分析失败'
    });
  }
});

/**
 * GET /api/claude-analysis/status/:contentId
 * 查询内容分析状态
 */
router.get('/status/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
  const { db } = await import('@tech-news-platform/database');

  const content = await db.content.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        title: true,
        metadata: true
      }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    const claudeAnalysis = (content.metadata as any)?.claude_analysis;
    const hasAnalysis = !!claudeAnalysis;

    res.json({
      success: true,
      data: {
        contentId: content.id,
        title: content.title,
        hasAnalysis,
        analysis: hasAnalysis ? {
          summary: (content.metadata as any)?.summary,
          keyInfo: (content.metadata as any)?.key_info,
          importance: (content.metadata as any)?.importance,
          sentiment: (content.metadata as any)?.sentiment,
          categories: (content.metadata as any)?.categories,
          analyzedAt: claudeAnalysis.analyzed_at,
          tokensUsed: claudeAnalysis.tokens_used,
          costUsd: claudeAnalysis.cost_usd
        } : null
      }
    });
  } catch (error) {
    logger.error('查询分析状态失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '查询失败'
    });
  }
});

/**
 * GET /api/claude-analysis/stats
 * 获取分析统计信息
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    logger.info('收到分析统计请求');

    const stats = await claudeAnalysisService.getAnalysisStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取分析统计失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取统计失败'
    });
  }
});

/**
 * POST /api/claude-analysis/summary
 * 仅生成摘要（快速接口）
 */
router.post('/summary', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的内容'
      });
    }

    logger.info('收到摘要生成请求', { contentLength: content.length });

    const summary = await claudeAnalysisService.generateSummary(content);

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    logger.error('摘要生成失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '摘要生成失败'
    });
  }
});

export default router;

