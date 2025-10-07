// RSS源管理API集成测试
// 测试RSS源的CRUD操作和相关功能
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import { sourceRepository, UserRepository } from '@tech-news-platform/database';
import { rssService } from '../../services/rss.service';
import jwt from 'jsonwebtoken';
// 模拟依赖
jest.mock('@tech-news-platform/database', () => ({
    sourceRepository: {
        findMany: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        getStats: jest.fn(),
        findActiveRssSources: jest.fn(),
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
jest.mock('../../services/rss.service', () => ({
    rssService: {
        validateRSSUrl: jest.fn(),
        fetchAndProcessSource: jest.fn(),
        fetchAllActiveSources: jest.fn(),
    },
}));
describe('RSS源管理API集成测试', () => {
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
    describe('GET /api/sources', () => {
        it('应该返回所有RSS源列表（公开访问）', async () => {
            const mockSources = [
                {
                    id: 'source-1',
                    name: 'TechCrunch',
                    type: 'RSS',
                    url: 'https://techcrunch.com/feed/',
                    status: 'ACTIVE',
                    createdAt: new Date(),
                },
                {
                    id: 'source-2',
                    name: 'MIT Technology Review',
                    type: 'RSS',
                    url: 'https://www.technologyreview.com/feed/',
                    status: 'ACTIVE',
                    createdAt: new Date(),
                },
            ];
            sourceRepository.findMany.mockResolvedValue(mockSources);
            const response = await request(app)
                .get('/api/sources')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0].name).toBe('TechCrunch');
        });
        it('应该支持分页参数', async () => {
            sourceRepository.findMany.mockResolvedValue([]);
            await request(app)
                .get('/api/sources?page=2&limit=10')
                .expect(200);
            expect(sourceRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                page: 2,
                limit: 10,
            }));
        });
        it('应该支持状态过滤', async () => {
            sourceRepository.findMany.mockResolvedValue([]);
            await request(app)
                .get('/api/sources?status=ACTIVE')
                .expect(200);
            expect(sourceRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                status: 'ACTIVE',
            }));
        });
    });
    describe('GET /api/sources/:id', () => {
        it('应该返回指定的RSS源详情', async () => {
            const mockSource = {
                id: 'source-1',
                name: 'TechCrunch',
                type: 'RSS',
                url: 'https://techcrunch.com/feed/',
                status: 'ACTIVE',
                description: 'Technology news and analysis',
                createdAt: new Date(),
            };
            sourceRepository.findById.mockResolvedValue(mockSource);
            const response = await request(app)
                .get('/api/sources/source-1')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('TechCrunch');
            expect(response.body.data.url).toBe('https://techcrunch.com/feed/');
        });
        it('应该处理源不存在的情况', async () => {
            sourceRepository.findById.mockResolvedValue(null);
            const response = await request(app)
                .get('/api/sources/nonexistent')
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('SOURCE_NOT_FOUND');
        });
    });
    describe('POST /api/sources', () => {
        const validSourceData = {
            name: 'New Tech Source',
            type: 'RSS',
            url: 'https://example.com/rss',
            description: 'A new technology news source',
        };
        it('应该成功创建新的RSS源（需要认证）', async () => {
            const mockCreatedSource = {
                id: 'source-new',
                ...validSourceData,
                status: 'ACTIVE',
                createdAt: new Date(),
            };
            sourceRepository.create.mockResolvedValue(mockCreatedSource);
            const response = await request(app)
                .post('/api/sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validSourceData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('New Tech Source');
            expect(sourceRepository.create).toHaveBeenCalledWith(expect.objectContaining(validSourceData));
        });
        it('应该拒绝未认证的请求', async () => {
            const response = await request(app)
                .post('/api/sources')
                .send(validSourceData)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('TOKEN_MISSING');
        });
        it('应该验证必需字段', async () => {
            const invalidData = {
                name: '', // 空名称
                type: 'RSS',
            };
            const response = await request(app)
                .post('/api/sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });
        it('应该验证URL格式', async () => {
            const invalidData = {
                ...validSourceData,
                url: 'not-a-valid-url',
            };
            const response = await request(app)
                .post('/api/sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });
    });
    describe('PUT /api/sources/:id', () => {
        const updateData = {
            name: 'Updated Source Name',
            description: 'Updated description',
        };
        it('应该成功更新RSS源', async () => {
            const mockUpdatedSource = {
                id: 'source-1',
                ...updateData,
                type: 'RSS',
                url: 'https://example.com/rss',
                status: 'ACTIVE',
                updatedAt: new Date(),
            };
            sourceRepository.update.mockResolvedValue(mockUpdatedSource);
            const response = await request(app)
                .put('/api/sources/source-1')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Source Name');
            expect(sourceRepository.update).toHaveBeenCalledWith('source-1', updateData);
        });
        it('应该处理源不存在的情况', async () => {
            sourceRepository.update.mockResolvedValue(null);
            const response = await request(app)
                .put('/api/sources/nonexistent')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('SOURCE_NOT_FOUND');
        });
    });
    describe('DELETE /api/sources/:id', () => {
        it('应该允许管理员删除RSS源', async () => {
            sourceRepository.delete.mockResolvedValue(true);
            const response = await request(app)
                .delete('/api/sources/source-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('删除成功');
            expect(sourceRepository.delete).toHaveBeenCalledWith('source-1');
        });
        it('应该拒绝非管理员用户删除', async () => {
            const response = await request(app)
                .delete('/api/sources/source-1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
        });
        it('应该处理源不存在的情况', async () => {
            sourceRepository.delete.mockResolvedValue(false);
            const response = await request(app)
                .delete('/api/sources/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('SOURCE_NOT_FOUND');
        });
    });
    describe('POST /api/sources/validate-url', () => {
        it('应该验证有效的RSS URL', async () => {
            rssService.validateRSSUrl.mockResolvedValue({
                valid: true,
                feedInfo: {
                    title: 'Valid Feed',
                    itemCount: 10,
                },
            });
            const response = await request(app)
                .post('/api/sources/validate-url')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ url: 'https://example.com/rss' })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.valid).toBe(true);
            expect(response.body.data.feedInfo.title).toBe('Valid Feed');
        });
        it('应该拒绝无效的RSS URL', async () => {
            rssService.validateRSSUrl.mockResolvedValue({
                valid: false,
                error: 'Invalid RSS feed',
            });
            const response = await request(app)
                .post('/api/sources/validate-url')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ url: 'https://invalid.com/rss' })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.valid).toBe(false);
            expect(response.body.data.error).toBe('Invalid RSS feed');
        });
        it('应该要求认证', async () => {
            const response = await request(app)
                .post('/api/sources/validate-url')
                .send({ url: 'https://example.com/rss' })
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('TOKEN_MISSING');
        });
    });
    describe('POST /api/sources/:id/fetch', () => {
        it('应该手动触发RSS源抓取', async () => {
            rssService.fetchAndProcessSource.mockResolvedValue({
                success: true,
                newItemsCount: 5,
            });
            const response = await request(app)
                .post('/api/sources/source-1/fetch')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.newItemsCount).toBe(5);
            expect(rssService.fetchAndProcessSource).toHaveBeenCalledWith('source-1');
        });
        it('应该处理抓取失败', async () => {
            rssService.fetchAndProcessSource.mockResolvedValue({
                success: false,
                newItemsCount: 0,
                error: 'Network error',
            });
            const response = await request(app)
                .post('/api/sources/source-1/fetch')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.success).toBe(false);
            expect(response.body.data.error).toBe('Network error');
        });
    });
    describe('POST /api/sources/fetch-all', () => {
        it('应该批量抓取所有活跃源', async () => {
            rssService.fetchAllActiveSources.mockResolvedValue({
                totalSources: 3,
                successfulSources: 2,
                totalNewItems: 15,
                results: [
                    { sourceId: 'source-1', success: true, newItemsCount: 8 },
                    { sourceId: 'source-2', success: true, newItemsCount: 7 },
                    { sourceId: 'source-3', success: false, error: 'Timeout' },
                ],
            });
            const response = await request(app)
                .post('/api/sources/fetch-all')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalSources).toBe(3);
            expect(response.body.data.successfulSources).toBe(2);
            expect(response.body.data.totalNewItems).toBe(15);
        });
    });
    describe('GET /api/sources/stats', () => {
        it('应该返回RSS源统计信息', async () => {
            const mockStats = {
                totalSources: 10,
                activeSources: 8,
                inactiveSources: 2,
                totalContent: 1500,
                recentContent: 50,
            };
            sourceRepository.getStats.mockResolvedValue(mockStats);
            const response = await request(app)
                .get('/api/sources/stats')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalSources).toBe(10);
            expect(response.body.data.activeSources).toBe(8);
        });
    });
    describe('错误处理', () => {
        it('应该处理数据库错误', async () => {
            sourceRepository.findMany.mockRejectedValue(new Error('Database error'));
            const response = await request(app)
                .get('/api/sources')
                .expect(500);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
        });
        it('应该处理无效的JWT令牌', async () => {
            const response = await request(app)
                .post('/api/sources')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                name: 'Test Source',
                type: 'RSS',
                url: 'https://example.com/rss',
            })
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INVALID_TOKEN');
        });
    });
    describe('输入验证', () => {
        it('应该清理恶意输入', async () => {
            const maliciousData = {
                name: '<script>alert("xss")</script>',
                type: 'RSS',
                url: 'https://example.com/rss',
                description: '<img src="x" onerror="alert(1)">',
            };
            sourceRepository.create.mockResolvedValue({
                id: 'source-new',
                ...maliciousData,
                status: 'ACTIVE',
            });
            const response = await request(app)
                .post('/api/sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send(maliciousData)
                .expect(201);
            // 验证恶意脚本被清理
            expect(response.body.data.name).not.toContain('<script>');
            expect(response.body.data.description).not.toContain('<img');
        });
        it('应该限制字段长度', async () => {
            const longData = {
                name: 'A'.repeat(300), // 超过255字符限制
                type: 'RSS',
                url: 'https://example.com/rss',
            };
            const response = await request(app)
                .post('/api/sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send(longData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });
    });
});
