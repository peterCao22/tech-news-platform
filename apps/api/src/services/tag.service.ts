/**
 * 标签管理服务
 * 提供标签的业务逻辑处理
 */

import { 
  TagRepository, 
  CreateTagData, 
  UpdateTagData, 
  TagSearchFilters,
  TagWithUsage
} from '@tech-news-platform/database';
import { prisma } from '@tech-news-platform/database';
import { TagType } from '@tech-news-platform/database';

export class TagService {
  private tagRepository: TagRepository;

  constructor() {
    this.tagRepository = new TagRepository(prisma);
  }

  /**
   * 获取标签列表
   */
  async getTags(filters: TagSearchFilters = {}, options: {
    page?: number;
    limit?: number;
    orderBy?: any[];
  } = {}) {
    return this.tagRepository.findMany(filters, options);
  }

  /**
   * 根据ID获取标签
   */
  async getTagById(id: string): Promise<TagWithUsage | null> {
    return this.tagRepository.findById(id);
  }

  /**
   * 创建标签
   */
  async createTag(data: CreateTagData) {
    // 验证标识符格式
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      throw new Error('标识符只能包含小写字母、数字和连字符');
    }

    return this.tagRepository.create(data);
  }

  /**
   * 更新标签
   */
  async updateTag(id: string, data: UpdateTagData) {
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      throw new Error('标识符只能包含小写字母、数字和连字符');
    }

    return this.tagRepository.update(id, data);
  }

  /**
   * 删除标签
   */
  async deleteTag(id: string): Promise<void> {
    return this.tagRepository.delete(id);
  }

  /**
   * 获取根标签
   */
  async getRootTags(type?: TagType): Promise<TagWithUsage[]> {
    return this.tagRepository.findRootTags(type);
  }

  /**
   * 获取子标签
   */
  async getChildTags(parentId: string): Promise<TagWithUsage[]> {
    return this.tagRepository.findChildren(parentId);
  }

  /**
   * 获取标签路径
   */
  async getTagPath(tagId: string) {
    return this.tagRepository.getTagPath(tagId);
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit: number = 20, type?: TagType): Promise<TagWithUsage[]> {
    return this.tagRepository.getPopularTags(limit, type);
  }

  /**
   * 搜索标签建议
   */
  async searchSuggestions(query: string, limit: number = 10, type?: TagType) {
    return this.tagRepository.searchSuggestions(query, limit, type);
  }

  /**
   * 获取标签统计信息
   */
  async getStatistics() {
    return this.tagRepository.getStatistics();
  }

  /**
   * 批量创建标签
   */
  async batchCreateTags(tags: CreateTagData[]) {
    const results = [];
    const errors = [];

    for (const tagData of tags) {
      try {
        const tag = await this.createTag(tagData);
        results.push(tag);
      } catch (error) {
        errors.push({
          tagData,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return {
      success: results,
      errors,
      successCount: results.length,
      errorCount: errors.length,
    };
  }

  /**
   * 更新所有标签的使用次数
   */
  async updateAllUsageCounts(): Promise<void> {
    return this.tagRepository.updateUsageCounts();
  }

  /**
   * 获取标签树结构
   */
  async getTagTree(type?: TagType): Promise<TagWithUsage[]> {
    const rootTags = await this.tagRepository.findRootTags(type);
    
    // 递归获取子标签
    const buildTree = async (tags: TagWithUsage[]): Promise<TagWithUsage[]> => {
      const result = [];
      
      for (const tag of tags) {
        const children = await this.tagRepository.findChildren(tag.id);
        const tagWithChildren = {
          ...tag,
          children: children.length > 0 ? await buildTree(children) : [],
        };
        result.push(tagWithChildren);
      }
      
      return result;
    };

    return buildTree(rootTags);
  }

  /**
   * 合并标签
   */
  async mergeTags(sourceTagId: string, targetTagId: string): Promise<void> {
    const sourceTag = await this.tagRepository.findById(sourceTagId);
    const targetTag = await this.tagRepository.findById(targetTagId);

    if (!sourceTag || !targetTag) {
      throw new Error('源标签或目标标签不存在');
    }

    // 在事务中执行合并操作
    await this.tagRepository.transaction(async (prisma) => {
      // 将所有使用源标签的内容标签关联更新为目标标签
      await prisma.contentTag.updateMany({
        where: { tagId: sourceTagId },
        data: { tagId: targetTagId },
      });

      // 更新子标签的父标签
      await prisma.tag.updateMany({
        where: { parentId: sourceTagId },
        data: { parentId: targetTagId },
      });

      // 删除源标签
      await prisma.tag.delete({
        where: { id: sourceTagId },
      });

      // 更新目标标签的使用次数
      const contentTagCount = await prisma.contentTag.count({
        where: { tagId: targetTagId },
      });

      await prisma.tag.update({
        where: { id: targetTagId },
        data: { usageCount: contentTagCount },
      });
    });
  }

  /**
   * 清理未使用的标签
   */
  async cleanupUnusedTags(): Promise<{ deletedCount: number; deletedTags: string[] }> {
    // 查找未使用的标签（通过关联查询）
    const result = await this.tagRepository.findMany({}, {
      limit: 1000 // 限制一次清理的数量
    });
    
    const unusedTags = result.tags.filter((tag: any) => tag._count?.contentTags === 0);

    const deletedTags: string[] = [];

    for (const tag of unusedTags) {
      try {
        await this.tagRepository.delete(tag.id);
        deletedTags.push(tag.name);
      } catch (error) {
        // 忽略删除错误，可能是有子标签
        console.warn(`无法删除标签 ${tag.name}:`, error);
      }
    }

    return {
      deletedCount: deletedTags.length,
      deletedTags,
    };
  }

  /**
   * 根据内容自动建议标签
   */
  async suggestTagsForContent(title: string, content?: string, category?: string): Promise<TagWithUsage[]> {
    const suggestions: TagWithUsage[] = [];
    const keywords = this.extractKeywords(title, content);

    // 基于关键词搜索相关标签
    for (const keyword of keywords) {
      const matchingTags = await this.tagRepository.searchSuggestions(keyword, 3);
      suggestions.push(...matchingTags);
    }

    // 基于分类添加相关标签
    if (category) {
      const categoryTags = await this.tagRepository.findMany({
        type: TagType.CATEGORY,
        search: category,
      }, { limit: 5 });
      suggestions.push(...categoryTags.tags);
    }

    // 去重并按使用次数排序
    const uniqueSuggestions = suggestions.reduce((acc, tag) => {
      if (!acc.find(t => t.id === tag.id)) {
        acc.push(tag);
      }
      return acc;
    }, [] as TagWithUsage[]);

    return uniqueSuggestions
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10);
  }

  /**
   * 从文本中提取关键词
   */
  private extractKeywords(title: string, content?: string): string[] {
    const text = `${title} ${content || ''}`.toLowerCase();
    
    // 简单的关键词提取（实际应用中可以使用更复杂的NLP算法）
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));

    // 统计词频并返回最常见的词
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * 检查是否为停用词
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      // 中文停用词
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很',
      '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'
    ]);

    return stopWords.has(word);
  }
}
