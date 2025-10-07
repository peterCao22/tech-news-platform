/**
 * 基础仓库类 - 提供通用的数据库操作方法
 */

import { PrismaClient } from '../generated';

export abstract class BaseRepository {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 开始事务
   */
  async transaction<T>(callback: (prisma: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  /**
   * 执行原始SQL查询
   */
  async executeRaw(sql: string, ...values: any[]): Promise<any> {
    return this.prisma.$executeRaw`${sql}`;
  }

  /**
   * 查询原始SQL
   */
  async queryRaw(sql: string, ...values: any[]): Promise<any> {
    return this.prisma.$queryRaw`${sql}`;
  }

  /**
   * 检查记录是否存在
   */
  async exists(model: string, where: any): Promise<boolean> {
    const count = await (this.prisma as any)[model].count({ where });
    return count > 0;
  }

  /**
   * 获取分页信息
   */
  protected getPaginationInfo(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * 构建排序条件
   */
  protected buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    if (!sortBy) return undefined;
    
    return {
      [sortBy]: sortOrder,
    };
  }

  /**
   * 构建搜索条件
   */
  protected buildSearchCondition(fields: string[], query: string) {
    if (!query || !fields.length) return undefined;

    return {
      OR: fields.map(field => ({
        [field]: {
          contains: query,
          mode: 'insensitive' as const,
        },
      })),
    };
  }
}
