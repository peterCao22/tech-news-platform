// 科技新闻聚合平台 API 服务器
// Express.js 服务器主入口文件

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { logger } from './utils/logger';
import { checkDatabaseConnection } from '@tech-news-platform/database';
import { schedulerService } from './services/scheduler.service';

// 路由导入
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import healthRoutes from './routes/health.routes';
import { sourceRoutes } from './routes/source.routes';
import { contentRoutes } from './routes/content.routes';
import contentItemRoutes from './routes/content-item.routes';
import { contentFilterRoutes } from './routes/content-filter.routes';
import apiConfigRoutes from './routes/api-configuration.routes';
import alphaVantageRoutes from './routes/alpha-vantage.routes';
import finnhubRoutes from './routes/finnhub.routes';
import polygonRoutes from './routes/polygon.routes';

// 加载环境变量
dotenv.config({ path: '../../.env' });

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://192.168.13.142:3000'],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.13.142:3000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
app.use(rateLimitMiddleware);

// 路由
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/content-items', contentItemRoutes);
app.use('/api/content-filter', contentFilterRoutes);
app.use('/api/api-configs', apiConfigRoutes);
app.use('/api/alpha-vantage', alphaVantageRoutes);
app.use('/api/finnhub', finnhubRoutes);
app.use('/api/polygon', polygonRoutes);

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 检查数据库连接
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      logger.error('数据库连接失败，服务器启动中止');
      process.exit(1);
    }

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 API 服务器启动成功`);
      logger.info(`📍 服务地址: http://localhost:${PORT}`);
      logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 健康检查: http://localhost:${PORT}/health`);
      
      // 启动定时任务服务
      schedulerService.startAll();
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，开始优雅关闭...');
  schedulerService.stopAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，开始优雅关闭...');
  schedulerService.stopAll();
  process.exit(0);
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason);
  logger.error('Promise:', promise);
  process.exit(1);
});

// 启动服务器
startServer();

export default app;
