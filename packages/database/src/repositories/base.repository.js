/**
 * 基础仓库类 - 提供通用的数据库操作方法
 */
export class BaseRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 开始事务
     */
    async transaction(callback) {
        return this.prisma.$transaction(callback);
    }
    /**
     * 执行原始SQL查询
     */
    async executeRaw(sql, ...values) {
        return this.prisma.$executeRaw `${sql}`;
    }
    /**
     * 查询原始SQL
     */
    async queryRaw(sql, ...values) {
        return this.prisma.$queryRaw `${sql}`;
    }
    /**
     * 检查记录是否存在
     */
    async exists(model, where) {
        const count = await this.prisma[model].count({ where });
        return count > 0;
    }
    /**
     * 获取分页信息
     */
    getPaginationInfo(total, page, limit) {
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
    buildOrderBy(sortBy, sortOrder = 'desc') {
        if (!sortBy)
            return undefined;
        return {
            [sortBy]: sortOrder,
        };
    }
    /**
     * 构建搜索条件
     */
    buildSearchCondition(fields, query) {
        if (!query || !fields.length)
            return undefined;
        return {
            OR: fields.map(field => ({
                [field]: {
                    contains: query,
                    mode: 'insensitive',
                },
            })),
        };
    }
}
