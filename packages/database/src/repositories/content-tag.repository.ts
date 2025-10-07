/**
 * 内容标签关联仓库 - 管理内容和标签的多对多关系
 */

import { PrismaClient, ContentTag, Prisma } from '../generated';
import { BaseRepository } from './base.repository';

export interface CreateContentTagData {
  contentId: string;
  tagId: string;
  relevance?: number;
}

export class ContentTagRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * 为内容添加标签
   */
  async addTagToContent(contentId: string, tagId: string, relevance: number = 1.0): Promise<ContentTag> {
    try {
      return await this.prisma.contentTag.create({
        data: {
          contentId,
          tagId,
          relevance,
        },
        include: {
          content: true,
          tag: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('该内容已经有此标签');
        }
      }
      throw error;
    }
  }

  /**
   * 从内容中移除标签
   */
  async removeTagFromContent(contentId: string, tagId: string): Promise<void> {
    try {
      await this.prisma.contentTag.delete({
        where: {
          contentId_tagId: {
            contentId,
            tagId,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('内容标签关联不存在');
        }
      }
      throw error;
    }
  }

  /**
   * 获取内容的所有标签
   */
  async getContentTags(contentId: string): Promise<ContentTag[]> {
    return this.prisma.contentTag.findMany({
      where: { contentId },
      include: {
        tag: true,
      },
      orderBy: {
        relevance: 'desc',
      },
    });
  }

  /**
   * 获取标签的所有内容
   */
  async getTagContents(tagId: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
    contentTags: ContentTag[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [contentTags, total] = await Promise.all([
      this.prisma.contentTag.findMany({
        where: { tagId },
        skip,
        take: limit,
        include: {
          content: {
            include: {
              source: true,
            },
          },
        },
        orderBy: [
          { relevance: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.contentTag.count({
        where: { tagId },
      }),
    ]);

    return {
      contentTags,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 批量添加标签到内容
   */
  async batchAddTagsToContent(contentId: string, tagIds: string[]): Promise<ContentTag[]> {
    const createData = tagIds.map(tagId => ({
      contentId,
      tagId,
      relevance: 1.0,
    }));

    try {
      // 使用 createMany 进行批量插入
      await this.prisma.contentTag.createMany({
        data: createData,
        skipDuplicates: true, // 跳过重复的关联
      });

      // 返回创建的关联
      return this.prisma.contentTag.findMany({
        where: {
          contentId,
          tagId: { in: tagIds },
        },
        include: {
          tag: true,
        },
      });
    } catch (error) {
      throw new Error(`批量添加标签失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量移除内容的标签
   */
  async batchRemoveTagsFromContent(contentId: string, tagIds: string[]): Promise<void> {
    await this.prisma.contentTag.deleteMany({
      where: {
        contentId,
        tagId: { in: tagIds },
      },
    });
  }

  /**
   * 更新内容标签的相关性
   */
  async updateRelevance(contentId: string, tagId: string, relevance: number): Promise<ContentTag> {
    try {
      return await this.prisma.contentTag.update({
        where: {
          contentId_tagId: {
            contentId,
            tagId,
          },
        },
        data: { relevance },
        include: {
          content: true,
          tag: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('内容标签关联不存在');
        }
      }
      throw error;
    }
  }

  /**
   * 检查内容是否有指定标签
   */
  async hasTag(contentId: string, tagId: string): Promise<boolean> {
    const count = await this.prisma.contentTag.count({
      where: {
        contentId,
        tagId,
      },
    });
    return count > 0;
  }

  /**
   * 获取内容标签统计
   */
  async getContentTagStats(contentId: string): Promise<{
    totalTags: number;
    tagsByType: Record<string, number>;
    averageRelevance: number;
  }> {
    const contentTags = await this.prisma.contentTag.findMany({
      where: { contentId },
      include: {
        tag: true,
      },
    });

    const totalTags = contentTags.length;
    const tagsByType = contentTags.reduce((acc, ct) => {
      const type = ct.tag.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageRelevance = totalTags > 0
      ? contentTags.reduce((sum, ct) => sum + (ct.relevance || 1), 0) / totalTags
      : 0;

    return {
      totalTags,
      tagsByType,
      averageRelevance,
    };
  }

  /**
   * 获取标签使用统计
   */
  async getTagUsageStats(tagId: string): Promise<{
    totalContent: number;
    averageRelevance: number;
    recentUsage: number;
  }> {
    const [totalContent, contentTags, recentUsage] = await Promise.all([
      this.prisma.contentTag.count({
        where: { tagId },
      }),
      this.prisma.contentTag.findMany({
        where: { tagId },
        select: { relevance: true },
      }),
      this.prisma.contentTag.count({
        where: {
          tagId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
          },
        },
      }),
    ]);

    const averageRelevance = totalContent > 0
      ? contentTags.reduce((sum, ct) => sum + (ct.relevance || 1), 0) / totalContent
      : 0;

    return {
      totalContent,
      averageRelevance,
      recentUsage,
    };
  }

  /**
   * 查找相似内容（基于共同标签）
   */
  async findSimilarContent(contentId: string, limit: number = 5): Promise<{
    contentId: string;
    similarity: number;
    commonTags: number;
  }[]> {
    // 获取当前内容的标签
    const currentContentTags = await this.prisma.contentTag.findMany({
      where: { contentId },
      select: { tagId: true },
    });

    if (currentContentTags.length === 0) {
      return [];
    }

    const currentTagIds = currentContentTags.map(ct => ct.tagId);

    // 查找有共同标签的其他内容
    const similarContent = await this.prisma.contentTag.groupBy({
      by: ['contentId'],
      where: {
        tagId: { in: currentTagIds },
        contentId: { not: contentId },
      },
      _count: {
        tagId: true,
      },
      having: {
        tagId: {
          _count: {
            gt: 0,
          },
        },
      },
      orderBy: {
        _count: {
          tagId: 'desc',
        },
      },
      take: limit,
    });

    return similarContent.map(sc => ({
      contentId: sc.contentId,
      similarity: sc._count.tagId / currentTagIds.length,
      commonTags: sc._count.tagId,
    }));
  }

  /**
   * 清理孤立的内容标签关联
   */
  async cleanupOrphanedAssociations(): Promise<number> {
    // 使用原始SQL查询来删除孤立的关联
    const deletedContentAssociations = await this.prisma.$executeRaw`
      DELETE FROM content_tags 
      WHERE content_id NOT IN (SELECT id FROM content)
    `;

    const deletedTagAssociations = await this.prisma.$executeRaw`
      DELETE FROM content_tags 
      WHERE tag_id NOT IN (SELECT id FROM tags)
    `;

    return Number(deletedContentAssociations) + Number(deletedTagAssociations);
  }

  /**
   * 获取热门标签组合
   */
  async getPopularTagCombinations(limit: number = 10): Promise<{
    tags: string[];
    count: number;
  }[]> {
    // 这是一个复杂的查询，需要使用原始SQL
    const result = await this.prisma.$queryRaw<{
      tag_names: string;
      content_count: bigint;
    }[]>`
      SELECT 
        STRING_AGG(t.name, ',' ORDER BY t.name) as tag_names,
        COUNT(DISTINCT ct1.content_id) as content_count
      FROM content_tags ct1
      JOIN content_tags ct2 ON ct1.content_id = ct2.content_id AND ct1.tag_id < ct2.tag_id
      JOIN tags t ON t.id IN (ct1.tag_id, ct2.tag_id)
      GROUP BY ct1.content_id
      HAVING COUNT(DISTINCT ct1.tag_id) >= 2
      ORDER BY content_count DESC
      LIMIT ${limit}
    `;

    return result.map(r => ({
      tags: r.tag_names.split(','),
      count: Number(r.content_count),
    }));
  }
}
