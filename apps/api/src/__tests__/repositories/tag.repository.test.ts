/**
 * 标签仓库单元测试
 */
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// 创建模拟仓库对象
const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  findMany: jest.fn(),
  findRootTags: jest.fn(),
  findChildren: jest.fn(),
  getTagPath: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  incrementUsage: jest.fn(),
  decrementUsage: jest.fn(),
  getPopularTags: jest.fn(),
  searchSuggestions: jest.fn(),
  getStatistics: jest.fn(),
};

// 模拟数据库包
jest.mock('@tech-news-platform/database', () => ({
  prisma: {},
  TagRepository: jest.fn().mockImplementation(() => mockRepository),
  TagType: {
    TECHNOLOGY: 'TECHNOLOGY',
    COMPANY: 'COMPANY',
    PERSON: 'PERSON',
    TOPIC: 'TOPIC',
    LOCATION: 'LOCATION',
    EVENT: 'EVENT',
    OTHER: 'OTHER',
  },
}));

// 定义枚举常量
const TagType = {
  TECHNOLOGY: 'TECHNOLOGY',
  COMPANY: 'COMPANY',
  PERSON: 'PERSON',
  TOPIC: 'TOPIC',
  LOCATION: 'LOCATION',
  EVENT: 'EVENT',
  OTHER: 'OTHER',
} as const;

describe('TagRepository', () => {
  let repository: any;

  beforeEach(() => {
    repository = mockRepository;
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockTagData = {
      name: 'AI技术',
      slug: 'ai-technology',
      type: TagType.TECHNOLOGY,
      description: 'AI相关技术标签',
      color: '#FF5722',
    };

    const mockCreatedTag = {
      id: 'tag-123',
      ...mockTagData,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('应该成功创建标签', async () => {
      repository.create.mockResolvedValue(mockCreatedTag);

      const result = await repository.create(mockTagData);

      expect(result).toEqual(mockCreatedTag);
      expect(repository.create).toHaveBeenCalledWith(mockTagData);
    });

    it('当标签名称重复时应该抛出错误', async () => {
      repository.create.mockRejectedValue(new Error('标签名称 "AI技术" 或标识符 "ai-technology" 已存在'));

      await expect(repository.create(mockTagData))
        .rejects.toThrow('标签名称 "AI技术" 或标识符 "ai-technology" 已存在');
    });
  });

  describe('findById', () => {
    const mockTag = {
      id: 'tag-123',
      name: 'AI技术',
      slug: 'ai-technology',
      type: TagType.TECHNOLOGY,
      parent: null,
      children: [],
      _count: {
        children: 2,
        contentTags: 5,
      },
    };

    it('应该根据ID查找标签', async () => {
      repository.findById.mockResolvedValue(mockTag);

      const result = await repository.findById('tag-123');

      expect(result).toEqual(mockTag);
      expect(repository.findById).toHaveBeenCalledWith('tag-123');
    });

    it('当标签不存在时应该返回null', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    const mockTag = {
      id: 'tag-123',
      name: 'AI技术',
      slug: 'ai-technology',
    };

    it('应该根据名称查找标签', async () => {
      repository.findByName.mockResolvedValue(mockTag);

      const result = await repository.findByName('AI技术');

      expect(result).toEqual(mockTag);
      expect(repository.findByName).toHaveBeenCalledWith('AI技术');
    });
  });

  describe('findMany', () => {
    const mockTags = [
      { id: 'tag-1', name: '标签1', usageCount: 10 },
      { id: 'tag-2', name: '标签2', usageCount: 5 },
    ];

    const mockResult = {
      tags: mockTags,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it('应该返回分页的标签列表', async () => {
      repository.findMany.mockResolvedValue(mockResult);

      const result = await repository.findMany({}, { page: 1, limit: 10 });

      expect(result).toEqual({
        tags: mockTags,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(repository.findMany).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
    });

    it('应该应用搜索过滤器', async () => {
      const filters = {
        search: 'AI',
        type: TagType.TECHNOLOGY,
        parentId: null,
      };

      repository.findMany.mockResolvedValue(mockResult);

      await repository.findMany(filters);

      expect(repository.findMany).toHaveBeenCalledWith(filters);
    });
  });

  describe('findRootTags', () => {
    const mockRootTags = [
      { id: 'tag-1', name: '根标签1', parentId: null },
      { id: 'tag-2', name: '根标签2', parentId: null },
    ];

    it('应该返回根标签列表', async () => {
      repository.findRootTags.mockResolvedValue(mockRootTags);

      const result = await repository.findRootTags();

      expect(result).toEqual(mockRootTags);
      expect(repository.findRootTags).toHaveBeenCalled();
    });

    it('应该根据类型过滤根标签', async () => {
      repository.findRootTags.mockResolvedValue(mockRootTags);

      await repository.findRootTags(TagType.TECHNOLOGY);

      expect(repository.findRootTags).toHaveBeenCalledWith(TagType.TECHNOLOGY);
    });
  });

  describe('findChildren', () => {
    const mockChildren = [
      { id: 'child-1', name: '子标签1', parentId: 'parent-123' },
      { id: 'child-2', name: '子标签2', parentId: 'parent-123' },
    ];

    it('应该返回子标签列表', async () => {
      repository.findChildren.mockResolvedValue(mockChildren);

      const result = await repository.findChildren('parent-123');

      expect(result).toEqual(mockChildren);
      expect(repository.findChildren).toHaveBeenCalledWith('parent-123');
    });
  });

  describe('getTagPath', () => {
    const grandparent = { id: 'gp-1', name: '祖父标签', parentId: null };
    const parent = { id: 'p-1', name: '父标签', parentId: 'gp-1' };
    const child = { id: 'c-1', name: '子标签', parentId: 'p-1' };

    it('应该返回标签路径', async () => {
      repository.getTagPath.mockResolvedValue([grandparent, parent, child]);

      const result = await repository.getTagPath('c-1');

      expect(result).toEqual([grandparent, parent, child]);
    });
  });

  describe('update', () => {
    const updateData = { name: '更新的标签', slug: 'updated-tag' };
    const mockUpdatedTag = {
      id: 'tag-123',
      ...updateData,
    };

    it('应该成功更新标签', async () => {
      repository.update.mockResolvedValue(mockUpdatedTag);

      const result = await repository.update('tag-123', updateData);

      expect(result).toEqual(mockUpdatedTag);
      expect(repository.update).toHaveBeenCalledWith('tag-123', updateData);
    });

    it('当标签不存在时应该抛出错误', async () => {
      repository.update.mockRejectedValue(new Error('标签不存在'));

      await expect(repository.update('nonexistent', {}))
        .rejects.toThrow('标签不存在');
    });
  });

  describe('delete', () => {
    it('应该成功删除标签', async () => {
      repository.delete.mockResolvedValue(undefined);

      await repository.delete('tag-123');

      expect(repository.delete).toHaveBeenCalledWith('tag-123');
    });

    it('当有子标签时应该抛出错误', async () => {
      repository.delete.mockRejectedValue(new Error('无法删除有子标签的标签'));

      await expect(repository.delete('tag-123'))
        .rejects.toThrow('无法删除有子标签的标签');
    });

    it('当有内容使用时应该抛出错误', async () => {
      repository.delete.mockRejectedValue(new Error('无法删除正在使用的标签'));

      await expect(repository.delete('tag-123'))
        .rejects.toThrow('无法删除正在使用的标签');
    });
  });

  describe('incrementUsage', () => {
    it('应该增加标签使用次数', async () => {
      repository.incrementUsage.mockResolvedValue(undefined);

      await repository.incrementUsage('tag-123');

      expect(repository.incrementUsage).toHaveBeenCalledWith('tag-123');
    });
  });

  describe('decrementUsage', () => {
    it('应该减少标签使用次数', async () => {
      repository.decrementUsage.mockResolvedValue(undefined);

      await repository.decrementUsage('tag-123');

      expect(repository.decrementUsage).toHaveBeenCalledWith('tag-123');
    });
  });

  describe('getPopularTags', () => {
    const mockPopularTags = [
      { id: 'tag-1', name: '热门标签1', usageCount: 100 },
      { id: 'tag-2', name: '热门标签2', usageCount: 80 },
    ];

    it('应该返回热门标签', async () => {
      repository.getPopularTags.mockResolvedValue(mockPopularTags);

      const result = await repository.getPopularTags(10);

      expect(result).toEqual(mockPopularTags);
      expect(repository.getPopularTags).toHaveBeenCalledWith(10);
    });

    it('应该根据类型过滤热门标签', async () => {
      repository.getPopularTags.mockResolvedValue(mockPopularTags);

      await repository.getPopularTags(10, TagType.TECHNOLOGY);

      expect(repository.getPopularTags).toHaveBeenCalledWith(10, TagType.TECHNOLOGY);
    });
  });

  describe('searchSuggestions', () => {
    const mockSuggestions = [
      { id: 'tag-1', name: 'AI技术' },
      { id: 'tag-2', name: 'AI应用' },
    ];

    it('应该返回搜索建议', async () => {
      repository.searchSuggestions.mockResolvedValue(mockSuggestions);

      const result = await repository.searchSuggestions('AI', 5);

      expect(result).toEqual(mockSuggestions);
      expect(repository.searchSuggestions).toHaveBeenCalledWith('AI', 5);
    });
  });

  describe('getStatistics', () => {
    const mockStats = {
      totalTags: 100,
      tagsByType: {
        [TagType.TECHNOLOGY]: 30,
        [TagType.COMPANY]: 20,
      },
      topTags: [
        { id: 'tag-1', name: '热门标签1', usageCount: 50 },
      ],
      unusedTags: 10,
    };

    it('应该返回标签统计信息', async () => {
      repository.getStatistics.mockResolvedValue(mockStats);

      const result = await repository.getStatistics();

      expect(result).toEqual({
        totalTags: 100,
        tagsByType: {
          [TagType.TECHNOLOGY]: 30,
          [TagType.COMPANY]: 20,
        },
        topTags: [
          { id: 'tag-1', name: '热门标签1', usageCount: 50 },
        ],
        unusedTags: 10,
      });
      expect(repository.getStatistics).toHaveBeenCalled();
    });
  });
});