/**
 * 基础仓库类 - 提供通用的数据库操作方法
 */
import { PrismaClient } from '../generated';
export declare abstract class BaseRepository {
    protected prisma: PrismaClient;
    constructor(prisma: PrismaClient);
    /**
     * 开始事务
     */
    transaction<T>(callback: (prisma: any) => Promise<T>): Promise<T>;
    /**
     * 执行原始SQL查询
     */
    executeRaw(sql: string, ...values: any[]): Promise<any>;
    /**
     * 查询原始SQL
     */
    queryRaw(sql: string, ...values: any[]): Promise<any>;
    /**
     * 检查记录是否存在
     */
    exists(model: string, where: any): Promise<boolean>;
    /**
     * 获取分页信息
     */
    protected getPaginationInfo(total: number, page: number, limit: number): {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    /**
     * 构建排序条件
     */
    protected buildOrderBy(sortBy?: string, sortOrder?: 'asc' | 'desc'): {
        [x: string]: "desc" | "asc";
    } | undefined;
    /**
     * 构建搜索条件
     */
    protected buildSearchCondition(fields: string[], query: string): {
        OR: {
            [x: string]: {
                contains: string;
                mode: "insensitive";
            };
        }[];
    } | undefined;
}
