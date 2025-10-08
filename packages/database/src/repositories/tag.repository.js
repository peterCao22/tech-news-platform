/**
 * 标签仓库 - 管理标签的CRUD操作
 * 支持层级标签结构和使用统计
 */
import { Prisma } from '../generated';
import { BaseRepository } from './base.repository';
export class TagRepository extends BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    /**
     * 创建新标签
     */
    async create(data) {
        try {
            const tag = await this.prisma.tag.create({
                data: {
                    ...data,
                    usageCount: 0,
                },
                include: {
                    parent: true,
                    children: true,
                    _count: {
                        select: {
                            contentTags: true,
                            children: true,
                        },
                    },
                },
            });
            return tag;
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new Error(`标签名称 "${data.name}" 或标识符 "${data.slug}" 已存在`);
                }
            }
            throw error;
        }
    }
    /**
     * 根据ID获取标签
     */
    async findById(id) {
        return this.prisma.tag.findUnique({
            where: { id },
            include: {
                parent: true,
                children: true,
                _count: {
                    select: {
                        contentTags: true,
                        children: true,
                    },
                },
            },
        });
    }
    /**
     * 根据名称获取标签
     */
    async findByName(name) {
        return this.prisma.tag.findUnique({
            where: { name },
            include: {
                parent: true,
                children: true,
            },
        });
    }
    /**
     * 根据标识符获取标签
     */
    async findBySlug(slug) {
        return this.prisma.tag.findUnique({
            where: { slug },
            include: {
                parent: true,
                children: true,
            },
        });
    }
    /**
     * 获取标签列表
     */
    async findMany(filters = {}, options = {}) {
        const { page = 1, limit = 20, orderBy = [{ usageCount: 'desc' }, { name: 'asc' }] } = options;
        const skip = (page - 1) * limit;
        // 构建查询条件
        const where = {};
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.parentId !== undefined) {
            where.parentId = filters.parentId;
        }
        if (filters.hasParent !== undefined) {
            where.parentId = filters.hasParent ? { not: null } : null;
        }
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [tags, total] = await Promise.all([
            this.prisma.tag.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    parent: true,
                    children: true,
                    _count: {
                        select: {
                            contentTags: true,
                            children: true,
                        },
                    },
                },
            }),
            this.prisma.tag.count({ where }),
        ]);
        return {
            tags,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * 获取根标签（没有父标签的标签）
     */
    async findRootTags(type) {
        const where = {
            parentId: null,
        };
        if (type) {
            where.type = type;
        }
        return this.prisma.tag.findMany({
            where,
            orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
            include: {
                children: {
                    include: {
                        _count: {
                            select: {
                                contentTags: true,
                                children: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        contentTags: true,
                        children: true,
                    },
                },
            },
        });
    }
    /**
     * 获取标签的子标签
     */
    async findChildren(parentId) {
        return this.prisma.tag.findMany({
            where: { parentId },
            orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
            include: {
                children: true,
                _count: {
                    select: {
                        contentTags: true,
                        children: true,
                    },
                },
            },
        });
    }
    /**
     * 获取标签路径（从根到当前标签）
     */
    async getTagPath(tagId) {
        const path = [];
        let currentTag = await this.findById(tagId);
        while (currentTag) {
            path.unshift(currentTag);
            if (currentTag.parentId) {
                currentTag = await this.findById(currentTag.parentId);
            }
            else {
                break;
            }
        }
        return path;
    }
    /**
     * 更新标签
     */
    async update(id, data) {
        try {
            return await this.prisma.tag.update({
                where: { id },
                data,
                include: {
                    parent: true,
                    children: true,
                },
            });
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new Error(`标签名称或标识符已存在`);
                }
                if (error.code === 'P2025') {
                    throw new Error(`标签不存在`);
                }
            }
            throw error;
        }
    }
    /**
     * 增加标签使用次数
     */
    async incrementUsage(tagId) {
        await this.prisma.tag.update({
            where: { id: tagId },
            data: {
                usageCount: {
                    increment: 1,
                },
            },
        });
    }
    /**
     * 减少标签使用次数
     */
    async decrementUsage(tagId) {
        await this.prisma.tag.update({
            where: { id: tagId },
            data: {
                usageCount: {
                    decrement: 1,
                },
            },
        });
    }
    /**
     * 批量更新标签使用次数
     */
    async updateUsageCounts() {
        // 重新计算所有标签的使用次数
        const tagUsage = await this.prisma.contentTag.groupBy({
            by: ['tagId'],
            _count: {
                tagId: true,
            },
        });
        // 批量更新
        const updatePromises = tagUsage.map(({ tagId, _count }) => this.prisma.tag.update({
            where: { id: tagId },
            data: { usageCount: _count.tagId },
        }));
        await Promise.all(updatePromises);
    }
    /**
     * 删除标签
     */
    async delete(id) {
        try {
            // 检查是否有子标签
            const childrenCount = await this.prisma.tag.count({
                where: { parentId: id },
            });
            if (childrenCount > 0) {
                throw new Error('无法删除有子标签的标签，请先删除或移动子标签');
            }
            // 检查是否有内容使用此标签
            const contentCount = await this.prisma.contentTag.count({
                where: { tagId: id },
            });
            if (contentCount > 0) {
                throw new Error('无法删除正在使用的标签，请先移除相关内容的标签');
            }
            await this.prisma.tag.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new Error('标签不存在');
                }
            }
            throw error;
        }
    }
    /**
     * 获取热门标签
     */
    async getPopularTags(limit = 20, type) {
        const where = {
            usageCount: { gt: 0 },
        };
        if (type) {
            where.type = type;
        }
        return this.prisma.tag.findMany({
            where,
            orderBy: { usageCount: 'desc' },
            take: limit,
            include: {
                parent: true,
                _count: {
                    select: {
                        contentTags: true,
                        children: true,
                    },
                },
            },
        });
    }
    /**
     * 搜索标签建议
     */
    async searchSuggestions(query, limit = 10, type) {
        const where = {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ],
        };
        if (type) {
            where.type = type;
        }
        return this.prisma.tag.findMany({
            where,
            orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
            take: limit,
        });
    }
    /**
     * 获取标签统计信息
     */
    async getStatistics() {
        const [totalTags, tagsByType, topTags, unusedTags] = await Promise.all([
            this.prisma.tag.count(),
            this.prisma.tag.groupBy({
                by: ['type'],
                _count: { type: true },
            }),
            this.getPopularTags(10),
            this.prisma.tag.count({ where: { usageCount: 0 } }),
        ]);
        const typeStats = tagsByType.reduce((acc, { type, _count }) => {
            acc[type] = _count.type;
            return acc;
        }, {});
        return {
            totalTags,
            tagsByType: typeStats,
            topTags,
            unusedTags,
        };
    }
}
