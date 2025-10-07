// 内容管理API集成测试
// 测试内容检索、搜索和管理功能
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import { contentRepository, UserRepository } from '@tech-news-platform/database';
import jwt from 'jsonwebtoken';
// 模拟依赖
jest.mock('@tech-news-platform/database', () => ({
    contentRepository: {
        findMany: jest.fn(),
        findById: jest.fn(),
        findRecent: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        getStats: jest.fn(),
        updateStatus: jest.fn(),
    },
    UserRepository: {
        findById: jest.fn(),
    },
    SourceType: {
        RSS: 'RSS',
        API: 'API',
        WEBHOOK: 'WEBHOOK',
    },
    SourceStatus: {
        ACTIVE: 'ACTIVE',
        INACTIVE: 'INACTIVE',
        ERROR: 'ERROR',
    },
    ContentStatus: {
        DRAFT: 'DRAFT',
        PUBLISHED: 'PUBLISHED',
        ARCHIVED: 'ARCHIVED',
        RAW: 'RAW',
        PROCESSING: 'PROCESSING',
        PROCESSED: 'PROCESSED',
        REVIEWED: 'REVIEWED',
        REJECTED: 'REJECTED',
    },
    checkDatabaseConnection: jest.fn().mockResolvedValue(true),
}));
describe('内容管理API集成测试', () => {
    let authToken;
    let adminToken;
    beforeEach(() => {
        jest.clearAllMocks();
        // 创建测试用JWT令牌
        authToken = jwt.sign({ userId: 'user-123', role: 'USER' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
        adminToken = jwt.sign({ userId: 'admin-123', role: 'ADMIN' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
        // 模拟用户查找
        UserRepository.findById.mockImplementation((id) => {
            if (id === 'user-123') {
                return Promise.resolve({
                    id: 'user-123',
                    email: 'user@example.com',
                    role: 'USER',
                    status: 'ACTIVE',
                });
            }
            if (id === 'admin-123') {
                return Promise.resolve({
                    id: 'admin-123',
                    email: 'admin@example.com',
                    role: 'ADMIN',
                    status: 'ACTIVE',
                });
            }
            return Promise.resolve(null);
        });
    });
    describe('GET /api/content', () => {
        it('应该返回内容列表（公开访问）', async () => {
            const mockContents = [
                {
                    id: 'content-1',
                    title: '人工智能技术突破',
                    summary: 'AI技术在各领域取得重大进展',
                    url: 'https://example.com/ai-breakthrough',
                    publishedAt: new Date('2025-09-28T10:00:00Z'),
                    status: 'PUBLISHED',
                    source: {
                        id: 'source-1',
                        name: 'TechCrunch',
                    },
                },
                {
                    id: 'content-2',
                    title: '加密货币市场分析',
                    summary: '比特币和以太坊价格走势分析',
                    url: 'https://example.com/crypto-analysis',
                    publishedAt: new Date('2025-09-28T09:00:00Z'),
                    status: 'PUBLISHED',
                    source: {
                        id: 'source-2',
                        name: 'CoinDesk',
                    },
                },
            ];
            const mockPagination = {
                page: 1,
                limit: 20,
                total: 2,
                totalPages: 1,
            };
            contentRepository.findMany.mockResolvedValue({
                data: mockContents,
                pagination: mockPagination,
            });
            const response = await request(app)
                .get('/api/content')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination.total).toBe(2);
            expect(response.body.data[0].title).toBe('人工智能技术突破');
        });
        it('应该支持分页参数', async () => {
            contentRepository.findMany.mockResolvedValue({
                data: [],
                pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
            });
            await request(app)
                .get('/api/content?page=2&limit=10')
                .expect(200);
            expect(contentRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                page: 2,
                limit: 10,
            }));
        });
        it('应该支持状态过滤', async () => {
            contentRepository.findMany.mockResolvedValue({
                data: [],
                pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            });
            await request(app)
                .get('/api/content?status=PUBLISHED')
                .expect(200);
            expect(contentRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                status: 'PUBLISHED',
            }));
        });
        it('应该支持源ID过滤', async () => {
            contentRepository.findMany.mockResolvedValue({
                data: [],
                pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            });
            await request(app)
                .get('/api/content?sourceId=source-123')
                .expect(200);
            expect(contentRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                sourceId: 'source-123',
            }));
        });
        it('应该支持排序参数', async () => {
            contentRepository.findMany.mockResolvedValue({
                data: [],
                pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            });
            await request(app)
                .get('/api/content?orderBy=publishedAt&orderDirection=desc')
                .expect(200);
            expect(contentRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: 'publishedAt',
                orderDirection: 'desc',
            }));
        });
    });
    describe('GET /api/content/:id', () => {
        it('应该返回指定内容的详情', async () => {
            const mockContent = {
                id: 'content-1',
                title: '人工智能技术突破',
                summary: 'AI技术在各领域取得重大进展',
                content: '详细的文章内容...',
                url: 'https://example.com/ai-breakthrough',
                publishedAt: new Date('2025-09-28T10:00:00Z'),
                status: 'PUBLISHED',
                metadata: {
                    categories: ['AI', 'Technology'],
                    author: 'John Doe',
                },
                source: {
                    id: 'source-1',
                    name: 'TechCrunch',
                    url: 'https://techcrunch.com/feed/',
                },
            };
            contentRepository.findById.mockResolvedValue(mockContent);
            const response = await request(app)
                .get('/api/content/content-1')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('人工智能技术突破');
            expect(response.body.data.content).toBe('详细的文章内容...');
            expect(response.body.data.source.name).toBe('TechCrunch');
        });
        it('应该处理内容不存在的情况', async () => {
            contentRepository.findById.mockResolvedValue(null);
            const response = await request(app)
                .get('/api/content/nonexistent')
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('CONTENT_NOT_FOUND');
        });
    });
    describe('GET /api/content/recent', () => {
        it('应该返回最近的内容', async () => {
            const mockRecentContent = [
                {
                    id: 'content-1',
                    title: '最新科技新闻',
                    publishedAt: new Date(),
                    status: 'PUBLISHED',
                },
            ];
            contentRepository.findRecent.mockResolvedValue(mockRecentContent);
            const response = await request(app)
                .get('/api/content/recent')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(contentRepository.findRecent).toHaveBeenCalledWith(expect.any(Object), 24);
        });
        it('应该支持自定义时间范围', async () => {
            contentRepository.findRecent.mockResolvedValue([]);
            await request(app)
                .get('/api/content/recent?hours=48')
                .expect(200);
            expect(contentRepository.findRecent).toHaveBeenCalledWith(expect.any(Object), 48);
        });
        it('应该支持源ID过滤', async () => {
            contentRepository.findRecent.mockResolvedValue([]);
            await request(app)
                .get('/api/content/recent?sourceId=source-123')
                .expect(200);
            expect(contentRepository.findRecent).toHaveBeenCalledWith('source-123', 24);
        });
    });
    describe('GET /api/content/search', () => {
        it('应该支持内容搜索', async () => {
            const mockSearchResults = {
                data: [
                    {
                        id: 'content-1',
                        title: '人工智能搜索结果',
                        summary: '包含人工智能关键词的内容',
                        relevanceScore: 0.95,
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1,
                },
            };
            contentRepository.findMany.mockResolvedValue(mockSearchResults);
            const response = await request(app)
                .get('/api/content/search?q=人工智能')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toContain('人工智能');
            expect(contentRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                search: '人工智能',
            }));
        });
        it('应该要求搜索关键词', async () => {
            const response = await request(app)
                .get('/api/content/search')
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });
        it('应该支持搜索过滤参数', async () => {
            contentRepository.findMany.mockResolvedValue({
                data: [],
                pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            });
            await request(app)
                .get('/api/content/search?q=AI&category=technology&sourceId=source-1')
                .expect(200);
            expect(contentRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                search: 'AI',
                category: 'technology',
                sourceId: 'source-1',
            }));
        });
    });
    describe('PUT /api/content/:id', () => {
        const updateData = {
            title: '更新的标题',
            summary: '更新的摘要',
            status: 'PUBLISHED',
        };
        it('应该允许认证用户更新内容', async () => {
            const mockUpdatedContent = {
                id: 'content-1',
                ...updateData,
                updatedAt: new Date(),
            };
            contentRepository.update.mockResolvedValue(mockUpdatedContent);
            const response = await request(app)
                .put('/api/content/content-1')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('更新的标题');
            expect(contentRepository.update).toHaveBeenCalledWith('content-1', expect.objectContaining({
                title: '更新的标题',
                summary: '更新的摘要'
            }));
        });
        it('应该拒绝未认证的请求', async () => {
            const response = await request(app)
                .put('/api/content/content-1')
                .send(updateData)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('TOKEN_MISSING');
        });
        it('应该处理内容不存在的情况', async () => {
            contentRepository.update.mockResolvedValue(null);
            const response = await request(app)
                .put('/api/content/nonexistent')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('CONTENT_NOT_FOUND');
        });
    });
    describe('DELETE /api/content/:id', () => {
        it('应该允许管理员删除内容', async () => {
            contentRepository.delete.mockResolvedValue(true);
            const response = await request(app)
                .delete('/api/content/content-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('删除成功');
            expect(contentRepository.delete).toHaveBeenCalledWith('content-1');
        });
        it('应该拒绝非管理员用户删除', async () => {
            const response = await request(app)
                .delete('/api/content/content-1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
        });
    });
    describe('POST /api/content/batch-update-status', () => {
        it('应该允许批量更新内容状态', async () => {
            const batchData = {
                contentIds: ['content-1', 'content-2', 'content-3'],
                status: 'ARCHIVED',
            };
            contentRepository.updateStatus.mockResolvedValue({
                count: 3,
            });
            const response = await request(app)
                .post('/api/content/batch-update-status')
                .set('Authorization', `Bearer ${authToken}`)
                .send(batchData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedCount).toBe(3);
            expect(contentRepository.updateStatus).toHaveBeenCalledWith(expect.arrayContaining(['content-1', 'content-2', 'content-3']), expect.any(String));
        });
        it('应该验证批量更新参数', async () => {
            const invalidData = {
                contentIds: [], // 空数组
                status: 'INVALID_STATUS',
            };
            const response = await request(app)
                .post('/api/content/batch-update-status')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });
    });
    describe('GET /api/content/stats', () => {
        it('应该返回内容统计信息', async () => {
            const mockStats = {
                totalContent: 1500,
                publishedContent: 1200,
                draftContent: 200,
                archivedContent: 100,
                recentContent: 50,
                topSources: [
                    { sourceId: 'source-1', sourceName: 'TechCrunch', count: 300 },
                    { sourceId: 'source-2', sourceName: 'MIT Tech Review', count: 250 },
                ],
            };
            contentRepository.getStats.mockResolvedValue(mockStats);
            const response = await request(app)
                .get('/api/content/stats')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalContent).toBe(1500);
            expect(response.body.data.topSources).toHaveLength(2);
        });
    });
    describe('错误处理', () => {
        it('应该处理数据库错误', async () => {
            contentRepository.findMany.mockRejectedValue(new Error('Database error'));
            const response = await request(app)
                .get('/api/content')
                .expect(500);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
        });
        it('应该处理搜索服务错误', async () => {
            contentRepository.findMany.mockRejectedValue(new Error('Search service error'));
            const response = await request(app)
                .get('/api/content/search?q=test')
                .expect(500);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
        });
    });
    describe('输入验证', () => {
        it('应该验证分页参数', async () => {
            const response = await request(app)
                .get('/api/content?page=0&limit=101')
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });
        it('应该验证排序参数', async () => {
            const response = await request(app)
                .get('/api/content?orderBy=invalid&orderDirection=invalid')
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });
        it('应该清理搜索查询中的恶意内容', async () => {
            contentRepository.findMany.mockResolvedValue({
                data: [],
                pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            });
            await request(app)
                .get('/api/content/search?q=<script>alert("xss")</script>')
                .expect(200);
            // 验证搜索查询被清理
            expect(contentRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                search: expect.not.stringContaining('<script>'),
            }));
        });
    });
    describe('性能测试', () => {
        it('应该在合理时间内返回大量内容', async () => {
            const largeContentList = Array.from({ length: 100 }, (_, i) => ({
                id: `content-${i}`,
                title: `Content ${i}`,
                summary: `Summary ${i}`,
                publishedAt: new Date(),
                status: 'PUBLISHED',
            }));
            contentRepository.findMany.mockResolvedValue({
                data: largeContentList,
                pagination: { page: 1, limit: 100, total: 100, totalPages: 1 },
            });
            const startTime = Date.now();
            const response = await request(app)
                .get('/api/content?limit=100')
                .expect(200);
            const endTime = Date.now();
            expect(response.body.data).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
        });
    });
});
