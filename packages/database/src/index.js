// 科技新闻聚合平台 - 数据库包主入口
// 导出所有数据库相关的类型、客户端和仓库
// 客户端和类型
export * from './client';
export * from './generated';
// 仓库
export * from './repositories/user.repository';
export * from './repositories/password-reset.repository';
export * from './repositories/source.repository';
export * from './repositories/content.repository';
export * from './repositories/api-configuration.repository';
export { ContentItemRepository } from './repositories/content-item.repository';
export * from './repositories/tag.repository';
export * from './repositories/content-tag.repository';
export * from './repositories/base.repository';
// 类型定义
export * from './types/user.types';
// 工具函数
export { checkDatabaseConnection, closeDatabaseConnection, withTransaction } from './client';
