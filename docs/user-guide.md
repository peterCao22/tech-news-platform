# Tech News Platform 使用指南

## 目录

1. [快速开始](#快速开始)
2. [系统架构](#系统架构)
3. [开发环境设置](#开发环境设置)
4. [API使用指南](#api使用指南)
5. [数据库操作](#数据库操作)
6. [测试指南](#测试指南)
7. [部署指南](#部署指南)
8. [故障排除](#故障排除)

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Docker (可选)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd tech-news-platform
```

2. **安装依赖**
```bash
pnpm install
```

3. **环境配置**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等
```

4. **数据库设置**
```bash
# 生成Prisma客户端
cd packages/database
pnpm prisma generate

# 运行数据库迁移
pnpm prisma db push

# 可选：填充种子数据
pnpm prisma db seed
```

5. **启动开发服务器**
```bash
# 返回项目根目录
cd ../..

# 启动API服务器
pnpm dev:api

# 启动Web应用（在新终端）
pnpm dev:web
```

6. **访问应用**
- API服务器: http://localhost:3001
- Web应用: http://localhost:3000

## 系统架构

### 项目结构

```
tech-news-platform/
├── apps/
│   ├── api/                 # Express.js API服务器
│   ├── web/                 # Next.js Web应用
│   └── functions/           # 云函数
├── packages/
│   ├── database/            # Prisma数据库包
│   ├── ui/                  # 共享UI组件
│   ├── config/              # 共享配置
│   └── shared/              # 共享工具
├── docs/                    # 文档
├── infrastructure/          # 基础设施配置
└── scripts/                 # 构建和部署脚本
```

### 技术栈

**后端:**
- Express.js - Web框架
- Prisma - ORM和数据库工具
- PostgreSQL - 主数据库
- Redis - 缓存和会话存储
- JWT - 身份认证

**前端:**
- Next.js - React框架
- TypeScript - 类型安全
- Tailwind CSS - 样式框架
- Zustand - 状态管理

**开发工具:**
- pnpm - 包管理器
- Turbo - 单体仓库构建工具
- Jest - 测试框架
- ESLint - 代码检查

## 开发环境设置

### 1. 数据库配置

**本地PostgreSQL:**
```bash
# 创建数据库
createdb technews

# 配置环境变量
DATABASE_URL="postgresql://username:password@localhost:5432/technews"
```

**Docker PostgreSQL:**
```bash
# 启动PostgreSQL容器
docker-compose up -d postgres

# 数据库URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/technews"
```

### 2. 环境变量配置

创建 `.env` 文件：
```env
# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/technews"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_URL="redis://localhost:6379"

# API配置
API_PORT=3001
API_HOST="localhost"

# Web配置
NEXT_PUBLIC_API_URL="http://localhost:3001/api"

# 外部API
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"

# 邮件服务
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. 开发工具配置

**VS Code 推荐扩展:**
- Prisma
- TypeScript Importer
- ESLint
- Prettier
- Thunder Client (API测试)

**VS Code 设置 (.vscode/settings.json):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "prisma.showPrismaDataPlatformNotification": false
}
```

## API使用指南

### 认证流程

1. **用户注册**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "用户名"
  }'
```

2. **用户登录**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

3. **使用Token**
```bash
# 在后续请求中包含token
curl -X GET http://localhost:3001/api/content-items \
  -H "Authorization: Bearer your-jwt-token"
```

### 内容管理工作流

1. **创建内容**
```javascript
const content = await fetch('/api/content-items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: '新闻标题',
    description: '新闻描述',
    content: '新闻正文',
    sourceId: 'source-id',
    type: 'NEWS',
    category: 'AI'
  })
});
```

2. **添加标签**
```javascript
await fetch(`/api/content-items/${contentId}/tags`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    tagNames: ['人工智能', '技术趋势']
  })
});
```

3. **更新状态**
```javascript
await fetch(`/api/content-items/${contentId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'PUBLISHED'
  })
});
```

## 数据库操作

### Prisma 常用命令

```bash
# 进入数据库包目录
cd packages/database

# 生成客户端
pnpm prisma generate

# 查看数据库状态
pnpm prisma db pull

# 推送schema变更
pnpm prisma db push

# 创建迁移
pnpm prisma migrate dev --name "add-new-field"

# 重置数据库
pnpm prisma migrate reset

# 打开数据库管理界面
pnpm prisma studio

# 运行种子数据
pnpm prisma db seed
```

### 数据库查询示例

```typescript
import { prisma } from '@tech-news-platform/database';

// 查询内容
const contents = await prisma.content.findMany({
  where: {
    status: 'PUBLISHED',
    category: 'AI'
  },
  include: {
    source: true,
    contentTags: {
      include: {
        tag: true
      }
    }
  },
  orderBy: {
    publishedAt: 'desc'
  },
  take: 10
});

// 创建内容
const newContent = await prisma.content.create({
  data: {
    title: '新内容',
    description: '描述',
    sourceId: 'source-id',
    type: 'NEWS',
    status: 'RAW'
  }
});

// 更新内容
const updatedContent = await prisma.content.update({
  where: { id: 'content-id' },
  data: {
    status: 'PUBLISHED',
    publishedAt: new Date()
  }
});
```

## 测试指南

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行API测试
cd apps/api
pnpm test

# 运行特定测试文件
pnpm jest src/__tests__/services/content-item.service.test.ts

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 监视模式运行测试
pnpm test:watch
```

### 测试类型

1. **单元测试** - 测试单个函数或类
2. **集成测试** - 测试组件间的交互
3. **API测试** - 测试HTTP端点
4. **数据库测试** - 测试数据库操作

### 编写测试

```typescript
// 单元测试示例
describe('ContentService', () => {
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService();
  });

  it('should create content', async () => {
    const data = {
      title: '测试内容',
      sourceId: 'source-1'
    };

    const result = await service.createContent(data, 'user-1');

    expect(result).toHaveProperty('id');
    expect(result.title).toBe(data.title);
  });
});
```

## 部署指南

### 开发环境部署

```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

### Docker部署

```bash
# 构建Docker镜像
docker build -t tech-news-platform .

# 运行容器
docker run -p 3001:3001 -p 3000:3000 tech-news-platform
```

### 使用Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境配置

1. **环境变量**
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/technews"
REDIS_URL="redis://prod-redis:6379"
JWT_SECRET="production-secret-key"
```

2. **数据库迁移**
```bash
# 在生产环境运行迁移
pnpm prisma migrate deploy
```

3. **健康检查**
```bash
# 检查API健康状态
curl http://localhost:3001/api/health
```

## 故障排除

### 常见问题

#### 1. 数据库连接失败

**问题:** `Can't reach database server`

**解决方案:**
- 检查数据库是否运行
- 验证DATABASE_URL配置
- 确认网络连接

```bash
# 测试数据库连接
pnpm prisma db pull
```

#### 2. Prisma生成失败

**问题:** `Prisma schema validation failed`

**解决方案:**
- 检查schema.prisma语法
- 确保所有关系正确定义
- 重新生成客户端

```bash
cd packages/database
pnpm prisma generate --force
```

#### 3. 端口冲突

**问题:** `Port 3001 is already in use`

**解决方案:**
- 更改端口配置
- 终止占用端口的进程

```bash
# 查找占用端口的进程
lsof -i :3001

# 终止进程
kill -9 <PID>
```

#### 4. JWT Token无效

**问题:** `Invalid token`

**解决方案:**
- 检查JWT_SECRET配置
- 确认token格式正确
- 验证token是否过期

#### 5. 测试失败

**问题:** 测试运行失败

**解决方案:**
- 检查测试数据库配置
- 确保模拟对象正确设置
- 清理测试数据

```bash
# 重置测试数据库
NODE_ENV=test pnpm prisma migrate reset
```

### 调试技巧

1. **启用调试日志**
```bash
DEBUG=* pnpm dev:api
```

2. **使用Prisma Studio**
```bash
cd packages/database
pnpm prisma studio
```

3. **API测试工具**
- 使用Postman或Thunder Client
- 检查请求头和响应
- 验证JSON格式

4. **数据库查询调试**
```typescript
// 启用查询日志
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### 性能优化

1. **数据库索引**
- 为常用查询字段添加索引
- 使用复合索引优化复杂查询

2. **缓存策略**
- 使用Redis缓存频繁查询的数据
- 实现适当的缓存失效机制

3. **查询优化**
- 使用select指定需要的字段
- 避免N+1查询问题
- 使用分页减少数据传输

## 贡献指南

### 开发流程

1. Fork项目
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request

### 代码规范

- 使用TypeScript
- 遵循ESLint规则
- 编写单元测试
- 更新文档

### 提交信息格式

```
type(scope): description

feat(api): add content duplication check
fix(web): resolve login redirect issue
docs(readme): update installation guide
```

## 更多资源

- [API文档](./api-documentation.md)
- [架构文档](./architecture.md)
- [项目需求文档](./prd.md)
- [故事文档](./stories/)

---

如有疑问，请查看项目文档或联系开发团队。
