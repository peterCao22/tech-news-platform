// RSS服务单元测试
// 测试RSS解析、内容获取和处理功能
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { RSSService } from '../../services/rss.service';
import { sourceRepository, contentRepository } from '@tech-news-platform/database';
import { contentFilterService } from '../../services/content-filter.service';
import { logger } from '../../utils/logger';
// 模拟依赖
jest.mock('@tech-news-platform/database', () => ({
    sourceRepository: {
        findById: jest.fn(),
        updateFetchStats: jest.fn(),
        findActiveRssSources: jest.fn(),
    },
    contentRepository: {
        findRecent: jest.fn(),
        createMany: jest.fn(),
        create: jest.fn(),
    },
}));
jest.mock('../../services/content-filter.service', () => ({
    contentFilterService: {
        filterContentBatch: jest.fn(),
        getFilterStats: jest.fn(),
    },
}));
jest.mock('../../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));
// 模拟rss-parser
jest.mock('rss-parser', () => {
    return jest.fn().mockImplementation(() => ({
        parseURL: jest.fn(),
    }));
});
describe('RSSService', () => {
    let rssService;
    let mockParser;
    beforeEach(() => {
        jest.clearAllMocks();
        rssService = new RSSService();
        // 获取模拟的parser实例
        mockParser = rssService.parser;
    });
    describe('parseFeed', () => {
        it('应该成功解析有效的RSS URL', async () => {
            const mockFeed = {
                title: 'Test Feed',
                description: 'Test Description',
                items: [
                    {
                        title: 'Test Article',
                        link: 'https://example.com/article1',
                        pubDate: '2025-09-28T10:00:00Z',
                        contentSnippet: 'Test content snippet',
                    },
                ],
            };
            mockParser.parseURL.mockResolvedValue(mockFeed);
            const result = await rssService.parseFeed('https://example.com/rss');
            expect(result).toEqual(mockFeed);
            expect(mockParser.parseURL).toHaveBeenCalledWith('https://example.com/rss');
        });
        it('应该处理RSS解析错误', async () => {
            const error = new Error('Network error');
            mockParser.parseURL.mockRejectedValue(error);
            await expect(rssService.parseFeed('https://invalid-url.com/rss'))
                .rejects.toThrow('RSS解析失败: Network error');
            expect(logger.error).toHaveBeenCalledWith('解析RSS源失败: https://invalid-url.com/rss', { error: 'Network error' });
        });
        it('应该处理超时错误', async () => {
            const timeoutError = new Error('Timeout');
            timeoutError.name = 'TimeoutError';
            mockParser.parseURL.mockRejectedValue(timeoutError);
            await expect(rssService.parseFeed('https://slow-site.com/rss'))
                .rejects.toThrow('RSS解析失败: Timeout');
        });
    });
    // 注意：convertRSSItemToContent是私有方法，我们通过fetchAndProcessSource间接测试其功能
    describe('fetchAndProcessSource', () => {
        const mockSource = {
            id: 'source-123',
            name: 'Test Source',
            url: 'https://example.com/rss',
            type: 'RSS',
            status: 'ACTIVE',
        };
        const mockFeed = {
            title: 'Test Feed',
            items: [
                {
                    title: 'Article 1',
                    link: 'https://example.com/article1',
                    pubDate: '2025-09-28T10:00:00Z',
                    contentSnippet: 'Technology news article',
                },
                {
                    title: 'Article 2',
                    link: 'https://example.com/article2',
                    pubDate: '2025-09-28T09:00:00Z',
                    contentSnippet: 'Another tech article',
                },
            ],
        };
        beforeEach(() => {
            sourceRepository.findById.mockResolvedValue(mockSource);
            mockParser.parseURL.mockResolvedValue(mockFeed);
            contentRepository.findRecent.mockResolvedValue([]);
            contentFilterService.filterContentBatch.mockReturnValue([
                { shouldFilter: false, includeScore: 0.2, excludeScore: 0.0, reason: 'Contains tech keywords' },
                { shouldFilter: false, includeScore: 0.3, excludeScore: 0.0, reason: 'Contains tech keywords' },
            ]);
            contentFilterService.getFilterStats.mockReturnValue({
                total: 2,
                filtered: 0,
                kept: 2,
                filterRate: 0,
                reasons: {},
            });
            contentRepository.createMany.mockResolvedValue({ count: 2 });
            sourceRepository.updateFetchStats.mockResolvedValue(undefined);
        });
        it('应该成功处理RSS源并保存新内容', async () => {
            const result = await rssService.fetchAndProcessSource('source-123');
            expect(result).toEqual({
                success: true,
                newItemsCount: 2,
            });
            expect(sourceRepository.findById).toHaveBeenCalledWith('source-123');
            expect(mockParser.parseURL).toHaveBeenCalledWith('https://example.com/rss');
            expect(contentRepository.findRecent).toHaveBeenCalledWith('source-123', 48);
            expect(contentFilterService.filterContentBatch).toHaveBeenCalled();
            expect(contentRepository.createMany).toHaveBeenCalled();
            expect(sourceRepository.updateFetchStats).toHaveBeenCalledWith('source-123', true);
        });
        it('应该处理源不存在的情况', async () => {
            sourceRepository.findById.mockResolvedValue(null);
            const result = await rssService.fetchAndProcessSource('invalid-source');
            expect(result).toEqual({
                success: false,
                newItemsCount: 0,
                error: 'Source not found or URL missing',
            });
            expect(sourceRepository.updateFetchStats).toHaveBeenCalledWith('invalid-source', false, 'Source not found or URL missing');
        });
        it('应该正确处理去重逻辑', async () => {
            const existingContent = [
                {
                    id: 'content-1',
                    title: 'article 1',
                    url: 'https://example.com/article1',
                },
            ];
            contentRepository.findRecent.mockResolvedValue(existingContent);
            const result = await rssService.fetchAndProcessSource('source-123');
            // 应该只处理一个新文章（Article 2），因为Article 1已存在
            expect(contentFilterService.filterContentBatch).toHaveBeenCalledWith([
                {
                    title: 'Article 2',
                    description: 'Another tech article',
                    content: '',
                },
            ]);
        });
        it('应该处理内容过滤', async () => {
            contentFilterService.filterContentBatch.mockReturnValue([
                { shouldFilter: true, includeScore: 0.05, excludeScore: 0.4, reason: 'Contains excluded keywords' },
                { shouldFilter: false, includeScore: 0.3, excludeScore: 0.0, reason: 'Contains tech keywords' },
            ]);
            contentFilterService.getFilterStats.mockReturnValue({
                total: 2,
                filtered: 1,
                kept: 1,
                filterRate: 50,
                reasons: { 'Contains excluded keywords': 1 },
            });
            contentRepository.createMany.mockResolvedValue({ count: 1 });
            const result = await rssService.fetchAndProcessSource('source-123');
            expect(result.newItemsCount).toBe(1);
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('❌ 过滤: Article 1'));
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('✅ 保留: Article 2'));
        });
        it('应该处理批量保存失败并尝试逐个保存', async () => {
            contentRepository.createMany.mockRejectedValue(new Error('Batch save failed'));
            contentRepository.create
                .mockResolvedValueOnce({ id: 'content-1' })
                .mockResolvedValueOnce({ id: 'content-2' });
            const result = await rssService.fetchAndProcessSource('source-123');
            expect(result.newItemsCount).toBe(2);
            expect(contentRepository.create).toHaveBeenCalledTimes(2);
            expect(logger.error).toHaveBeenCalledWith('批量保存内容失败，尝试逐个保存', { error: 'Batch save failed' });
        });
        it('应该处理RSS解析错误', async () => {
            mockParser.parseURL.mockRejectedValue(new Error('Parse error'));
            const result = await rssService.fetchAndProcessSource('source-123');
            expect(result).toEqual({
                success: false,
                newItemsCount: 0,
                error: 'RSS解析失败: Parse error',
            });
            expect(sourceRepository.updateFetchStats).toHaveBeenCalledWith('source-123', false, 'RSS解析失败: Parse error');
        });
    });
    describe('validateRSSUrl', () => {
        it('应该验证有效的RSS URL', async () => {
            const mockFeed = {
                title: 'Valid Feed',
                items: [{ title: 'Test Article' }],
            };
            mockParser.parseURL.mockResolvedValue(mockFeed);
            const result = await rssService.validateRSSUrl('https://example.com/rss');
            expect(result).toEqual({
                valid: true,
                title: 'Valid Feed',
                description: undefined,
                itemCount: 1,
                feedInfo: {
                    title: 'Valid Feed',
                    itemCount: 1,
                },
            });
        });
        it('应该拒绝无效的RSS URL', async () => {
            mockParser.parseURL.mockRejectedValue(new Error('Invalid feed'));
            const result = await rssService.validateRSSUrl('https://invalid.com/rss');
            expect(result).toEqual({
                valid: false,
                error: 'RSS解析失败: Invalid feed',
            });
        });
        it('应该处理空的RSS源', async () => {
            const emptyFeed = {
                title: 'Empty Feed',
                items: [],
            };
            mockParser.parseURL.mockResolvedValue(emptyFeed);
            const result = await rssService.validateRSSUrl('https://empty.com/rss');
            expect(result).toEqual({
                valid: true,
                title: 'Empty Feed',
                description: undefined,
                itemCount: 0,
                feedInfo: {
                    title: 'Empty Feed',
                    itemCount: 0,
                },
                warning: 'RSS源当前没有内容项目',
            });
        });
    });
    describe('fetchAllActiveSources', () => {
        it('应该并发处理多个活跃源', async () => {
            const mockSources = [
                { id: 'source-1', name: 'Source 1' },
                { id: 'source-2', name: 'Source 2' },
            ];
            sourceRepository.findActiveRssSources.mockResolvedValue(mockSources);
            // 模拟fetchAndProcessSource方法
            const fetchSpy = jest.spyOn(rssService, 'fetchAndProcessSource')
                .mockResolvedValueOnce({ success: true, newItemsCount: 5 })
                .mockResolvedValueOnce({ success: true, newItemsCount: 3 });
            const result = await rssService.fetchAllActiveSources();
            expect(result).toEqual({
                totalSources: 2,
                successfulSources: 2,
                successCount: 2,
                totalNewItems: 8,
                results: [
                    { sourceId: 'source-1', success: true, newItemsCount: 5 },
                    { sourceId: 'source-2', success: true, newItemsCount: 3 },
                ],
                errors: [],
            });
            expect(fetchSpy).toHaveBeenCalledTimes(2);
            fetchSpy.mockRestore();
        });
    });
});
