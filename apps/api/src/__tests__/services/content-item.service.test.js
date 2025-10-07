/**
 * 内容管理服务单元测试
 */
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ContentItemService } from '../../services/content-item.service';
// 创建模拟仓库对象
const mockContentRepository = {
    findMany: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    incrementViewCount: jest.fn(),
    incrementShareCount: jest.fn(),
    checkDuplication: jest.fn(),
    getStatistics: jest.fn(),
    exists: jest.fn(),
};
const mockTagRepository = {
    findByName: jest.fn(),
    create: jest.fn(),
    incrementUsage: jest.fn(),
    decrementUsage: jest.fn(),
};
const mockContentTagRepository = {
    addTagToContent: jest.fn(),
    removeTagFromContent: jest.fn(),
};
// 模拟数据库包
jest.mock('@tech-news-platform/database', () => ({
    prisma: {},
    ContentItemRepository: jest.fn().mockImplementation(() => mockContentRepository),
    TagRepository: jest.fn().mockImplementation(() => mockTagRepository),
    ContentTagRepository: jest.fn().mockImplementation(() => mockContentTagRepository),
    ContentStatus: {
        RAW: 'RAW',
        REVIEWED: 'REVIEWED',
        PUBLISHED: 'PUBLISHED',
        ARCHIVED: 'ARCHIVED',
        DUPLICATE: 'DUPLICATE',
    },
    ContentType: {
        NEWS: 'NEWS',
        ARTICLE: 'ARTICLE',
        BLOG: 'BLOG',
        PRESS_RELEASE: 'PRESS_RELEASE',
        RESEARCH: 'RESEARCH',
        OTHER: 'OTHER',
    },
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
const ContentStatus = {
    RAW: 'RAW',
    REVIEWED: 'REVIEWED',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED',
    DUPLICATE: 'DUPLICATE',
};
const ContentType = {
    NEWS: 'NEWS',
    ARTICLE: 'ARTICLE',
    BLOG: 'BLOG',
    PRESS_RELEASE: 'PRESS_RELEASE',
    RESEARCH: 'RESEARCH',
    OTHER: 'OTHER',
};
describe('ContentItemService', () => {
    let service;
    beforeEach(() => {
        service = new ContentItemService();
        jest.clearAllMocks();
    });
    describe('getContent', () => {
        const mockContentList = {
            content: [
                { id: 'content-1', title: '内容1' },
                { id: 'content-2', title: '内容2' },
            ],
            total: 2,
            page: 1,
            limit: 20,
            totalPages: 1,
        };
        it('应该返回内容列表', async () => {
            mockContentRepository.findMany.mockResolvedValue(mockContentList);
            const result = await service.getContent({}, { page: 1, limit: 20 });
            expect(result).toEqual(mockContentList);
            expect(mockContentRepository.findMany).toHaveBeenCalledWith({}, { page: 1, limit: 20 });
        });
    });
    describe('getContentById', () => {
        const mockContent = {
            id: 'content-123',
            title: '测试内容',
            source: { id: 'source-123' },
        };
        it('应该根据ID返回内容', async () => {
            mockContentRepository.findById.mockResolvedValue(mockContent);
            const result = await service.getContentById('content-123');
            expect(result).toEqual(mockContent);
            expect(mockContentRepository.findById).toHaveBeenCalledWith('content-123', true);
        });
    });
    describe('createContent', () => {
        const mockContentData = {
            title: '新内容',
            description: '内容描述',
            sourceId: 'source-123',
        };
        const mockCreatedContent = {
            id: 'content-123',
            ...mockContentData,
            status: ContentStatus.RAW,
        };
        it('应该成功创建内容', async () => {
            mockContentRepository.exists.mockResolvedValue(true); // 来源存在
            mockContentRepository.create.mockResolvedValue(mockCreatedContent);
            const result = await service.createContent(mockContentData, 'user-123');
            expect(result).toEqual(mockCreatedContent);
            expect(mockContentRepository.exists).toHaveBeenCalledWith('source', { id: 'source-123' });
            expect(mockContentRepository.create).toHaveBeenCalledWith(mockContentData, 'user-123');
        });
        it('当来源不存在时应该抛出错误', async () => {
            mockContentRepository.exists.mockResolvedValue(false);
            await expect(service.createContent(mockContentData, 'user-123'))
                .rejects.toThrow('指定的来源不存在');
        });
    });
    describe('updateContent', () => {
        const mockUpdateData = { title: '更新的标题' };
        const mockUpdatedContent = {
            id: 'content-123',
            title: '更新的标题',
        };
        it('应该成功更新内容', async () => {
            mockContentRepository.update.mockResolvedValue(mockUpdatedContent);
            const result = await service.updateContent('content-123', mockUpdateData, 'user-123');
            expect(result).toEqual(mockUpdatedContent);
            expect(mockContentRepository.update).toHaveBeenCalledWith('content-123', mockUpdateData, 'user-123');
        });
    });
    describe('deleteContent', () => {
        it('应该成功删除内容', async () => {
            mockContentRepository.delete.mockResolvedValue(undefined);
            await service.deleteContent('content-123', 'user-123');
            expect(mockContentRepository.delete).toHaveBeenCalledWith('content-123', 'user-123');
        });
    });
    describe('updateContentStatus', () => {
        it('应该批量更新内容状态', async () => {
            const ids = ['content-1', 'content-2'];
            const status = ContentStatus.PUBLISHED;
            mockContentRepository.updateStatus.mockResolvedValue(undefined);
            await service.updateContentStatus(ids, status, 'user-123');
            expect(mockContentRepository.updateStatus).toHaveBeenCalledWith(ids, status, 'user-123');
        });
    });
    describe('addContentTags', () => {
        const mockContent = { id: 'content-123', title: '测试内容' };
        const mockTag = { id: 'tag-123', name: 'AI技术' };
        const mockUpdatedContent = { ...mockContent, contentTags: [{ tag: mockTag }] };
        it('应该为内容添加现有标签', async () => {
            const tagIds = ['tag-123'];
            mockContentRepository.findById.mockResolvedValueOnce(mockContent);
            mockContentTagRepository.addTagToContent.mockResolvedValue({});
            mockTagRepository.incrementUsage.mockResolvedValue(undefined);
            mockContentRepository.findById.mockResolvedValueOnce(mockUpdatedContent);
            const result = await service.addContentTags('content-123', tagIds);
            expect(result).toEqual(mockUpdatedContent);
            expect(mockContentTagRepository.addTagToContent).toHaveBeenCalledWith('content-123', 'tag-123');
            expect(mockTagRepository.incrementUsage).toHaveBeenCalledWith('tag-123');
        });
        it('应该创建新标签并添加到内容', async () => {
            const tagNames = ['新标签'];
            mockContentRepository.findById.mockResolvedValueOnce(mockContent);
            mockTagRepository.findByName.mockResolvedValue(null); // 标签不存在
            mockTagRepository.create.mockResolvedValue(mockTag);
            mockContentTagRepository.addTagToContent.mockResolvedValue({});
            mockTagRepository.incrementUsage.mockResolvedValue(undefined);
            mockContentRepository.findById.mockResolvedValueOnce(mockUpdatedContent);
            const result = await service.addContentTags('content-123', undefined, tagNames);
            expect(mockTagRepository.create).toHaveBeenCalledWith({
                name: '新标签',
                slug: '新标签'.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                type: 'TOPIC',
            });
            expect(result).toEqual(mockUpdatedContent);
        });
        it('当内容不存在时应该抛出错误', async () => {
            mockContentRepository.findById.mockResolvedValue(null);
            await expect(service.addContentTags('nonexistent', ['tag-123']))
                .rejects.toThrow('内容不存在');
        });
    });
    describe('removeContentTags', () => {
        const mockContent = { id: 'content-123', title: '测试内容' };
        it('应该移除内容标签', async () => {
            const tagIds = ['tag-1', 'tag-2'];
            mockContentRepository.findById.mockResolvedValue(mockContent);
            mockContentTagRepository.removeTagFromContent.mockResolvedValue(undefined);
            mockTagRepository.decrementUsage.mockResolvedValue(undefined);
            await service.removeContentTags('content-123', tagIds);
            expect(mockContentTagRepository.removeTagFromContent).toHaveBeenCalledTimes(2);
            expect(mockTagRepository.decrementUsage).toHaveBeenCalledTimes(2);
        });
        it('当内容不存在时应该抛出错误', async () => {
            mockContentRepository.findById.mockResolvedValue(null);
            await expect(service.removeContentTags('nonexistent', ['tag-123']))
                .rejects.toThrow('内容不存在');
        });
    });
    describe('checkDuplication', () => {
        const mockDuplicationResult = {
            isDuplicate: true,
            duplicateId: 'existing-content',
            similarity: 0.95,
            method: 'TITLE_SIMILARITY',
        };
        it('应该检查内容重复', async () => {
            mockContentRepository.checkDuplication.mockResolvedValue(mockDuplicationResult);
            const result = await service.checkDuplication('测试标题', '测试内容', 'https://example.com');
            expect(result).toEqual(mockDuplicationResult);
            expect(mockContentRepository.checkDuplication).toHaveBeenCalledWith('测试标题', '测试内容', 'https://example.com');
        });
    });
    describe('incrementViewCount', () => {
        it('应该增加浏览次数', async () => {
            mockContentRepository.incrementViewCount.mockResolvedValue(undefined);
            await service.incrementViewCount('content-123');
            expect(mockContentRepository.incrementViewCount).toHaveBeenCalledWith('content-123');
        });
    });
    describe('incrementShareCount', () => {
        it('应该增加分享次数', async () => {
            mockContentRepository.incrementShareCount.mockResolvedValue(undefined);
            await service.incrementShareCount('content-123');
            expect(mockContentRepository.incrementShareCount).toHaveBeenCalledWith('content-123');
        });
    });
    describe('getStatistics', () => {
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
        it('应该返回统计信息', async () => {
            mockContentRepository.getStatistics.mockResolvedValue(mockStats);
            const result = await service.getStatistics();
            expect(result).toEqual(mockStats);
            expect(mockContentRepository.getStatistics).toHaveBeenCalled();
        });
    });
});
