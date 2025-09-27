// 科技新闻聚合平台 - 404处理中间件
// 处理未找到的路由

import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('404 - 路由未找到:', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    code: 'ROUTE_NOT_FOUND',
    path: req.url,
    method: req.method,
  });
};
