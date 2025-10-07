/**
 * 数据库操作集成测试
 * 测试真实的数据库操作，包括事务、约束和复杂查询
 */
import { jest, describe, beforeEach, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma, ContentItemRepository, TagRepository, ContentTagRepository, ContentStatus, ContentType, TagType } from '@tech-news-platform/database';

describe('Database Integration Tests', () => {
  let contentRepository: ContentItemRepository;
  let tagRepository: TagRepository;
  let contentTagRepository: ContentTagRepository;

  beforeAll(async () => {
    contentRepository = new ContentItemRepository(prisma);
    tagRepository = new TagRepository(prisma);
    contentTagRepository = new ContentTagRepository(prisma);
  });

  beforeEach(async () => {
    // 清理测试数据
    await prisma.contentAuditLog.deleteMany({
      where: { contentId: { startsWith: 'test-' } },
    });
    await prisma.contentVersion.deleteMany({
      where: { contentId: { startsWith: 'test-' } },
    });
    await prisma.contentTag.deleteMany({
      where: { contentId: { startsWith: 'test-' } },
    });
    await prisma.content.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    await prisma.tag.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
  });

  afterAll(async () => {
    // 清理所有测试数据
    await prisma.contentAuditLog.deleteMany({
      where: { contentId: { startsWith: 'test-' } },
    });
    await prisma.contentVersion.deleteMany({
      where: { contentId: { startsWith: 'test-' } },
    });
    await prisma.contentTag.deleteMany({
      where: { contentId: { startsWith: 'test-' } },
    });
    await prisma.content.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    await prisma.tag.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    await prisma.$disconnect();
  });

  describe('Content Management', () => {
    it('应该创建内容并自动生成哈希值', async () => {
      const contentData = {
        title: '测试内容标题',
        description: '测试内容描述',
        content: '这是测试内容的正文部分',
        sourceId: 'test-source-1',
        type: ContentType.NEWS,
        category: 'AI',
      };

      const createdContent = await contentRepository.create(contentData, 'test-user-1');

      expect(createdContent).toMatchObject({
        title: contentData.title,
        description: contentData.description,
        content: contentData.content,
        status: ContentStatus.RAW,
        type: ContentType.NEWS,
        category: 'AI',
      });

      // 验证哈希值已生成
      expect(createdContent.contentHash).toBeTruthy();
      expect(createdContent.titleHash).toBeTruthy();
      expect(createdContent.contentHash).toHaveLength(64); // SHA-256
      expect(createdContent.titleHash).toHaveLength(64);

      // 验证版本记录已创建
      const version = await prisma.contentVersion.findFirst({
        where: { contentId: createdContent.id },
      });
      expect(version).toMatchObject({
        contentId: createdContent.id,
        version: 1,
        title: contentData.title,
        changeType: 'CREATE',
        changedBy: 'test-user-1',
      });

      // 验证审计日志已创建
      const auditLog = await prisma.contentAuditLog.findFirst({
        where: { contentId: createdContent.id },
      });
      expect(auditLog).toMatchObject({
        contentId: createdContent.id,
        userId: 'test-user-1',
        action: 'CREATE',
        tableName: 'content',
      });
    });

    it('应该检测重复内容', async () => {
      // 创建第一个内容
      const originalContent = {
        title: '原始内容标题',
        description: '原始内容描述',
        content: '这是原始内容',
        sourceId: 'test-source-1',
        type: ContentType.NEWS,
      };

      await contentRepository.create(originalContent, 'test-user-1');

      // 尝试创建重复内容（相同标题）
      const duplicateContent = {
        title: '原始内容标题', // 相同标题
        description: '不同的描述',
        content: '不同的内容',
        sourceId: 'test-source-2',
        type: ContentType.ARTICLE,
      };

      await expect(contentRepository.create(duplicateContent, 'test-user-1'))
        .rejects.toThrow('检测到重复内容');
    });

    it('应该更新内容并创建新版本', async () => {
      // 创建原始内容
      const originalContent = {
        title: '原始标题',
        description: '原始描述',
        content: '原始内容',
        sourceId: 'test-source-1',
        type: ContentType.NEWS,
      };

      await contentRepository.create(originalContent, 'test-user-1');

      // 更新内容
      const updateData = {
        title: '更新后的标题',
        description: '更新后的描述',
        status: ContentStatus.REVIEWED,
      };

      const updatedContent = await contentRepository.update(
        'test-content-update',
        updateData,
        'test-user-2'
      );

      expect(updatedContent).toMatchObject({
        title: '更新后的标题',
        description: '更新后的描述',
        status: ContentStatus.REVIEWED,
      });

      // 验证新版本已创建
      const versions = await prisma.contentVersion.findMany({
        where: { contentId: 'test-content-update' },
        orderBy: { version: 'asc' },
      });

      expect(versions).toHaveLength(2);
      expect(versions[0]).toMatchObject({
        version: 1,
        changeType: 'CREATE',
        changedBy: 'test-user-1',
      });
      expect(versions[1]).toMatchObject({
        version: 2,
        changeType: 'UPDATE',
        changedBy: 'test-user-2',
      });
    });

    it('应该正确处理内容统计', async () => {
      // 创建测试内容
      const contents = [
        {
          title: '新闻内容1',
          sourceId: 'test-source-1',
          type: ContentType.NEWS,
          status: ContentStatus.PUBLISHED,
          viewCount: 100,
          shareCount: 10,
        },
        {
          title: '文章内容2',
          sourceId: 'test-source-1',
          type: ContentType.ARTICLE,
          status: ContentStatus.RAW,
          viewCount: 50,
          shareCount: 5,
        },
      ];

      for (const content of contents) {
        await contentRepository.create(content, 'test-user-1');
      }

      // 增加浏览和分享次数
      await contentRepository.incrementViewCount('test-content-stats-1');
      await contentRepository.incrementShareCount('test-content-stats-1');

      // 验证统计数据
      const content1 = await contentRepository.findById('test-content-stats-1');
      expect(content1?.viewCount).toBe(101);
      expect(content1?.shareCount).toBe(11);
    });
  });

  describe('Tag Management', () => {
    it('应该创建层级标签结构', async () => {
      // 创建父标签
      const parentTag = await tagRepository.create({
        name: '技术',
        slug: 'technology',
        type: TagType.TECHNOLOGY,
        description: '技术相关标签',
        color: '#2196F3',
      });

      // 创建子标签
      const childTag = await tagRepository.create({
        name: 'AI技术',
        slug: 'ai-technology',
        type: TagType.TECHNOLOGY,
        description: 'AI相关技术',
        color: '#FF5722',
        parentId: parentTag.id,
      });

      expect(childTag.parentId).toBe(parentTag.id);

      // 验证层级关系
      const children = await tagRepository.findChildren(parentTag.id);
      expect(children).toHaveLength(1);
      expect(children[0].id).toBe(childTag.id);

      // 验证标签路径
      const path = await tagRepository.getTagPath(childTag.id);
      expect(path).toHaveLength(2);
      expect(path[0].id).toBe(parentTag.id);
      expect(path[1].id).toBe(childTag.id);
    });

    it('应该正确处理标签使用计数', async () => {
      // 创建标签
      const tag = await tagRepository.create({
        name: '使用计数测试',
        slug: 'usage-test',
        type: TagType.TOPIC,
      });

      expect(tag.usageCount).toBe(0);

      // 增加使用次数
      await tagRepository.incrementUsage(tag.id);
      await tagRepository.incrementUsage(tag.id);

      const updatedTag = await tagRepository.findById(tag.id);
      expect(updatedTag?.usageCount).toBe(2);

      // 减少使用次数
      await tagRepository.decrementUsage(tag.id);

      const decrementedTag = await tagRepository.findById(tag.id);
      expect(decrementedTag?.usageCount).toBe(1);
    });

    it('应该防止删除有子标签或正在使用的标签', async () => {
      // 创建父标签和子标签
      const parentTag = await tagRepository.create({
        name: '父标签',
        slug: 'parent-tag',
        type: TagType.TECHNOLOGY,
      });

      await tagRepository.create({
        name: '子标签',
        slug: 'child-tag',
        type: TagType.TECHNOLOGY,
        parentId: parentTag.id,
      });

      // 尝试删除有子标签的父标签
      await expect(tagRepository.delete(parentTag.id))
        .rejects.toThrow('无法删除有子标签的标签');

      // 创建内容并关联标签
      const content = await contentRepository.create({
        title: '测试内容',
        sourceId: 'test-source-1',
        type: ContentType.NEWS,
      }, 'test-user-1');

      const usedTag = await tagRepository.create({
        name: '使用中的标签',
        slug: 'used-tag',
        type: TagType.TOPIC,
      });

      await contentTagRepository.addTagToContent(content.id, usedTag.id);

      // 尝试删除正在使用的标签
      await expect(tagRepository.delete(usedTag.id))
        .rejects.toThrow('无法删除正在使用的标签');
    });
  });

  describe('Content-Tag Relationships', () => {
    let testContent: any;
    let testTags: any[];

    beforeEach(async () => {
      // 创建测试内容
      testContent = await contentRepository.create({
        title: '标签关联测试内容',
        sourceId: 'test-source-1',
        type: ContentType.NEWS,
      }, 'test-user-1');

      // 创建测试标签
      testTags = [];
      for (let i = 1; i <= 3; i++) {
        const tag = await tagRepository.create({
          name: `测试标签${i}`,
          slug: `test-tag-${i}`,
          type: TagType.TOPIC,
        });
        testTags.push(tag);
      }
    });

    it('应该正确管理内容标签关联', async () => {
      // 添加标签到内容
      await contentTagRepository.addTagToContent(testContent.id, testTags[0].id, 0.9);
      await contentTagRepository.addTagToContent(testContent.id, testTags[1].id, 0.8);

      // 验证关联已创建
      const contentWithTags = await contentRepository.findById(testContent.id);
      expect(contentWithTags?.contentTags).toHaveLength(2);

      // 验证标签使用计数已更新
      const tag1 = await tagRepository.findById(testTags[0].id);
      const tag2 = await tagRepository.findById(testTags[1].id);
      expect(tag1?.usageCount).toBe(1);
      expect(tag2?.usageCount).toBe(1);

      // 移除标签
      await contentTagRepository.removeTagFromContent(testContent.id, testTags[0].id);

      // 验证关联已移除
      const updatedContent = await contentRepository.findById(testContent.id);
      expect(updatedContent?.contentTags).toHaveLength(1);

      // 验证标签使用计数已更新
      const updatedTag1 = await tagRepository.findById(testTags[0].id);
      expect(updatedTag1?.usageCount).toBe(0);
    });

    it('应该防止重复关联', async () => {
      // 添加标签到内容
      await contentTagRepository.addTagToContent(testContent.id, testTags[0].id);

      // 尝试重复添加相同标签
      await expect(
        contentTagRepository.addTagToContent(testContent.id, testTags[0].id)
      ).rejects.toThrow();
    });

    it('应该正确查找共同标签', async () => {
      // 创建另一个内容
      const content2 = await contentRepository.create({
        title: '第二个测试内容',
        sourceId: 'test-source-1',
        type: ContentType.ARTICLE,
      }, 'test-user-1');

      // 为两个内容添加共同标签
      await contentTagRepository.addTagToContent(testContent.id, testTags[0].id);
      await contentTagRepository.addTagToContent(testContent.id, testTags[1].id);
      await contentTagRepository.addTagToContent(content2.id, testTags[0].id);
      await contentTagRepository.addTagToContent(content2.id, testTags[2].id);

      // 验证两个内容都有标签关联
      const content1WithTags = await contentRepository.findById(testContent.id);
      const content2WithTags = await contentRepository.findById(content2.id);
      
      expect(content1WithTags?.contentTags).toHaveLength(2);
      expect(content2WithTags?.contentTags).toHaveLength(2);
    });
  });

  describe('Complex Queries and Transactions', () => {
    it('应该正确执行复杂的搜索查询', async () => {
      // 创建测试数据
      const contents = [
        {
          title: 'AI技术发展趋势',
          description: '人工智能技术的最新发展',
          content: '深度学习和机器学习的应用',
          category: 'AI',
          type: ContentType.NEWS,
          status: ContentStatus.PUBLISHED,
          sourceId: 'test-source-1',
        },
        {
          title: '区块链应用案例',
          description: '区块链在金融领域的应用',
          content: '智能合约和去中心化金融',
          category: 'Blockchain',
          type: ContentType.ARTICLE,
          status: ContentStatus.PUBLISHED,
          sourceId: 'test-source-1',
        },
        {
          title: 'AI在医疗中的应用',
          description: '人工智能辅助诊断',
          content: '机器学习算法在医疗影像分析中的应用',
          category: 'AI',
          type: ContentType.NEWS,
          status: ContentStatus.RAW,
          sourceId: 'test-source-1',
        },
      ];

      for (const content of contents) {
        await contentRepository.create(content, 'test-user-1');
      }

      // 测试搜索功能
      const searchResult = await contentRepository.findMany(
        {
          search: 'AI',
          status: ContentStatus.PUBLISHED,
          type: ContentType.NEWS,
        },
        { page: 1, limit: 10 }
      );

      expect(searchResult.content).toHaveLength(1);
      expect(searchResult.content[0].title).toBe('AI技术发展趋势');

      // 测试分类过滤
      const categoryResult = await contentRepository.findMany(
        { category: 'AI' },
        { page: 1, limit: 10 }
      );

      expect(categoryResult.content).toHaveLength(2);
    });

    it('应该正确处理事务操作', async () => {
      const contentData = {
        id: 'test-transaction-content',
        title: '事务测试内容',
        sourceId: 'test-source-1',
        type: ContentType.NEWS,
      };

      const tagData = {
        name: '事务测试标签',
        slug: 'transaction-test-tag',
        type: TagType.TOPIC,
      };

      // 在事务中创建内容和标签，然后关联它们
      await prisma.$transaction(async (tx) => {
        // 创建内容
        const content = await tx.content.create({
          data: {
            ...contentData,
            status: ContentStatus.RAW,
            contentHash: 'test-hash',
            titleHash: 'test-title-hash',
          },
        });

        // 创建标签
        const tag = await tx.tag.create({
          data: {
            ...tagData,
            usageCount: 0,
          },
        });

        // 创建关联
        await tx.contentTag.create({
          data: {
            contentId: content.id,
            tagId: tag.id,
            relevance: 1.0,
          },
        });

        // 更新标签使用计数
        await tx.tag.update({
          where: { id: tag.id },
          data: {
            usageCount: {
              increment: 1,
            },
          },
        });
      });

      // 验证事务结果
      const content = await contentRepository.findById('test-transaction-content');
      const tag = await tagRepository.findById('test-transaction-tag');

      expect(content).toBeTruthy();
      expect(tag).toBeTruthy();
      expect(tag?.usageCount).toBe(1);
      expect(content?.contentTags).toHaveLength(1);
    });
  });

  describe('Data Integrity and Constraints', () => {
    it('应该强制执行唯一约束', async () => {
      const tagData = {
        name: '唯一标签',
        slug: 'unique-tag',
        type: TagType.TOPIC,
      };

      // 创建第一个标签
      await tagRepository.create(tagData);

      // 尝试创建相同名称的标签
      await expect(tagRepository.create({
        name: tagData.name,
        slug: 'unique-tag-2', // 不同的slug
        type: TagType.TOPIC,
      })).rejects.toThrow();
    });

    it('应该正确处理外键约束', async () => {
      // 尝试创建引用不存在来源的内容
      await expect(contentRepository.create({
        title: '外键测试',
        sourceId: 'nonexistent-source',
        type: ContentType.NEWS,
      }, 'test-user-1')).rejects.toThrow();
    });

    it('应该正确处理级联删除', async () => {
      // 创建内容
      const content = await contentRepository.create({
        title: '级联删除测试',
        sourceId: 'test-source-1',
        type: ContentType.NEWS,
      }, 'test-user-1');

      // 创建标签并关联
      const tag = await tagRepository.create({
        name: '级联测试标签',
        slug: 'cascade-test-tag',
        type: TagType.TOPIC,
      });

      await contentTagRepository.addTagToContent(content.id, tag.id);

      // 删除内容
      await contentRepository.delete(content.id, 'test-user-1');

      // 验证关联记录也被删除
      const associations = await prisma.contentTag.findMany({
        where: { contentId: content.id },
      });
      expect(associations).toHaveLength(0);

      // 验证版本记录也被删除
      const versions = await prisma.contentVersion.findMany({
        where: { contentId: content.id },
      });
      expect(versions).toHaveLength(0);
    });
  });
});
