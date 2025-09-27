// 科技新闻聚合平台 - 请求验证中间件
// 使用express-validator进行请求数据验证

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

// 验证请求中间件
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    logger.debug('请求验证失败:', {
      url: req.url,
      method: req.method,
      errors: errorMessages,
    });

    res.status(400).json({
      success: false,
      message: '请求数据验证失败',
      code: 'VALIDATION_ERROR',
      errors: errorMessages,
    });
    return;
  }

  next();
};
