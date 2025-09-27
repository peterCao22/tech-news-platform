// 科技新闻聚合平台 - CSRF保护中间件
// 防止跨站请求伪造攻击

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// 扩展Request类型以包含CSRF令牌
declare global {
  namespace Express {
    interface Request {
      csrfToken?: string;
    }
  }
}

// CSRF令牌存储（生产环境应使用Redis）
const tokenStore = new Map<string, { token: string; expires: number }>();

// 清理过期令牌
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expires < now) {
      tokenStore.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export class CSRFProtection {
  // 生成CSRF令牌
  static generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24小时过期
    
    tokenStore.set(sessionId, { token, expires });
    return token;
  }

  // 验证CSRF令牌
  static validateToken(sessionId: string, token: string): boolean {
    const stored = tokenStore.get(sessionId);
    
    if (!stored) {
      return false;
    }

    if (stored.expires < Date.now()) {
      tokenStore.delete(sessionId);
      return false;
    }

    return stored.token === token;
  }

  // CSRF保护中间件
  static middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // 获取会话ID（这里简化使用IP+UserAgent，生产环境应使用真实会话）
      const sessionId = crypto
        .createHash('sha256')
        .update(req.ip + (req.get('User-Agent') || ''))
        .digest('hex');

      // GET请求生成令牌
      if (req.method === 'GET') {
        const token = CSRFProtection.generateToken(sessionId);
        req.csrfToken = token;
        res.setHeader('X-CSRF-Token', token);
        next();
        return;
      }

      // 需要CSRF保护的方法
      const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      
      if (!protectedMethods.includes(req.method)) {
        next();
        return;
      }

      // 检查CSRF令牌
      const token = req.get('X-CSRF-Token') || req.body._csrf;
      
      if (!token) {
        logger.warn('CSRF令牌缺失', {
          ip: req.ip,
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent'),
        });

        res.status(403).json({
          success: false,
          message: 'CSRF令牌缺失',
          code: 'CSRF_TOKEN_MISSING',
        });
        return;
      }

      if (!CSRFProtection.validateToken(sessionId, token)) {
        logger.warn('CSRF令牌无效', {
          ip: req.ip,
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent'),
          token: token.substring(0, 8) + '...',
        });

        res.status(403).json({
          success: false,
          message: 'CSRF令牌无效',
          code: 'CSRF_TOKEN_INVALID',
        });
        return;
      }

      next();
    };
  }

  // 获取CSRF令牌的路由处理器
  static getTokenHandler() {
    return (req: Request, res: Response): void => {
      const sessionId = crypto
        .createHash('sha256')
        .update(req.ip + (req.get('User-Agent') || ''))
        .digest('hex');

      const token = CSRFProtection.generateToken(sessionId);

      res.json({
        success: true,
        data: {
          csrfToken: token,
        },
      });
    };
  }
}

// 简化的CSRF中间件（用于开发环境）
export const csrfProtection = CSRFProtection.middleware();

// CSRF令牌获取路由
export const csrfTokenRoute = CSRFProtection.getTokenHandler();
