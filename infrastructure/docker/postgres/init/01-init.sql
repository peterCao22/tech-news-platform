-- 科技新闻聚合平台 - PostgreSQL 初始化脚本
-- 创建数据库和基础配置

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('user', 'admin', 'editor');

-- 创建信息源类型枚举
CREATE TYPE source_type AS ENUM ('rss', 'api', 'ai_query', 'email', 'manual');
CREATE TYPE source_status AS ENUM ('active', 'inactive', 'error', 'rate_limited');

-- 创建内容状态枚举
CREATE TYPE content_status AS ENUM ('raw', 'processing', 'processed', 'reviewed', 'published', 'rejected');

-- 创建审核动作枚举
CREATE TYPE review_action AS ENUM ('approve', 'reject', 'edit', 'flag', 'priority_boost', 'priority_lower');

-- 设置时区
SET timezone = 'UTC';

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 输出初始化完成信息
\echo '✅ PostgreSQL 初始化完成 - 科技新闻聚合平台数据库已准备就绪'
