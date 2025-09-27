// 科技新闻聚合平台 - 日志工具
// 基于Winston的结构化日志系统

import winston from 'winston';

// 日志级别配置
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 日志颜色配置
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// 日志格式配置
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 生产环境日志格式（JSON格式，便于日志分析）
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 传输配置
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : format,
  }),
];

// 生产环境添加文件日志
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // 错误日志文件
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: productionFormat,
    }),
    // 综合日志文件
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat,
    })
  );
}

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  levels,
  format: productionFormat,
  transports,
  // 处理未捕获的异常
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  // 处理未处理的Promise拒绝
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// 开发环境不退出进程
if (process.env.NODE_ENV !== 'production') {
  logger.exitOnError = false;
}
