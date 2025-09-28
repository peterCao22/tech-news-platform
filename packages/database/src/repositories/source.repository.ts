import { db } from '../client';
import { Source, SourceType, SourceStatus, Prisma } from '../generated';

export interface CreateSourceData {
  name: string;
  type: SourceType;
  url?: string;
  config?: Prisma.InputJsonValue;
  status?: SourceStatus;
}

export interface UpdateSourceData {
  name?: string;
  url?: string;
  config?: Prisma.InputJsonValue;
  status?: SourceStatus;
  lastFetchAt?: Date;
  fetchCount?: number;
  errorCount?: number;
  lastError?: string | null;
}

export interface SourceFilter {
  type?: SourceType;
  status?: SourceStatus;
  enabled?: boolean;
}

export class SourceRepository {
  /**
   * 创建新的信息源
   */
  async create(data: CreateSourceData): Promise<Source> {
    return await db.source.create({
      data: {
        name: data.name,
        type: data.type,
        url: data.url,
        config: data.config,
        status: data.status || SourceStatus.ACTIVE,
      },
    });
  }

  /**
   * 根据ID获取信息源
   */
  async findById(id: string): Promise<Source | null> {
    return await db.source.findUnique({
      where: { id },
      include: {
        content: {
          orderBy: { createdAt: 'desc' },
          take: 5, // 最近5条内容
        },
      },
    });
  }

  /**
   * 获取所有信息源（支持筛选）
   */
  async findMany(filter?: SourceFilter): Promise<Source[]> {
    const where: Prisma.SourceWhereInput = {};

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    return await db.source.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { content: true },
        },
      },
    });
  }

  /**
   * 获取活跃的RSS源
   */
  async findActiveRssSources(): Promise<Source[]> {
    return await db.source.findMany({
      where: {
        type: SourceType.RSS,
        status: SourceStatus.ACTIVE,
      },
      orderBy: { lastFetchAt: 'asc' }, // 最久未抓取的优先
    });
  }

  /**
   * 更新信息源
   */
  async update(id: string, data: UpdateSourceData): Promise<Source> {
    return await db.source.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除信息源
   */
  async delete(id: string): Promise<Source> {
    return await db.source.delete({
      where: { id },
    });
  }

  /**
   * 更新抓取统计信息
   */
  async updateFetchStats(id: string, success: boolean, error?: string): Promise<Source> {
    const updateData: UpdateSourceData = {
      lastFetchAt: new Date(),
      fetchCount: { increment: 1 } as any,
    };

    if (success) {
      updateData.status = SourceStatus.ACTIVE;
      updateData.lastError = null;
    } else {
      updateData.errorCount = { increment: 1 } as any;
      updateData.lastError = error;
      updateData.status = SourceStatus.ERROR;
    }

    return await db.source.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 获取源统计信息
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    error: number;
    byType: Record<SourceType, number>;
  }> {
    const [total, active, error, byType] = await Promise.all([
      db.source.count(),
      db.source.count({ where: { status: SourceStatus.ACTIVE } }),
      db.source.count({ where: { status: SourceStatus.ERROR } }),
      db.source.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    const typeStats = byType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<SourceType, number>);

    return {
      total,
      active,
      error,
      byType: typeStats,
    };
  }
}

export const sourceRepository = new SourceRepository();
