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

// 导出prisma客户端实例（别名）
export const prisma = db;

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
  SystemConfig,
  ApiConfiguration,
  ApiCallLog,
  ContentAuditLog,
  FilterRule,
  RuleVersion,
  SourceList,
  RuleAnalytics,
  ContentTemplate,
  BatchImport,
  // Story 4.1: User Preferences
  UserPreference,
  UserInterest,
  UserFollowing,
  SourceWeight,
  PreferenceTemplate,
  // Story 4.4: User Behavior Analytics
  UserBehavior,
  UserReadingHistory,
  UserEngagement,
  ImplicitPreference,
  // Story 4.3: Content History & Trends
  KeywordTrend,
  CategoryTrend,
  // Story 4.5: Smart Notifications
  NotificationPreference,
  NotificationLog,
  StockPriceHistory,
  Prisma
} from './generated';

// 导出枚举（作为值）
export { 
  UserRole,
  UserStatus,
  SourceType,
  SourceStatus,
  ContentStatus,
  ReviewAction,
  ApiConfigStatus,
  ApiAuthType,
  ContentReviewStatus,
  RuleType,
  RuleStatus,
  ListType,
  // Story 4.1: User Preferences
  FollowType,
  // Story 4.4: User Behavior Analytics
  BehaviorEventType,
  // Story 4.5: Smart Notifications
  NotificationFrequency,
  NotificationType,
  NotificationChannel,
  NotificationStatus
} from './generated';
