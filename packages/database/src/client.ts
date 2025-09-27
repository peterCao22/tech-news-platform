// 科技新闻聚合平台 - 数据库客户端
// Prisma客户端的单例实例和配置

import { PrismaClient } from './generated';

// 扩展全局类型以支持开发环境的客户端缓存
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// 数据库客户端配置
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty',
  });
};

// 单例模式的数据库客户端
// 在开发环境中复用客户端实例，避免热重载时创建过多连接
export const db = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db;
}

// 数据库连接健康检查
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
};

// 优雅关闭数据库连接
export const closeDatabaseConnection = async (): Promise<void> => {
  await db.$disconnect();
};

// 数据库事务辅助函数
export const withTransaction = async <T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> => {
  return await db.$transaction(fn);
};

// 导出类型
export type { 
  User, 
  Account, 
  Session, 
  VerificationToken,
  PasswordResetToken,
  Source,
  Content,
  ContentReview,
  DailyDigest,
  UserActivity,
  AITask,
  SystemConfig
} from './generated';

// 导出枚举（作为值）
export { 
  UserRole,
  UserStatus,
  SourceType,
  SourceStatus,
  ContentStatus,
  ReviewAction
} from './generated';
