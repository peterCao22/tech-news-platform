# API测试套件说明

## 概述

本测试套件为Story 1.3: RSS源配置与数据获取功能提供全面的测试覆盖，包括单元测试和集成测试。

## 测试结构

```
src/__tests__/
├── services/                 # 单元测试
│   ├── rss.service.test.ts          # RSS服务测试
│   └── content-filter.service.test.ts # 内容过滤服务测试
├── integration/              # 集成测试
│   ├── source.routes.test.ts        # RSS源管理API测试
│   └── content.routes.test.ts       # 内容管理API测试
├── setup.ts                  # 测试环境设置
└── env.setup.ts             # 环境变量设置
```

## 测试覆盖范围

### 单元测试

#### RSSService (`rss.service.test.ts`)
- ✅ RSS源解析 (`parseFeed`)
- ✅ RSS项目转换 (`convertRSSItemToContent`)
- ✅ 源内容获取和处理 (`fetchAndProcessSource`)
- ✅ RSS URL验证 (`validateRSSUrl`)
- ✅ 批量源处理 (`fetchAllActiveSources`)
- ✅ 错误处理和重试机制
- ✅ 内容去重逻辑
- ✅ 内容过滤集成

#### ContentFilterService (`content-filter.service.test.ts`)
- ✅ 内容过滤决策 (`shouldFilterContent`)
- ✅ 关键词匹配评分 (`calculateScore`)
- ✅ 批量内容过滤 (`filterContentBatch`)
- ✅ 过滤统计计算 (`getFilterStats`)
- ✅ 边界情况处理
- ✅ 配置验证

### 集成测试

#### RSS源管理API (`source.routes.test.ts`)
- ✅ GET `/api/sources` - 源列表获取
- ✅ GET `/api/sources/:id` - 源详情获取
- ✅ POST `/api/sources` - 源创建
- ✅ PUT `/api/sources/:id` - 源更新
- ✅ DELETE `/api/sources/:id` - 源删除（管理员权限）
- ✅ POST `/api/sources/validate-url` - RSS URL验证
- ✅ POST `/api/sources/:id/fetch` - 手动抓取
- ✅ POST `/api/sources/fetch-all` - 批量抓取
- ✅ GET `/api/sources/stats` - 统计信息
- ✅ 认证和授权验证
- ✅ 输入验证和清理
- ✅ 错误处理

#### 内容管理API (`content.routes.test.ts`)
- ✅ GET `/api/content` - 内容列表获取
- ✅ GET `/api/content/:id` - 内容详情获取
- ✅ GET `/api/content/recent` - 最近内容获取
- ✅ GET `/api/content/search` - 内容搜索
- ✅ PUT `/api/content/:id` - 内容更新
- ✅ DELETE `/api/content/:id` - 内容删除（管理员权限）
- ✅ POST `/api/content/batch-update-status` - 批量状态更新
- ✅ GET `/api/content/stats` - 内容统计
- ✅ 分页和排序
- ✅ 过滤和搜索参数
- ✅ 性能测试

## 运行测试

### 前置条件

1. 安装依赖：
```bash
cd apps/api
pnpm install
```

2. 确保环境变量配置正确（测试会自动设置测试环境变量）

### 测试命令

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行测试并监听文件变化
pnpm test:watch

# 只运行单元测试
pnpm test:unit

# 只运行集成测试
pnpm test:integration
```

### 测试配置

测试配置在 `jest.config.js` 中定义：

- **测试环境**: Node.js
- **测试匹配**: `**/__tests__/**/*.test.ts`
- **覆盖率收集**: `src/**/*.ts`（排除测试文件和入口文件）
- **超时设置**: 10秒
- **模块映射**: 支持 `@/` 别名

## 模拟和存根

### 数据库模拟
- `sourceRepository` - 模拟所有CRUD操作
- `contentRepository` - 模拟内容管理操作
- `userRepository` - 模拟用户查找操作

### 服务模拟
- `rss-parser` - 模拟RSS解析器
- `contentFilterService` - 模拟内容过滤服务
- `logger` - 模拟日志记录器

### 认证模拟
- JWT令牌生成和验证
- 用户角色和权限检查

## 测试数据

测试使用预定义的模拟数据：

### RSS源数据
```javascript
const mockSource = {
  id: 'source-123',
  name: 'Test Source',
  url: 'https://example.com/rss',
  type: 'RSS',
  status: 'ACTIVE',
};
```

### 内容数据
```javascript
const mockContent = {
  id: 'content-1',
  title: '人工智能技术突破',
  summary: 'AI技术在各领域取得重大进展',
  url: 'https://example.com/ai-breakthrough',
  publishedAt: new Date('2025-09-28T10:00:00Z'),
  status: 'PUBLISHED',
};
```

### 用户数据
```javascript
const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
  role: 'USER',
  status: 'ACTIVE',
};
```

## 覆盖率目标

- **总体覆盖率**: > 80%
- **函数覆盖率**: > 85%
- **分支覆盖率**: > 75%
- **行覆盖率**: > 80%

## 测试最佳实践

1. **隔离性**: 每个测试都是独立的，不依赖其他测试
2. **可重复性**: 测试结果应该是确定性的
3. **清晰性**: 测试名称清楚描述测试内容
4. **完整性**: 覆盖正常流程、边界情况和错误情况
5. **性能**: 测试应该快速执行

## 故障排除

### 常见问题

1. **模块解析错误**
   - 确保 `tsconfig.json` 配置正确
   - 检查模块路径映射

2. **异步测试超时**
   - 增加测试超时时间
   - 确保异步操作正确处理

3. **模拟不工作**
   - 检查模拟配置
   - 确保在正确的位置清理模拟

### 调试测试

```bash
# 运行特定测试文件
pnpm test rss.service.test.ts

# 运行特定测试用例
pnpm test --testNamePattern="应该成功解析有效的RSS URL"

# 详细输出
pnpm test --verbose
```

## 持续集成

测试套件设计为在CI/CD环境中运行：

- 所有测试都是无状态的
- 不依赖外部服务
- 使用模拟数据和服务
- 快速执行（< 30秒）

## 贡献指南

添加新测试时请遵循：

1. 使用描述性的测试名称
2. 遵循现有的测试结构
3. 添加适当的模拟和清理
4. 确保测试覆盖正常和异常情况
5. 更新此文档如有需要
