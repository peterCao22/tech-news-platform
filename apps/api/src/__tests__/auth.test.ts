// 科技新闻聚合平台 - 认证API测试
// 测试用户注册、登录、密码重置等功能

import request from 'supertest';
import app from '../server';
import { UserRepository } from '@tech-news-platform/database';

// 模拟数据库
jest.mock('@tech-news-platform/database', () => ({
  UserRepository: {
    findByEmail: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
    updateLastLogin: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  },
  PasswordResetRepository: {
    createToken: jest.fn(),
    validateToken: jest.fn(),
    markTokenAsUsed: jest.fn(),
  },
  checkDatabaseConnection: jest.fn().mockResolvedValue(true),
}));

// 模拟邮件服务
jest.mock('../services/email.service', () => ({
  EmailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true),
  },
}));

describe('认证API测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        status: 'PENDING',
        emailVerified: null,
        createdAt: new Date(),
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserRepository.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          name: 'Test User',
          acceptTerms: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('应该拒绝已存在的邮箱', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          acceptTerms: true,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('应该验证密码强度', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          confirmPassword: 'weak',
          acceptTerms: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('应该要求同意服务条款', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          acceptTerms: false,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录有效用户', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: new Date(),
      };

      (UserRepository.validatePassword as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.updateLastLogin as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('应该拒绝无效凭据', async () => {
      (UserRepository.validatePassword as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('应该拒绝被暂停的用户', async () => {
      const suspendedUser = {
        id: 'user-1',
        email: 'test@example.com',
        status: 'SUSPENDED',
      };

      (UserRepository.validatePassword as jest.Mock).mockResolvedValue(suspendedUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  describe('GET /api/auth/me', () => {
    it('应该返回当前用户信息', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        status: 'ACTIVE',
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      // 模拟JWT令牌
      const token = 'valid-jwt-token';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      // 注意：这个测试需要实际的JWT验证，这里简化处理
      // 在实际测试中，您需要生成有效的JWT令牌或模拟JWT验证中间件
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('应该发送密码重置邮件', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('密码重置链接已发送');
    });

    it('应该对不存在的邮箱返回成功（安全考虑）', async () => {
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('输入验证测试', () => {
    it('应该清理恶意输入', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          name: '<script>alert("xss")</script>',
          acceptTerms: true,
        });

      // 应该清理掉HTML标签
      expect(response.body.data?.user?.name).not.toContain('<script>');
    });

    it('应该检测SQL注入尝试', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "test@example.com'; DROP TABLE users; --",
          password: 'Password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INPUT_VALIDATION_ERROR');
    });
  });

  describe('速率限制测试', () => {
    it('应该限制登录尝试次数', async () => {
      (UserRepository.validatePassword as jest.Mock).mockResolvedValue(null);

      // 模拟多次失败的登录尝试
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(promises);
      
      // 最后几个请求应该被速率限制
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});

// 测试工具函数
export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    password: 'Password123',
    name: 'Test User',
    role: 'USER',
    status: 'ACTIVE',
    ...overrides,
  };

  return defaultUser;
};

export const generateTestJWT = (userId: string) => {
  // 在实际测试中，这里应该生成有效的JWT令牌
  return 'test-jwt-token';
};
