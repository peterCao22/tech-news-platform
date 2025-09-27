// 科技新闻聚合平台 - JWT 认证中间件
// 处理JWT令牌验证和用户认证

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '@tech-news-platform/database';
import { logger } from '../utils/logger';

// 扩展Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        status: string;
      };
    }
  }
}

// JWT载荷接口
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// JWT认证中间件
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: '访问令牌缺失',
        code: 'TOKEN_MISSING',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET 环境变量未设置');
      res.status(500).json({
        success: false,
        message: '服务器配置错误',
        code: 'SERVER_CONFIG_ERROR',
      });
      return;
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // 从数据库获取最新用户信息
    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
      res.status(401).json({
        success: false,
        message: '用户账户已被暂停',
        code: 'USER_SUSPENDED',
      });
      return;
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: '无效的访问令牌',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: '访问令牌已过期',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    logger.error('JWT认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '认证服务错误',
      code: 'AUTH_SERVICE_ERROR',
    });
  }
};

// 可选认证中间件（不强制要求认证）
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    const user = await UserRepository.findById(decoded.userId);

    if (user && user.status === 'ACTIVE') {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      };
    }
  } catch (error) {
    // 可选认证失败时不返回错误，继续处理请求
    logger.debug('可选认证失败:', error);
  }

  next();
};

// 角色权限检查中间件
export const requireRole = (requiredRole: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '需要认证',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    try {
      const hasPermission = await UserRepository.hasPermission(
        req.user.id,
        requiredRole as any
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: '权限不足',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('权限检查错误:', error);
      res.status(500).json({
        success: false,
        message: '权限检查服务错误',
        code: 'PERMISSION_SERVICE_ERROR',
      });
    }
  };
};

// 管理员权限中间件
export const requireAdmin = requireRole('ADMIN');

// 编辑者权限中间件
export const requireEditor = requireRole('EDITOR');

// 生成JWT令牌
export const generateToken = (user: {
  id: string;
  email: string;
  role: string;
}): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET 环境变量未设置');
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'tech-news-platform',
      audience: 'tech-news-platform-users',
    }
  );
};

// 生成刷新令牌
export const generateRefreshToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT刷新密钥未设置');
  }

  return jwt.sign(
    { userId },
    jwtSecret,
    {
      expiresIn: '30d',
      issuer: 'tech-news-platform',
      audience: 'tech-news-platform-refresh',
    }
  );
};

// 验证刷新令牌
export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const jwtSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret) {
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    return decoded;
  } catch (error) {
    logger.debug('刷新令牌验证失败:', error);
    return null;
  }
};
