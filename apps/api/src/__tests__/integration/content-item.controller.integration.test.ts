/**
 * 内容管理控制器集成测试
 */
import { jest, describe, beforeEach, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { ContentItemController } from '../../controllers/content-item.controller';
import contentItemRoutes from '../../routes/content-item.routes';
import { ContentStatus, ContentType, TagType } from '@tech-news-platform/database';

// 模拟服务层
jest.mock('../../services/content-item.service');
jest.mock('../../services/tag.service');
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'user-123', role: 'ADMIN' };
    next();
  },
  authorize: () => (req: any, res: any, next: any) => next(),
}));
jest.mock('../../middleware/validation.middleware', () => ({
  validateRequest: (req: any, res: any, next: any) => next(),
}));

import { ContentItemService } from '../../services/content-item.service';
import { TagService } from '../../services/tag.service';

const mockContentService = ContentItemService as jest.MockedClass<typeof ContentItemService>;
const mockTagService = TagService as jest.MockedClass<typeof TagService>;

describe('ContentItemController Integration Tests', () => {
  let app: express.Application;
  let contentServiceInstance: jest.Mocked<ContentItemService>;
  let tagServiceInstance: jest.Mocked<TagService>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/content-items', contentItemRoutes);

    // 设置模拟实例
    contentServiceInstance = {
      getContent: jest.fn(),
      getContentById: jest.fn(),
      createContent: jest.fn(),
      updateContent: jest.fn(),
      deleteContent: jest.fn(),
      updateContentStatus: jest.fn(),
      addContentTags: jest.fn(),
      removeContentTags: jest.fn(),
      checkDuplication: jest.fn(),
      incrementViewCount: jest.fn(),
      incrementShareCount: jest.fn(),
      getStatistics: jest.fn(),
    } as any;

    tagServiceInstance = {
      getTags: jest.fn(),
      createTag: jest.fn(),
      searchSuggestions: jest.fn(),
      getPopularTags: jest.fn(),
    } as any;

    mockContentService.mockImplementation(() => contentServiceInstance);
    mockTagService.mockImplementation(() => tagServiceInstance);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/content-items', () => {
    const mockContentList = {
      content: [
        {
          id: 'content-1',
          title: '测试内容1',
          description: '描述1',
          status: ContentStatus.PUBLISHED,
          type: ContentType.NEWS,
        },
        {
          id: 'content-2',
          title: '测试内容2',
          description: '描述2',
          status: ContentStatus.PUBLISHED,
          type: ContentType.ARTICLE,
        },
      ],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it('应该返回内容列表', async () => {
      contentServiceInstance.getContent.mockResolvedValue(mockContentList as any);

      const response = await request(app)
        .get('/api/content-items')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockContentList,
      });

      expect(contentServiceInstance.getContent).toHaveBeenCalledWith(
        expect.objectContaining({}),
        expect.objectContaining({
          page: 1,
          limit: 20,
        })
      );
    });

    it('应该应用查询参数过滤', async () => {
      contentServiceInstance.getContent.mockResolvedValue(mockContentList as any);

      await request(app)
        .get('/api/content-items')
        .query({
          status: ContentStatus.PUBLISHED,
          type: ContentType.NEWS,
          category: 'AI',
          search: '测试',
          page: 2,
          limit: 10,
        })
        .expect(200);

      expect(contentServiceInstance.getContent).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ContentStatus.PUBLISHED,
          type: ContentType.NEWS,
          category: 'AI',
          search: '测试',
        }),
        expect.objectContaining({
          page: 2,
          limit: 10,
        })
      );
    });

    it('应该处理服务错误', async () => {
      contentServiceInstance.getContent.mockRejectedValue(new Error('服务错误'));

      const response = await request(app)
        .get('/api/content-items')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: '获取内容列表失败',
        error: '服务错误',
      });
    });
  });

  describe('GET /api/content-items/:id', () => {
    const mockContent = {
      id: 'content-123',
      title: '测试内容',
      description: '测试描述',
      status: ContentStatus.PUBLISHED,
      viewCount: 10,
    };

    it('应该返回内容详情', async () => {
      contentServiceInstance.getContentById.mockResolvedValue(mockContent as any);
      contentServiceInstance.incrementViewCount.mockResolvedValue(undefined);

      const response = await request(app)
        .get('/api/content-items/content-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockContent,
      });

      expect(contentServiceInstance.getContentById).toHaveBeenCalledWith('content-123', true);
      expect(contentServiceInstance.incrementViewCount).toHaveBeenCalledWith('content-123');
    });

    it('当内容不存在时应该返回404', async () => {
      contentServiceInstance.getContentById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/content-items/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: '内容不存在',
      });
    });
  });

  describe('POST /api/content-items', () => {
    const mockContentData = {
      title: '新内容标题',
      description: '新内容描述',
      content: '新内容正文',
      sourceId: 'source-123',
      type: ContentType.NEWS,
      category: 'AI',
    };

    const mockCreatedContent = {
      id: 'content-123',
      ...mockContentData,
      status: ContentStatus.RAW,
      createdAt: new Date(),
    };

    it('应该成功创建内容', async () => {
      contentServiceInstance.createContent.mockResolvedValue(mockCreatedContent as any);

      const response = await request(app)
        .post('/api/content-items')
        .send(mockContentData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockCreatedContent,
        message: '内容创建成功',
      });

      expect(contentServiceInstance.createContent).toHaveBeenCalledWith(
        mockContentData,
        'user-123'
      );
    });

    it('当缺少必需字段时应该返回400', async () => {
      const invalidData = { description: '缺少标题和来源ID' };

      const response = await request(app)
        .post('/api/content-items')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '标题和来源ID是必需的',
      });
    });

    it('当检测到重复内容时应该返回409', async () => {
      contentServiceInstance.createContent.mockRejectedValue(
        new Error('检测到重复内容，相似度: 95.0%')
      );

      const response = await request(app)
        .post('/api/content-items')
        .send(mockContentData)
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        message: '检测到重复内容，相似度: 95.0%',
      });
    });
  });

  describe('PUT /api/content-items/:id', () => {
    const mockUpdateData = {
      title: '更新的标题',
      description: '更新的描述',
      status: ContentStatus.REVIEWED,
    };

    const mockUpdatedContent = {
      id: 'content-123',
      ...mockUpdateData,
      updatedAt: new Date(),
    };

    it('应该成功更新内容', async () => {
      contentServiceInstance.updateContent.mockResolvedValue(mockUpdatedContent as any);

      const response = await request(app)
        .put('/api/content-items/content-123')
        .send(mockUpdateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedContent,
        message: '内容更新成功',
      });

      expect(contentServiceInstance.updateContent).toHaveBeenCalledWith(
        'content-123',
        mockUpdateData,
        'user-123'
      );
    });

    it('当内容不存在时应该返回404', async () => {
      contentServiceInstance.updateContent.mockRejectedValue(new Error('内容不存在'));

      const response = await request(app)
        .put('/api/content-items/nonexistent')
        .send(mockUpdateData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: '内容不存在',
      });
    });
  });

  describe('DELETE /api/content-items/:id', () => {
    it('应该成功删除内容', async () => {
      contentServiceInstance.deleteContent.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/content-items/content-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '内容删除成功',
      });

      expect(contentServiceInstance.deleteContent).toHaveBeenCalledWith(
        'content-123',
        'user-123'
      );
    });
  });

  describe('PATCH /api/content-items/batch/status', () => {
    it('应该批量更新内容状态', async () => {
      const requestData = {
        ids: ['content-1', 'content-2'],
        status: ContentStatus.PUBLISHED,
      };

      contentServiceInstance.updateContentStatus.mockResolvedValue(undefined);

      const response = await request(app)
        .patch('/api/content-items/batch/status')
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '成功更新 2 条内容的状态',
      });

      expect(contentServiceInstance.updateContentStatus).toHaveBeenCalledWith(
        requestData.ids,
        requestData.status,
        'user-123'
      );
    });

    it('当ID数组为空时应该返回400', async () => {
      const response = await request(app)
        .patch('/api/content-items/batch/status')
        .send({ ids: [], status: ContentStatus.PUBLISHED })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '请提供有效的内容ID数组',
      });
    });

    it('当状态无效时应该返回400', async () => {
      const response = await request(app)
        .patch('/api/content-items/batch/status')
        .send({ ids: ['content-1'], status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '无效的内容状态',
      });
    });
  });

  describe('POST /api/content-items/:id/tags', () => {
    const mockUpdatedContent = {
      id: 'content-123',
      title: '测试内容',
      contentTags: [
        { tag: { id: 'tag-1', name: 'AI技术' } },
        { tag: { id: 'tag-2', name: '机器学习' } },
      ],
    };

    it('应该为内容添加标签', async () => {
      contentServiceInstance.addContentTags.mockResolvedValue(mockUpdatedContent as any);

      const response = await request(app)
        .post('/api/content-items/content-123/tags')
        .send({ tagIds: ['tag-1', 'tag-2'] })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedContent,
        message: '标签添加成功',
      });

      expect(contentServiceInstance.addContentTags).toHaveBeenCalledWith(
        'content-123',
        ['tag-1', 'tag-2'],
        undefined
      );
    });

    it('应该支持通过标签名称添加', async () => {
      contentServiceInstance.addContentTags.mockResolvedValue(mockUpdatedContent as any);

      await request(app)
        .post('/api/content-items/content-123/tags')
        .send({ tagNames: ['新标签1', '新标签2'] })
        .expect(200);

      expect(contentServiceInstance.addContentTags).toHaveBeenCalledWith(
        'content-123',
        undefined,
        ['新标签1', '新标签2']
      );
    });

    it('当既没有tagIds也没有tagNames时应该返回400', async () => {
      const response = await request(app)
        .post('/api/content-items/content-123/tags')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '请提供标签ID或标签名称',
      });
    });
  });

  describe('DELETE /api/content-items/:id/tags', () => {
    it('应该移除内容标签', async () => {
      contentServiceInstance.removeContentTags.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/content-items/content-123/tags')
        .send({ tagIds: ['tag-1', 'tag-2'] })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '标签移除成功',
      });

      expect(contentServiceInstance.removeContentTags).toHaveBeenCalledWith(
        'content-123',
        ['tag-1', 'tag-2']
      );
    });
  });

  describe('POST /api/content-items/check-duplication', () => {
    const mockDuplicationResult = {
      isDuplicate: true,
      duplicateId: 'existing-content',
      similarity: 0.95,
      method: 'TITLE_SIMILARITY',
    };

    it('应该检查内容重复', async () => {
      contentServiceInstance.checkDuplication.mockResolvedValue(mockDuplicationResult);

      const response = await request(app)
        .post('/api/content-items/check-duplication')
        .send({
          title: '测试标题',
          content: '测试内容',
          url: 'https://example.com',
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockDuplicationResult,
      });

      expect(contentServiceInstance.checkDuplication).toHaveBeenCalledWith(
        '测试标题',
        '测试内容',
        'https://example.com'
      );
    });

    it('当缺少标题时应该返回400', async () => {
      const response = await request(app)
        .post('/api/content-items/check-duplication')
        .send({ content: '测试内容' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: '标题是必需的',
      });
    });
  });

  describe('GET /api/content-items/statistics', () => {
    const mockStats = {
      totalContent: 100,
      contentByStatus: {
        [ContentStatus.PUBLISHED]: 80,
        [ContentStatus.RAW]: 20,
      },
      contentByType: {
        [ContentType.NEWS]: 60,
        [ContentType.ARTICLE]: 40,
      },
      recentContent: 10,
      duplicateContent: 5,
    };

    it('应该返回内容统计信息', async () => {
      contentServiceInstance.getStatistics.mockResolvedValue(mockStats as any);

      const response = await request(app)
        .get('/api/content-items/statistics')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStats,
      });

      expect(contentServiceInstance.getStatistics).toHaveBeenCalled();
    });
  });

  describe('POST /api/content-items/:id/share', () => {
    it('应该记录内容分享', async () => {
      contentServiceInstance.incrementShareCount.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/content-items/content-123/share')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '分享记录成功',
      });

      expect(contentServiceInstance.incrementShareCount).toHaveBeenCalledWith('content-123');
    });
  });

  // 标签相关测试
  describe('Tag Management', () => {
    describe('GET /api/content-items/tags', () => {
      const mockTagList = {
        tags: [
          { id: 'tag-1', name: 'AI技术', type: TagType.TECHNOLOGY, usageCount: 10 },
          { id: 'tag-2', name: '机器学习', type: TagType.TECHNOLOGY, usageCount: 8 },
        ],
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      it('应该返回标签列表', async () => {
        tagServiceInstance.getTags.mockResolvedValue(mockTagList as any);

        const response = await request(app)
          .get('/api/content-items/tags')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockTagList,
        });

        expect(tagServiceInstance.getTags).toHaveBeenCalledWith(
          expect.objectContaining({}),
          expect.objectContaining({
            page: 1,
            limit: 50,
          })
        );
      });
    });

    describe('POST /api/content-items/tags', () => {
      const mockTagData = {
        name: '新标签',
        slug: 'new-tag',
        type: TagType.TOPIC,
        description: '新标签描述',
      };

      const mockCreatedTag = {
        id: 'tag-123',
        ...mockTagData,
        usageCount: 0,
        createdAt: new Date(),
      };

      it('应该成功创建标签', async () => {
        tagServiceInstance.createTag.mockResolvedValue(mockCreatedTag as any);

        const response = await request(app)
          .post('/api/content-items/tags')
          .send(mockTagData)
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: mockCreatedTag,
          message: '标签创建成功',
        });

        expect(tagServiceInstance.createTag).toHaveBeenCalledWith(mockTagData);
      });

      it('当缺少必需字段时应该返回400', async () => {
        const response = await request(app)
          .post('/api/content-items/tags')
          .send({ description: '缺少名称和标识符' })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: '标签名称和标识符是必需的',
        });
      });
    });

    describe('GET /api/content-items/tags/suggestions', () => {
      const mockSuggestions = [
        { id: 'tag-1', name: 'AI技术' },
        { id: 'tag-2', name: 'AI应用' },
      ];

      it('应该返回标签建议', async () => {
        tagServiceInstance.searchSuggestions.mockResolvedValue(mockSuggestions as any);

        const response = await request(app)
          .get('/api/content-items/tags/suggestions')
          .query({ query: 'AI', limit: 5 })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockSuggestions,
        });

        expect(tagServiceInstance.searchSuggestions).toHaveBeenCalledWith(
          'AI',
          5,
          undefined
        );
      });

      it('当缺少查询参数时应该返回400', async () => {
        const response = await request(app)
          .get('/api/content-items/tags/suggestions')
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: '查询参数是必需的',
        });
      });
    });

    describe('GET /api/content-items/tags/popular', () => {
      const mockPopularTags = [
        { id: 'tag-1', name: 'AI技术', usageCount: 100 },
        { id: 'tag-2', name: '机器学习', usageCount: 80 },
      ];

      it('应该返回热门标签', async () => {
        tagServiceInstance.getPopularTags.mockResolvedValue(mockPopularTags as any);

        const response = await request(app)
          .get('/api/content-items/tags/popular')
          .query({ limit: 10 })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockPopularTags,
        });

        expect(tagServiceInstance.getPopularTags).toHaveBeenCalledWith(10, undefined);
      });
    });
  });
});
