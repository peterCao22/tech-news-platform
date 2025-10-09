/**
 * 内容去重API路由
 * Story 2.4: 智能内容去重与相似度检测
 */

import { Router, Request, Response } from 'express';
import { contentDeduplicationService } from '../services/content-deduplication.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router: Router = Router();
const authMiddleware = new AuthMiddleware();

// 应用认证中间件
router.use(authMiddleware.authenticate);

/**
 * POST /api/deduplication/detect
 * 检测单条内容的重复
 */
router.post('/detect', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.body;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: '请提供内容ID'
      });
    }

    logger.info('收到重复检测请求', { contentId });

    const results = await contentDeduplicationService.detectDuplicates(contentId);

    res.json({
      success: true,
      data: {
        contentId,
        duplicatesFound: results.length,
        duplicates: results
      },
      message: `检测完成，发现${results.length}个相似内容`
    });
  } catch (error) {
    logger.error('重复检测失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '重复检测失败'
    });
  }
});

/**
 * POST /api/deduplication/batch-detect
 * 批量检测重复内容
 */
router.post('/batch-detect', async (req: Request, res: Response) => {
  try {
    const { contentIds } = req.body;

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的内容ID数组'
      });
    }

    if (contentIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: '批量检测最多支持50条内容'
      });
    }

    logger.info('收到批量检测请求', { count: contentIds.length });

    const result = await contentDeduplicationService.batchDetect(contentIds);

    res.json({
      success: true,
      data: result,
      message: `批量检测完成: 检查${result.checked}条，发现${result.duplicatesFound}对重复`
    });
  } catch (error) {
    logger.error('批量检测失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '批量检测失败'
    });
  }
});

/**
 * POST /api/deduplication/similarity
 * 计算两条内容的相似度
 */
router.post('/similarity', async (req: Request, res: Response) => {
  try {
    const { contentId1, contentId2 } = req.body;

    if (!contentId1 || !contentId2) {
      return res.status(400).json({
        success: false,
        message: '请提供两个内容ID'
      });
    }

    logger.info('收到相似度计算请求', { contentId1, contentId2 });

    // 获取两条内容
    const { db } = await import('@tech-news-platform/database');
    const [content1, content2] = await Promise.all([
      db.content.findUnique({ where: { id: contentId1 } }),
      db.content.findUnique({ where: { id: contentId2 } })
    ]);

    if (!content1 || !content2) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    const similarity = await contentDeduplicationService.calculateSimilarity(
      {
        id: content1.id,
        title: content1.title,
        content: content1.content || content1.description || ''
      },
      {
        id: content2.id,
        title: content2.title,
        content: content2.content || content2.description || ''
      }
    );

    res.json({
      success: true,
      data: similarity
    });
  } catch (error) {
    logger.error('相似度计算失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '相似度计算失败'
    });
  }
});

/**
 * POST /api/deduplication/mark-duplicate
 * 标记内容为重复
 */
router.post('/mark-duplicate', async (req: Request, res: Response) => {
  try {
    const { originalId, duplicateId } = req.body;
    const userId = (req as any).user?.userId;

    if (!originalId || !duplicateId) {
      return res.status(400).json({
        success: false,
        message: '请提供原始内容ID和重复内容ID'
      });
    }

    logger.info('收到标记重复请求', { originalId, duplicateId, userId });

    await contentDeduplicationService.markAsDuplicate(originalId, duplicateId, userId);

    res.json({
      success: true,
      message: '已标记为重复内容'
    });
  } catch (error) {
    logger.error('标记重复失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '标记重复失败'
    });
  }
});

/**
 * POST /api/deduplication/merge
 * 合并重复内容
 */
router.post('/merge', async (req: Request, res: Response) => {
  try {
    const { originalId, duplicateIds } = req.body;
    const userId = (req as any).user?.userId;

    if (!originalId || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供原始内容ID和重复内容ID数组'
      });
    }

    logger.info('收到合并重复请求', { originalId, count: duplicateIds.length, userId });

    await contentDeduplicationService.mergeDuplicates(originalId, duplicateIds, userId);

    res.json({
      success: true,
      message: `已合并${duplicateIds.length}条重复内容`
    });
  } catch (error) {
    logger.error('合并重复失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '合并重复失败'
    });
  }
});

/**
 * GET /api/deduplication/report
 * 获取去重报告
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    logger.info('收到去重报告请求');

    const report = await contentDeduplicationService.getDeduplicationReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('获取去重报告失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取报告失败'
    });
  }
});

/**
 * GET /api/deduplication/pending-review
 * 获取待审核的重复内容
 */
router.get('/pending-review', async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    logger.info('收到待审核列表请求');

    const { db } = await import('@tech-news-platform/database');

    const [duplications, total] = await Promise.all([
      db.contentDuplication.findMany({
        where: { status: 'PENDING' },
        orderBy: { overallSimilarity: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      db.contentDuplication.count({ where: { status: 'PENDING' } })
    ]);

    // 手动加载关联的 content 数据
    const enrichedDuplications = await Promise.all(
      duplications.map(async (dup) => {
        const [original, duplicate] = await Promise.all([
          db.content.findUnique({
            where: { id: dup.originalId },
            select: {
              id: true,
              title: true,
              source: { select: { name: true } }
            }
          }),
          db.content.findUnique({
            where: { id: dup.duplicateId },
            select: {
              id: true,
              title: true,
              source: { select: { name: true } }
            }
          })
        ]);
        return { ...dup, original, duplicate };
      })
    );

    res.json({
      success: true,
      data: {
        duplications: enrichedDuplications,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset)
        }
      }
    });
  } catch (error) {
    logger.error('获取待审核列表失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取列表失败'
    });
  }
});

/**
 * POST /api/deduplication/review-decision
 * 人工审核决策
 */
router.post('/review-decision', async (req: Request, res: Response) => {
  try {
    const { duplicationId, decision, notes } = req.body;
    const userId = (req as any).user?.userId;

    if (!duplicationId || !decision) {
      return res.status(400).json({
        success: false,
        message: '请提供去重记录ID和审核决策'
      });
    }

    const validDecisions = ['CONFIRMED', 'FALSE_POSITIVE', 'IGNORED'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核决策'
      });
    }

    logger.info('收到审核决策', { duplicationId, decision, userId });

    const { db } = await import('@tech-news-platform/database');

    await db.contentDuplication.update({
      where: { id: duplicationId },
      data: {
        status: decision,
        reviewedBy: userId,
        reviewedAt: new Date()
      }
    });

    // 如果确认为重复，更新内容的duplicate_of字段
    if (decision === 'CONFIRMED') {
      const duplication = await db.contentDuplication.findUnique({
        where: { id: duplicationId }
      });

      if (duplication) {
        await db.content.update({
          where: { id: duplication.duplicateId },
          data: { duplicateOf: duplication.originalId }
        });
      }
    }

    res.json({
      success: true,
      message: '审核决策已保存'
    });
  } catch (error) {
    logger.error('保存审核决策失败', { error });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '保存决策失败'
    });
  }
});

export default router;

