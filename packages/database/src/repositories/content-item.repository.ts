/**
 * 内容仓库 - 管理内容的CRUD操作、去重、搜索和版本控制
 */

import { PrismaClient, Content, ContentStatus, ContentType, Prisma } from '../generated';
import { BaseRepository } from './base.repository';
import { createHash } from 'crypto';

export interface CreateContentData {
  title: string;
  description?: string;
  content?: string;
  summary?: string;
  url?: string;
  imageUrl?: string;
  type?: ContentType;
  category?: string;
  tags?: string[];
  sourceId: string;
  sourceUrl?: string;
  publishedAt?: Date;
  author?: string;
  metadata?: any;
}

export interface UpdateContentData {
  title?: string;
  description?: string;
  content?: string;
  summary?: string;
  url?: string;
  imageUrl?: string;
  type?: ContentType;
  category?: string;
  tags?: string[];
  status?: ContentStatus;
  score?: number;
  priority?: number;
  quality?: number;
  relevance?: number;
  author?: string;
  metadata?: any;
}

export interface ContentSearchFilters {
  status?: ContentStatus;
  type?: ContentType;
  category?: string;
  tags?: string[];
  sourceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  minScore?: number;
  maxScore?: number;
  priority?: number;
}

export interface ContentWithRelations extends Content {
  source?: any;
  contentTags?: any[];
  reviews?: any[];
  versions?: any[];
  _count?: {
    contentTags: number;
    reviews: number;
    versions: number;
  };
}

export interface DuplicationCheckResult {
  isDuplicate: boolean;
  duplicateId?: string;
  similarity?: number;
  method?: string;
}

export class ContentItemRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * 创建内容哈希
   */
  private createContentHash(content: string): string {
    return createHash('sha256').update(content.toLowerCase().trim()).digest('hex');
  }

  /**
   * 创建标题哈希
   */
  private createTitleHash(title: string): string {
    return createHash('sha256').update(title.toLowerCase().trim()).digest('hex');
  }

  /**
   * 检查内容是否重复
   */
  async checkDuplication(title: string, content?: string, url?: string): Promise<DuplicationCheckResult> {
    const titleHash = this.createTitleHash(title);
    const contentHash = content ? this.createContentHash(content) : null;

    // 1. 检查URL重复
    if (url) {
      const urlDuplicate = await this.prisma.content.findFirst({
        where: { url },
        select: { id: true },
      });
      
      if (urlDuplicate) {
        return {
          isDuplicate: true,
          duplicateId: urlDuplicate.id,
          similarity: 1.0,
          method: 'URL',
        };
      }
    }

    // 2. 检查标题哈希重复
    const titleDuplicate = await this.prisma.content.findFirst({
      where: { titleHash },
      select: { id: true, title: true },
    });

    if (titleDuplicate) {
      return {
        isDuplicate: true,
        duplicateId: titleDuplicate.id,
        similarity: 1.0,
        method: 'TITLE_HASH',
      };
    }

    // 3. 检查内容哈希重复
    if (contentHash) {
      const contentDuplicate = await this.prisma.content.findFirst({
        where: { contentHash },
        select: { id: true },
      });

      if (contentDuplicate) {
        return {
          isDuplicate: true,
          duplicateId: contentDuplicate.id,
          similarity: 1.0,
          method: 'CONTENT_HASH',
        };
      }
    }

    // 4. 检查标题相似度（简单的词汇重叠检查）
    const similarTitles = await this.prisma.content.findMany({
      where: {
        title: {
          contains: title.split(' ')[0], // 使用第一个词进行粗略匹配
          mode: 'insensitive',
        },
      },
      select: { id: true, title: true },
      take: 10,
    });

    for (const similar of similarTitles) {
      const similarity = this.calculateTitleSimilarity(title, similar.title);
      if (similarity > 0.8) {
        return {
          isDuplicate: true,
          duplicateId: similar.id,
          similarity,
          method: 'TITLE_SIMILARITY',
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * 计算标题相似度（简单的Jaccard相似度）
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = new Set(title1.toLowerCase().split(/\s+/));
    const words2 = new Set(title2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 创建内容
   */
  async create(data: CreateContentData, userId?: string): Promise<Content> {
    // 检查重复
    const duplicationCheck = await this.checkDuplication(data.title, data.content, data.url);
    
    if (duplicationCheck.isDuplicate) {
      // 跳过记录重复检测结果到数据库（避免约束违规）
      // 直接抛出错误，让调用者处理
      throw new Error(`检测到重复内容，相似度: ${(duplicationCheck.similarity! * 100).toFixed(1)}%`);
    }

    const contentHash = data.content ? this.createContentHash(data.content) : null;
    const titleHash = this.createTitleHash(data.title);

    const content = await this.prisma.content.create({
      data: {
        ...data,
        contentHash,
        titleHash,
        status: ContentStatus.RAW,
        type: data.type || ContentType.NEWS,
        priority: 0,
        viewCount: 0,
        shareCount: 0,
      },
      include: {
        source: true,
        contentTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 创建版本记录
    await this.createVersion(content.id, {
      title: content.title,
      description: content.description,
      contentText: content.content,
      summary: content.summary,
      tags: content.tags,
      metadata: content.metadata,
      changeType: 'CREATE',
      changeNote: '初始创建',
      changedBy: userId,
    });

    // 创建审计日志
    await this.createAuditLog(content.id, userId, 'CREATE', 'content', content.id, null, content);

    return content;
  }

  /**
   * 根据ID获取内容
   */
  async findById(id: string, includeRelations: boolean = true): Promise<ContentWithRelations | null> {
    const include = includeRelations ? {
      source: true,
      contentTags: {
        include: {
          tag: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          contentTags: true,
          reviews: true,
          versions: true,
        },
      },
    } : undefined;

    return this.prisma.content.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * 获取内容列表
   */
  async findMany(filters: ContentSearchFilters = {}, options: {
    page?: number;
    limit?: number;
    orderBy?: Prisma.ContentOrderByWithRelationInput[];
    includeRelations?: boolean;
  } = {}): Promise<{
    content: ContentWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { 
      page = 1, 
      limit = 20, 
      orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      includeRelations = true 
    } = options;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.ContentWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.sourceId) {
      where.sourceId = filters.sourceId;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.contentTags = {
        some: {
          tag: {
            name: {
              in: filters.tags,
            },
          },
        },
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.publishedAt = {};
      if (filters.dateFrom) {
        where.publishedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.publishedAt.lte = filters.dateTo;
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { keywords: { has: filters.search } },
      ];
    }

    if (filters.minScore !== undefined || filters.maxScore !== undefined) {
      where.score = {};
      if (filters.minScore !== undefined) {
        where.score.gte = filters.minScore;
      }
      if (filters.maxScore !== undefined) {
        where.score.lte = filters.maxScore;
      }
    }

    if (filters.priority !== undefined) {
      where.priority = filters.priority;
    }

    const include = includeRelations ? {
      source: true,
      contentTags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          contentTags: true,
          reviews: true,
          versions: true,
        },
      },
    } : undefined;

    const [content, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      content,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 更新内容
   */
  async update(id: string, data: UpdateContentData, userId?: string): Promise<Content> {
    const existingContent = await this.findById(id, false);
    if (!existingContent) {
      throw new Error('内容不存在');
    }

    // 如果更新了标题或内容，重新计算哈希
    const updateData: any = { ...data };
    if (data.title) {
      updateData.titleHash = this.createTitleHash(data.title);
    }
    if (data.content) {
      updateData.contentHash = this.createContentHash(data.content);
    }

    const updatedContent = await this.prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        source: true,
        contentTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 创建版本记录
    await this.createVersion(id, {
      title: updatedContent.title,
      description: updatedContent.description,
      contentText: updatedContent.content,
      summary: updatedContent.summary,
      tags: updatedContent.tags,
      metadata: updatedContent.metadata,
      changeType: 'UPDATE',
      changeNote: '内容更新',
      changedBy: userId,
    });

    // 创建审计日志
    await this.createAuditLog(id, userId, 'UPDATE', 'content', id, existingContent, updatedContent);

    return updatedContent;
  }

  /**
   * 删除内容
   */
  async delete(id: string, userId?: string): Promise<void> {
    const existingContent = await this.findById(id, false);
    if (!existingContent) {
      throw new Error('内容不存在');
    }

    await this.prisma.content.delete({
      where: { id },
    });

    // 创建审计日志
    await this.createAuditLog(id, userId, 'DELETE', 'content', id, existingContent, null);
  }

  /**
   * 批量更新内容状态
   */
  async updateStatus(ids: string[], status: ContentStatus, userId?: string): Promise<void> {
    await this.prisma.content.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    // 为每个内容创建审计日志
    const auditPromises = ids.map(id =>
      this.createAuditLog(id, userId, 'UPDATE_STATUS', 'content', id, { status: 'previous' }, { status })
    );

    await Promise.all(auditPromises);
  }

  /**
   * 增加浏览次数
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.content.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * 增加分享次数
   */
  async incrementShareCount(id: string): Promise<void> {
    await this.prisma.content.update({
      where: { id },
      data: {
        shareCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * 创建版本记录
   */
  private async createVersion(contentId: string, versionData: {
    title: string;
    description?: string | null;
    contentText?: string | null;
    summary?: string | null;
    tags: string[];
    metadata?: any;
    changeType: string;
    changeNote?: string;
    changedBy?: string;
  }): Promise<void> {
    // 获取下一个版本号
    const lastVersion = await this.prisma.contentVersion.findFirst({
      where: { contentId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (lastVersion?.version || 0) + 1;

    await this.prisma.contentVersion.create({
      data: {
        contentId,
        version: nextVersion,
        ...versionData,
      },
    });
  }

  /**
   * 创建审计日志
   */
  private async createAuditLog(
    contentId: string,
    userId: string | undefined,
    action: string,
    tableName: string,
    recordId: string,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    await this.prisma.contentAuditLog.create({
      data: {
        contentId,
        userId,
        action,
        tableName,
        recordId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      },
    });
  }

  /**
   * 获取内容统计信息
   */
  async getStatistics(): Promise<{
    totalContent: number;
    contentByStatus: Record<ContentStatus, number>;
    contentByType: Record<ContentType, number>;
    recentContent: number;
    duplicateContent: number;
  }> {
    const [
      totalContent,
      contentByStatus,
      contentByType,
      recentContent,
      duplicateContent,
    ] = await Promise.all([
      this.prisma.content.count(),
      this.prisma.content.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.content.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      this.prisma.content.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
          },
        },
      }),
      this.prisma.content.count({
        where: { status: ContentStatus.DUPLICATE },
      }),
    ]);

    const statusStats = contentByStatus.reduce((acc, { status, _count }) => {
      acc[status] = _count.status;
      return acc;
    }, {} as Record<ContentStatus, number>);

    const typeStats = contentByType.reduce((acc, { type, _count }) => {
      acc[type] = _count.type;
      return acc;
    }, {} as Record<ContentType, number>);

    return {
      totalContent,
      contentByStatus: statusStats,
      contentByType: typeStats,
      recentContent,
      duplicateContent,
    };
  }
}
