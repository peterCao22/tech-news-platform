import { db } from '../client';
import { Content, ContentStatus, Prisma } from '../generated';

export interface CreateContentData {
  title: string;
  description?: string;
  content?: string;
  url?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  sourceId: string;
  sourceUrl?: string;
  publishedAt?: Date;
  metadata?: Prisma.InputJsonValue;
}

export interface UpdateContentData {
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  status?: ContentStatus;
  score?: number;
  priority?: number;
  metadata?: Prisma.InputJsonValue;
}

export interface ContentFilter {
  status?: ContentStatus;
  sourceId?: string;
  category?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'publishedAt' | 'score' | 'priority';
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ContentRepository {
  /**
   * 创建新内容
   */
  async create(data: CreateContentData): Promise<Content> {
    return await db.content.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        imageUrl: data.imageUrl,
        category: data.category,
        tags: data.tags || [],
        sourceId: data.sourceId,
        sourceUrl: data.sourceUrl,
        publishedAt: data.publishedAt,
        metadata: data.metadata,
      },
      include: {
        source: true,
      },
    });
  }

  /**
   * 批量创建内容
   */
  async createMany(dataList: CreateContentData[]): Promise<{ count: number }> {
    return await db.content.createMany({
      data: dataList.map(data => ({
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        imageUrl: data.imageUrl,
        category: data.category,
        tags: data.tags || [],
        sourceId: data.sourceId,
        sourceUrl: data.sourceUrl,
        publishedAt: data.publishedAt,
        metadata: data.metadata,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * 根据ID获取内容
   */
  async findById(id: string): Promise<Content | null> {
    return await db.content.findUnique({
      where: { id },
      include: {
        source: true,
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
          orderBy: { createdAt: 'desc' },
        },
        contentTags: true,
      },
    });
  }

  /**
   * 分页获取内容列表
   */
  async findMany(
    filter?: ContentFilter,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Content>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.ContentWhereInput = {};

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.sourceId) {
      where.sourceId = filter.sourceId;
    }

    if (filter?.category) {
      where.category = filter.category;
    }

    if (filter?.tags && filter.tags.length > 0) {
      where.tags = {
        hasSome: filter.tags,
      };
    }

    if (filter?.dateFrom || filter?.dateTo) {
      where.publishedAt = {};
      if (filter.dateFrom) {
        where.publishedAt.gte = filter.dateFrom;
      }
      if (filter.dateTo) {
        where.publishedAt.lte = filter.dateTo;
      }
    }

    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { content: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // 构建排序条件
    const orderBy: Prisma.ContentOrderByWithRelationInput = {};
    const orderField = pagination?.orderBy || 'createdAt';
    const orderDirection = pagination?.orderDirection || 'desc';
    orderBy[orderField] = orderDirection;

    // 执行查询
    const [data, total] = await Promise.all([
      db.content.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          source: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      }),
      db.content.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 更新内容
   */
  async update(id: string, data: UpdateContentData): Promise<Content> {
    return await db.content.update({
      where: { id },
      data,
      include: {
        source: true,
      },
    });
  }

  /**
   * 删除内容
   */
  async delete(id: string): Promise<Content> {
    return await db.content.delete({
      where: { id },
    });
  }

  /**
   * 检查内容是否已存在（基于URL或标题）
   */
  async findDuplicate(title: string, url?: string): Promise<Content | null> {
    const where: Prisma.ContentWhereInput = {
      OR: [
        { title: { equals: title, mode: 'insensitive' } },
      ],
    };

    if (url) {
      where.OR!.push({ url });
    }

    return await db.content.findFirst({
      where,
      include: {
        source: true,
      },
    });
  }

  /**
   * 获取最近的内容（用于去重检查）
   */
  async findRecent(sourceId: string, hours: number = 24): Promise<Content[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return await db.content.findMany({
      where: {
        sourceId,
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取内容统计信息
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<ContentStatus, number>;
    bySource: Array<{ sourceId: string; sourceName: string; count: number }>;
    recentCount: number;
  }> {
    const [total, byStatus, bySourceRaw, recentCount] = await Promise.all([
      db.content.count(),
      db.content.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.content.groupBy({
        by: ['sourceId'],
        _count: true,
      }),
      db.content.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
          },
        },
      }),
    ]);

    const statusStats = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<ContentStatus, number>);

    // 获取源信息
    const sourceIds = bySourceRaw.map(item => item.sourceId);
    const sources = await db.source.findMany({
      where: { id: { in: sourceIds } },
      select: { id: true, name: true },
    });

    const sourceMap = sources.reduce((acc, source) => {
      acc[source.id] = source.name;
      return acc;
    }, {} as Record<string, string>);

    const bySource = bySourceRaw.map(item => ({
      sourceId: item.sourceId,
      sourceName: sourceMap[item.sourceId] || 'Unknown',
      count: item._count,
    }));

    return {
      total,
      byStatus: statusStats,
      bySource,
      recentCount,
    };
  }

  /**
   * 更新内容状态
   */
  async updateStatus(id: string, status: ContentStatus): Promise<Content> {
    return await db.content.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * 批量更新内容状态
   */
  async updateManyStatus(ids: string[], status: ContentStatus): Promise<{ count: number }> {
    return await db.content.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: { status },
    });
  }
}

export const contentRepository = new ContentRepository();
