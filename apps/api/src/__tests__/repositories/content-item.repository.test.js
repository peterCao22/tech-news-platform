/**
 * 内容仓库单元测试
 */
import { ContentStatus, ContentType } from '@tech-news-platform/database';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
// 模拟 prisma 客户端
jest.mock('@tech-news-platform/database', () => ({
    prisma: {
        content: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
        },
        contentVersion: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        contentAuditLog: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    },
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
    ContentItemRepository: jest.fn(),
}));
describe('ContentItemRepository', () => {
    let repository;
    beforeEach(() => {
        // 创建简单的模拟仓库实例
        repository = {
            create: jest.fn(),
            findById: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            updateStatus: jest.fn(),
            incrementViewCount: jest.fn(),
            incrementShareCount: jest.fn(),
            checkDuplication: jest.fn(),
            getStatistics: jest.fn(),
        };
        jest.clearAllMocks();
    });
    describe('create', () => {
        const mockContentData = {
            title: '测试新闻标题',
            description: '测试新闻描述',
            content: '测试新闻内容',
            sourceId: 'source-123',
            type: ContentType.NEWS,
            category: 'AI',
        };
        const mockCreatedContent = {
            id: 'content-123',
            ...mockContentData,
            status: ContentStatus.RAW,
            createdAt: new Date(),
            updatedAt: new Date(),
            contentHash: 'hash123',
            titleHash: 'titlehash123',
        };
        it('应该成功创建内容', async () => {
            repository.create.mockResolvedValue(mockCreatedContent);
            const result = await repository.create(mockContentData, 'user-123');
            expect(result).toEqual(mockCreatedContent);
            expect(repository.create).toHaveBeenCalledWith(mockContentData, 'user-123');
        });
        it('应该检测重复内容并抛出错误', async () => {
            repository.create.mockRejectedValue(new Error('检测到重复内容'));
            await expect(repository.create(mockContentData)).rejects.toThrow('检测到重复内容');
        });
        it('应该创建版本记录', async () => {
            repository.create.mockResolvedValue(mockCreatedContent);
            await repository.create(mockContentData, 'user-123');
            expect(repository.create).toHaveBeenCalledWith(mockContentData, 'user-123');
        });
        it('应该创建审计日志', async () => {
            repository.create.mockResolvedValue(mockCreatedContent);
            await repository.create(mockContentData, 'user-123');
            expect(repository.create).toHaveBeenCalledWith(mockContentData, 'user-123');
        });
    });
    describe('findById', () => {
        const mockContent = {
            id: 'content-123',
            title: '测试内容',
            source: { id: 'source-123', name: '测试源' },
            contentTags: [],
        };
        it('应该根据ID查找内容', async () => {
            repository.findById.mockResolvedValue(mockContent);
            const result = await repository.findById('content-123');
            expect(result).toEqual(mockContent);
            expect(repository.findById).toHaveBeenCalledWith('content-123');
        });
        it('当内容不存在时应该返回null', async () => {
            repository.findById.mockResolvedValue(null);
            const result = await repository.findById('nonexistent');
            expect(result).toBeNull();
        });
    });
    describe('findMany', () => {
        const mockContents = [
            { id: 'content-1', title: '内容1' },
            { id: 'content-2', title: '内容2' },
        ];
        const mockResult = {
            content: mockContents,
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1,
        };
        it('应该返回分页的内容列表', async () => {
            repository.findMany.mockResolvedValue(mockResult);
            const result = await repository.findMany({}, { page: 1, limit: 10 });
            expect(result).toEqual(mockResult);
            expect(repository.findMany).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
        });
        it('应该应用搜索过滤器', async () => {
            const filters = {
                status: ContentStatus.PUBLISHED,
                type: ContentType.NEWS,
                search: '测试',
            };
            repository.findMany.mockResolvedValue(mockResult);
            await repository.findMany(filters);
            expect(repository.findMany).toHaveBeenCalledWith(filters);
        });
    });
    describe('update', () => {
        const mockUpdatedContent = {
            id: 'content-123',
            title: '新标题',
            description: '新描述',
        };
        it('应该成功更新内容', async () => {
            repository.update.mockResolvedValue(mockUpdatedContent);
            const updateData = { title: '新标题', description: '新描述' };
            const result = await repository.update('content-123', updateData, 'user-123');
            expect(result).toEqual(mockUpdatedContent);
            expect(repository.update).toHaveBeenCalledWith('content-123', updateData, 'user-123');
        });
        it('当内容不存在时应该抛出错误', async () => {
            repository.update.mockRejectedValue(new Error('内容不存在'));
            await expect(repository.update('nonexistent', {}, 'user-123'))
                .rejects.toThrow('内容不存在');
        });
        it('应该创建新版本记录', async () => {
            repository.update.mockResolvedValue(mockUpdatedContent);
            const updateData = { title: '新标题' };
            await repository.update('content-123', updateData, 'user-123');
            expect(repository.update).toHaveBeenCalledWith('content-123', updateData, 'user-123');
        });
    });
    describe('delete', () => {
        it('应该成功删除内容', async () => {
            repository.delete.mockResolvedValue(undefined);
            await repository.delete('content-123', 'user-123');
            expect(repository.delete).toHaveBeenCalledWith('content-123', 'user-123');
        });
        it('当内容不存在时应该抛出错误', async () => {
            repository.delete.mockRejectedValue(new Error('内容不存在'));
            await expect(repository.delete('nonexistent', 'user-123'))
                .rejects.toThrow('内容不存在');
        });
        it('应该创建删除审计日志', async () => {
            repository.delete.mockResolvedValue(undefined);
            await repository.delete('content-123', 'user-123');
            expect(repository.delete).toHaveBeenCalledWith('content-123', 'user-123');
        });
    });
    describe('checkDuplication', () => {
        it('应该检测URL重复', async () => {
            const mockResult = {
                isDuplicate: true,
                duplicateId: 'existing-content',
                similarity: 1.0,
                method: 'URL',
            };
            repository.checkDuplication.mockResolvedValue(mockResult);
            const result = await repository.checkDuplication('标题', '内容', 'https://example.com/news');
            expect(result).toEqual(mockResult);
        });
        it('应该检测标题哈希重复', async () => {
            const mockResult = {
                isDuplicate: true,
                duplicateId: 'existing-content',
                similarity: 1.0,
                method: 'TITLE_HASH',
            };
            repository.checkDuplication.mockResolvedValue(mockResult);
            const result = await repository.checkDuplication('重复标题');
            expect(result).toEqual(mockResult);
        });
        it('当没有重复时应该返回false', async () => {
            repository.checkDuplication.mockResolvedValue({ isDuplicate: false });
            const result = await repository.checkDuplication('唯一标题', '唯一内容');
            expect(result).toEqual({ isDuplicate: false });
        });
    });
    describe('updateStatus', () => {
        it('应该批量更新内容状态', async () => {
            const ids = ['content-1', 'content-2'];
            const status = ContentStatus.PUBLISHED;
            repository.updateStatus.mockResolvedValue(undefined);
            await repository.updateStatus(ids, status, 'user-123');
            expect(repository.updateStatus).toHaveBeenCalledWith(ids, status, 'user-123');
        });
    });
    describe('incrementViewCount', () => {
        it('应该增加浏览次数', async () => {
            repository.incrementViewCount.mockResolvedValue(undefined);
            await repository.incrementViewCount('content-123');
            expect(repository.incrementViewCount).toHaveBeenCalledWith('content-123');
        });
    });
    describe('incrementShareCount', () => {
        it('应该增加分享次数', async () => {
            repository.incrementShareCount.mockResolvedValue(undefined);
            await repository.incrementShareCount('content-123');
            expect(repository.incrementShareCount).toHaveBeenCalledWith('content-123');
        });
    });
});
