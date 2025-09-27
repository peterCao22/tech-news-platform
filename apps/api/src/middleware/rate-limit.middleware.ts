// 科技新闻聚合平台 - 速率限制中间件
// 防止API滥用和DDoS攻击

import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// 通用速率限制配置
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP在窗口期内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // 返回速率限制信息在 `RateLimit-*` 头中
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
  handler: (req, res) => {
    logger.warn('速率限制触发', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

// 认证相关的严格速率限制
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP在窗口期内最多5次认证尝试
  message: {
    success: false,
    message: '认证尝试过于频繁，请15分钟后再试',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  handler: (req, res) => {
    logger.warn('认证速率限制触发', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      success: false,
      message: '认证尝试过于频繁，请15分钟后再试',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    });
  },
});

// 密码重置的速率限制
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 限制每个IP在1小时内最多3次密码重置请求
  message: {
    success: false,
    message: '密码重置请求过于频繁，请1小时后再试',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  },
  handler: (req, res) => {
    logger.warn('密码重置速率限制触发', {
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      success: false,
      message: '密码重置请求过于频繁，请1小时后再试',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    });
  },
});
