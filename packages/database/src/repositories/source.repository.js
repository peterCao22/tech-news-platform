import { db } from '../client';
import { SourceType, SourceStatus } from '../generated';
export class SourceRepository {
    /**
     * 创建新的信息源
     */
    async create(data) {
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
    async findById(id) {
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
    async findMany(filter) {
        const where = {};
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
    async findActiveRssSources() {
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
    async update(id, data) {
        return await db.source.update({
            where: { id },
            data,
        });
    }
    /**
     * 删除信息源
     */
    async delete(id) {
        return await db.source.delete({
            where: { id },
        });
    }
    /**
     * 更新抓取统计信息
     */
    async updateFetchStats(id, success, error) {
        const updateData = {
            lastFetchAt: new Date(),
            fetchCount: { increment: 1 },
        };
        if (success) {
            updateData.status = SourceStatus.ACTIVE;
            updateData.lastError = null;
        }
        else {
            updateData.errorCount = { increment: 1 };
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
    async getStats() {
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
        }, {});
        return {
            total,
            active,
            error,
            byType: typeStats,
        };
    }
}
export const sourceRepository = new SourceRepository();
