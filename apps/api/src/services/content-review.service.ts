/**
 * Content Review Service
 * Story 3.1: 内容审核工作台界面
 * 
 * 提供内容审核相关的业务逻辑，包括：
 * - 按状态获取内容列表
 * - 更新审核状态
 * - 批量操作
 * - 审核日志记录
 * - 统计数据
 */

import { db } from '@tech-news-platform/database';
import { logger } from '../utils/logger';
import { Prisma } from '@tech-news-platform/database';

/**
 * 内容审核查询参数
 */
export interface ContentReviewQueryParams {
  status?: string | string[];           // 审核状态（支持多选）
  category?: string;                    // 分类
  sourceId?: string;                    // 来源ID
  dateFrom?: Date;                      // 开始日期
  dateTo?: Date;                        // 结束日期
  page?: number;                        // 页码（从1开始）
  limit?: number;                       // 每页数量
  sortBy?: 'createdAt' | 'score' | 'title' | 'reviewedAt';  // 排序字段
  sortOrder?: 'asc' | 'desc';          // 排序方向
}

/**
 * 内容审核统计数据
 */
export interface ContentReviewStats {
  totalReviewed: number;                // 总审核数
  approvalRate: number;                 // 通过率
  avgReviewTime: number;                // 平均审核时间（毫秒）
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
    published: number;
  };
  byReviewer: Array<{
    userId: string;
    userName: string;
    reviewCount: number;
    avgTime: number;
  }>;
  byCategory: Record<string, number>;
}

/**
 * 内容审核操作
 */
export type ReviewAction = 'APPROVE' | 'REJECT' | 'PUBLISH';

/**
 * 内容审核服务
 */
export class ContentReviewService {
  /**
   * 获取内容列表（支持筛选和分页）
   */
  async getContentByStatus(params: ContentReviewQueryParams) {
    const {
      status,
      category,
      sourceId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    // 构建查询条件
    const where: any = {};

    // 审核状态筛选（支持多选）
    if (status) {
      if (Array.isArray(status)) {
        where.reviewStatus = { in: status };
      } else {
        where.reviewStatus = status;
      }
    }

    // 分类筛选
    if (category) {
      where.category = category;
    }

    // 来源筛选
    if (sourceId) {
      where.sourceId = sourceId;
    }

    // 日期范围筛选
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // 计算跳过数量
    const skip = (page - 1) * limit;

    // 并行查询总数和列表
    const [total, items] = await Promise.all([
      db.content.count({ where }),
      db.content.findMany({
        where,
        include: {
          source: {
            select: {
              id: true,
              name: true,
              url: true
            }
          },
          contentScore: {
            select: {
              totalScore: true,
              timelinessScore: true,
              authorityScore: true,
              qualityScore: true,
              relevanceScore: true,
              aiImportanceScore: true,
              engagementScore: true,
              explanation: true
            }
          },
          // TODO: 等Prisma客户端更新后启用
          // reviewer: {
          //   select: {
          //     id: true,
          //     name: true,
          //     email: true
          //   }
          // },
          // editor: {
          //   select: {
          //     id: true,
          //     name: true,
          //     email: true
          //   }
          // }
        },
        skip,
        take: limit,
        orderBy: this.buildOrderBy(sortBy, sortOrder)
      })
    ]);

    // 获取状态统计
    const stats = await this.getStatusCounts();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats
    };
  }

  /**
   * 获取单个内容详情
   */
  async getContentDetail(contentId: string) {
    const content = await db.content.findUnique({
      where: { id: contentId },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            url: true,
            type: true
          }
        },
        contentScore: true,
          // TODO: 等Prisma客户端更新后启用
          // reviewer: {
          //   select: {
          //     id: true,
          //     name: true,
          //     email: true
          //   }
          // },
          // editor: {
          //   select: {
          //     id: true,
          //     name: true,
          //     email: true
          //   }
          // },
          // auditLogs: {
          //   include: {
          //     user: {
          //       select: {
          //         id: true,
          //         name: true,
          //         email: true
          //       }
          //     }
          //   },
          //   orderBy: {
          //     createdAt: 'desc'
          //   },
          //   take: 20
          // }
      }
    });

    if (!content) {
      throw new Error('内容不存在');
    }

    return content;
  }

  /**
   * 更新内容审核状态
   */
  async updateContentStatus(
    contentId: string,
    action: ReviewAction,
    userId: string,
    notes?: string
  ) {
    // 查询当前内容
    const content = await db.content.findUnique({
      where: { id: contentId },
      select: { 
        id: true, 
        reviewStatus: true,
        title: true
      }
    });

    if (!content) {
      throw new Error('内容不存在');
    }

    const oldStatus = content.reviewStatus;
    const newStatus = this.mapActionToStatus(action);

    // 更新内容状态
    const updated = await db.content.update({
      where: { id: contentId },
      data: {
        reviewStatus: newStatus,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: notes
      },
      include: {
        source: true,
        contentScore: true,
        // TODO: 等Prisma客户端更新后启用
        // reviewer: {
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true
        //   }
        // }
      }
    });

    // 记录审核日志
    await this.createAuditLog({
      contentId,
      userId,
      action,
      oldStatus,
      newStatus,
      notes
    });

    logger.info('内容审核状态已更新', {
      contentId,
      action,
      oldStatus,
      newStatus,
      userId
    });

    return updated;
  }

  /**
   * 批量更新内容状态
   */
  async batchUpdateStatus(
    contentIds: string[],
    action: ReviewAction,
    userId: string,
    notes?: string
  ) {
    if (!contentIds || contentIds.length === 0) {
      throw new Error('内容ID列表不能为空');
    }

    const newStatus = this.mapActionToStatus(action);
    const results = [];

    // 逐个处理（以便记录详细日志）
    for (const contentId of contentIds) {
      try {
        const updated = await this.updateContentStatus(
          contentId,
          action,
          userId,
          notes
        );
        results.push({
          id: contentId,
          success: true,
          data: updated
        });
      } catch (error: any) {
        logger.error('批量更新失败', {
          contentId,
          error: error.message
        });
        results.push({
          id: contentId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    logger.info('批量审核完成', {
      total: contentIds.length,
      successCount,
      failedCount,
      action
    });

    return {
      successCount,
      failedCount,
      results
    };
  }

  /**
   * 更新内容详情
   */
  async updateContentDetails(
    contentId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      content?: string;
      category?: string;
      tags?: string[];
      metadata?: any;
      reviewStatus?: string;
    }
  ) {
    // 查询原内容
    const oldContent = await db.content.findUnique({
      where: { id: contentId },
      select: {
        title: true,
        description: true,
        content: true,
        category: true,
        tags: true,
        metadata: true,
        reviewStatus: true
      }
    });

    if (!oldContent) {
      throw new Error('内容不存在');
    }

    // 更新内容
    const updated = await db.content.update({
      where: { id: contentId },
      data: {
        ...updates,
        lastEditedBy: userId,
        lastEditedAt: new Date()
      },
      include: {
        source: true,
        contentScore: true,
        // TODO: 等Prisma客户端更新后启用
        // editor: {
        //   select: {
        //     id: true,
        //     name: true
        //   }
        // }
      }
    });

    // 记录编辑日志
    await this.createAuditLog({
      contentId,
      userId,
      action: 'EDIT',
      changes: {
        old: oldContent,
        new: updates
      }
    });

    logger.info('内容详情已更新', { contentId, userId });

    return updated;
  }

  /**
   * 获取审核日志
   */
  async getAuditLog(contentId: string, limit: number = 50) {
    const logs = await db.contentAuditLog.findMany({
      where: { contentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return { logs };
  }

  /**
   * 获取审核统计数据
   */
  async getReviewStats(dateFrom?: Date, dateTo?: Date): Promise<ContentReviewStats> {
    // 构建日期筛选
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = dateFrom;
    if (dateTo) dateFilter.lte = dateTo;

    // 获取各状态数量
    const statusCounts = await db.content.groupBy({
      by: ['reviewStatus'],
      _count: true,
      where: dateFrom || dateTo ? { reviewedAt: dateFilter } : undefined
    });

    const byStatus = {
      pending: 0,
      approved: 0,
      rejected: 0,
      published: 0
    };

    statusCounts.forEach(item => {
      if (item.reviewStatus === 'PENDING_REVIEW') byStatus.pending = item._count;
      if (item.reviewStatus === 'APPROVED') byStatus.approved = item._count;
      if (item.reviewStatus === 'REJECTED') byStatus.rejected = item._count;
      if (item.reviewStatus === 'PUBLISHED') byStatus.published = item._count;
    });

    // 计算总审核数和通过率
    const totalReviewed = byStatus.approved + byStatus.rejected + byStatus.published;
    const approvalRate = totalReviewed > 0 
      ? ((byStatus.approved + byStatus.published) / totalReviewed) * 100 
      : 0;

    // 获取按审核员统计
    const reviewerStats = await db.content.groupBy({
      by: ['reviewedBy'],
      _count: true,
      where: {
        reviewedBy: { not: null },
        ...(dateFrom || dateTo ? { reviewedAt: dateFilter } : {})
      }
    });

    const byReviewer = await Promise.all(
      reviewerStats
        .filter(stat => stat.reviewedBy)
        .map(async (stat) => {
          const user = await db.user.findUnique({
            where: { id: stat.reviewedBy! },
            select: { name: true, email: true }
          });
          return {
            userId: stat.reviewedBy!,
            userName: user?.name || user?.email || 'Unknown',
            reviewCount: stat._count,
            avgTime: 0 // TODO: 计算平均审核时间需要更复杂的查询
          };
        })
    );

    // 获取按分类统计
    const categoryStats = await db.content.groupBy({
      by: ['category'],
      _count: true,
      where: {
        category: { not: null },
        ...(dateFrom || dateTo ? { reviewedAt: dateFilter } : {})
      }
    });

    const byCategory: Record<string, number> = {};
    categoryStats.forEach(stat => {
      if (stat.category) {
        byCategory[stat.category] = stat._count;
      }
    });

    return {
      totalReviewed,
      approvalRate,
      avgReviewTime: 0, // TODO: 实现平均审核时间计算
      byStatus,
      byReviewer,
      byCategory
    };
  }

  /**
   * 创建审核日志
   */
  private async createAuditLog(params: {
    contentId: string;
    userId: string;
    action: string;
    oldStatus?: string;
    newStatus?: string;
    changes?: any;
    notes?: string;
  }) {
    await db.contentAuditLog.create({
      data: {
        contentId: params.contentId,
        userId: params.userId,
        action: params.action,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        changes: params.changes,
        notes: params.notes,
        tableName: 'content',
        recordId: params.contentId
      }
    });
  }

  /**
   * 映射操作到状态
   */
  private mapActionToStatus(action: ReviewAction): string {
    switch (action) {
      case 'APPROVE':
        return 'APPROVED';
      case 'REJECT':
        return 'REJECTED';
      case 'PUBLISH':
        return 'PUBLISHED';
      default:
        throw new Error(`未知的操作: ${action}`);
    }
  }

  /**
   * 构建排序条件
   */
  private buildOrderBy(
    sortBy: string, 
    sortOrder: 'asc' | 'desc'
  ): Prisma.ContentOrderByWithRelationInput {
    const orderBy: Prisma.ContentOrderByWithRelationInput = {};
    
    switch (sortBy) {
      case 'score':
        orderBy.score = sortOrder;
        break;
      case 'title':
        orderBy.title = sortOrder;
        break;
      case 'reviewedAt':
        orderBy.reviewedAt = sortOrder;
        break;
      case 'createdAt':
      default:
        orderBy.createdAt = sortOrder;
        break;
    }

    return orderBy;
  }

  /**
   * 获取状态数量统计
   */
  private async getStatusCounts() {
    const counts = await db.content.groupBy({
      by: ['reviewStatus'],
      _count: true
    });

    const stats: Record<string, number> = {
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      publishedCount: 0
    };

    counts.forEach(item => {
      if (item.reviewStatus === 'PENDING_REVIEW') stats.pendingCount = item._count;
      if (item.reviewStatus === 'APPROVED') stats.approvedCount = item._count;
      if (item.reviewStatus === 'REJECTED') stats.rejectedCount = item._count;
      if (item.reviewStatus === 'PUBLISHED') stats.publishedCount = item._count;
    });

    return stats;
  }
}

// 导出单例
export const contentReviewService = new ContentReviewService();

