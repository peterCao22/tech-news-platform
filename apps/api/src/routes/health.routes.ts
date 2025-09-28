// 科技新闻聚合平台 - 健康检查路由
// 提供API服务健康状态检查

import { Router, Request, Response } from 'express';
// 暂时注释数据库和邮件服务依赖
// import { checkDatabaseConnection } from '@tech-news-platform/database';
// import { EmailService } from '../services/email.service';
import { logger } from '../utils/logger';

const router: Router = Router();

// 基础健康检查
router.get('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 详细健康检查 - 暂时简化版本
router.get('/detailed', async (req: Request, res: Response) => {
  const healthChecks = {
    api: true,
    database: false, // 暂时禁用
    email: false,    // 暂时禁用
  };

  const overallStatus = 'healthy';

  res.json({
    success: true,
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: healthChecks,
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
    },
  });
});

// 就绪检查（用于Kubernetes等容器编排）- 暂时简化版本
router.get('/ready', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '服务已就绪',
    timestamp: new Date().toISOString(),
  });
});

// 存活检查（用于Kubernetes等容器编排）
router.get('/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '服务存活',
    timestamp: new Date().toISOString(),
  });
});

export default router;
