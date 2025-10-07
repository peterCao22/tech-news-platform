# 科技新闻聚合平台

> AI驱动的科技新闻聚合与智能筛选平台

[![CI](https://github.com/your-org/tech-news-platform/workflows/CI/badge.svg)](https://github.com/your-org/tech-news-platform/actions)
[![Deploy](https://github.com/your-org/tech-news-platform/workflows/Deploy/badge.svg)](https://github.com/your-org/tech-news-platform/actions)
[![codecov](https://codecov.io/gh/your-org/tech-news-platform/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/tech-news-platform)

## 📖 项目简介

科技新闻聚合平台是一个基于AI的智能新闻筛选系统，旨在从全球科技、AI人工智能、新技术以及股票相关信息中筛选出最有价值的内容，为用户提供每日TOP10精选新闻。

### 📚 文档导航

- 📖 **[API文档](docs/api-documentation.md)** - 完整的REST API接口文档
- 📋 **[使用指南](docs/user-guide.md)** - 详细的安装、配置和使用说明
- 🏗️ **[架构文档](docs/architecture.md)** - 系统架构设计和技术选型
- 📝 **[产品需求](docs/prd.md)** - 产品规格和功能需求
- 📖 **[开发故事](docs/stories/)** - 详细的开发进度和实现记录

### 🎯 核心功能

- **多源信息聚合**: 支持RSS、API、AI工具、邮件等多种信息源
- **AI智能筛选**: 集成OpenAI、Claude、Perplexity等AI工具进行内容分析
- **混合式管理**: 结合自动化处理和人工审核的工作流
- **个性化推荐**: 基于用户偏好的智能内容推荐
- **实时更新**: 30分钟内的新闻更新延迟
- **多格式导出**: 支持PDF、邮件、RSS等格式导出

## 🏗️ 技术架构

### 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   AI Services   │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (OpenAI/etc)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   AWS ECS       │    │   Lambda        │
│   (Hosting)     │    │   (Containers)  │    │   (Functions)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   + Redis       │
                    └─────────────────┘
```

### 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端 | Next.js | 14.x | React框架 |
| 前端 | TypeScript | 5.2+ | 类型安全 |
| 前端 | Tailwind CSS | 3.x | 样式框架 |
| 后端 | Node.js | 18.x | 运行时 |
| 后端 | Express.js | 4.x | Web框架 |
| 数据库 | PostgreSQL | 15.x | 主数据库 |
| 缓存 | Redis | 7.x | 缓存和会话 |
| 部署 | Vercel | - | 前端托管 |
| 部署 | AWS | - | 后端服务 |

## 🚀 快速开始

### 系统要求

- Node.js 18.0+
- pnpm 8.0+
- Docker (可选，用于本地数据库)
- Git

### 一键设置

```bash
# 克隆项目
git clone https://github.com/your-org/tech-news-platform.git
cd tech-news-platform

# 运行设置脚本
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

### 手动设置

```bash
# 1. 安装依赖
pnpm install

# 2. 设置环境变量
cp env.example .env
# 编辑 .env 文件，填入必要的API密钥

# 3. 启动数据库（使用Docker）
docker-compose up -d postgres redis

# 4. 启动开发服务器
pnpm dev
```

### 访问应用

- 前端应用: http://localhost:3000
- API服务: http://localhost:3001
- pgAdmin: http://localhost:8080 (可选)
- Redis Commander: http://localhost:8081 (可选)

## 📁 项目结构

```
tech-news-platform/
├── apps/
│   ├── web/                 # Next.js 前端应用
│   ├── api/                 # Express.js API 服务
│   └── functions/           # Serverless 函数
├── packages/
│   ├── shared/              # 共享类型和工具
│   ├── ui/                  # UI 组件库
│   ├── database/            # 数据库模型和迁移
│   └── config/              # 共享配置
├── infrastructure/
│   ├── aws/                 # AWS CDK 配置
│   └── docker/              # Docker 配置
├── scripts/                 # 构建和部署脚本
├── tests/                   # 测试文件
│   ├── e2e/                 # 端到端测试
│   ├── integration/         # 集成测试
│   └── load/                # 负载测试
├── docs/                    # 项目文档
└── .github/                 # GitHub Actions 工作流
```

## 🛠️ 开发指南

### 常用命令

```bash
# 开发
pnpm dev                     # 启动开发服务器
pnpm build                   # 构建所有应用
pnpm test                    # 运行测试
pnpm lint                    # 代码检查
pnpm format                  # 代码格式化

# 数据库
pnpm db:migrate              # 运行数据库迁移
pnpm db:seed                 # 填充测试数据

# 部署
pnpm deploy:staging          # 部署到测试环境
pnpm deploy:production       # 部署到生产环境
```

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 提交前自动运行代码检查和格式化
- 使用常规提交格式 (Conventional Commits)

### 测试策略

- 单元测试: Jest + Vitest
- 集成测试: Supertest
- 端到端测试: Playwright
- 测试覆盖率目标: 80%+

## 🔧 配置说明

### 环境变量

主要环境变量说明：

```bash
# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/technews
REDIS_URL=redis://localhost:6379

# AI 服务
OPENAI_API_KEY=sk-your-key
CLAUDE_API_KEY=your-key
PERPLEXITY_API_KEY=your-key

# 金融数据
ALPHA_VANTAGE_API_KEY=your-key
POLYGON_API_KEY=your-key
FINNHUB_API_KEY=your-key
```

完整配置请参考 `env.example` 文件。

### 信息源配置

支持的信息源类型：

- **RSS源**: Techmeme, TechCrunch, MIT Tech Review
- **AI工具**: Perplexity AI, ChatGPT, Claude
- **金融API**: Alpha Vantage, Polygon.io, Finnhub
- **自动化**: Zapier 工作流
- **手工录入**: 支持人工添加和编辑

## 📊 监控和日志

### 应用监控

- **前端**: Vercel Analytics
- **后端**: AWS CloudWatch
- **错误追踪**: Sentry
- **性能监控**: 自定义指标

### 日志系统

- 结构化日志 (Winston)
- 日志级别: error, warn, info, debug
- 日志轮转和归档
- 敏感信息脱敏

## 🚀 部署指南

### 环境说明

- **开发环境**: 本地开发，使用 Docker 数据库
- **测试环境**: AWS 测试集群，自动部署
- **生产环境**: AWS 生产集群，手动审批部署

### 部署流程

1. **代码提交**: 推送到 develop/main 分支
2. **自动构建**: GitHub Actions 运行 CI/CD
3. **自动测试**: 运行完整测试套件
4. **自动部署**: 部署到对应环境
5. **健康检查**: 验证部署成功

### 回滚策略

- 前端: Vercel 一键回滚
- 后端: ECS 服务回滚
- 数据库: 备份恢复机制

## 🤝 贡献指南

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 提交规范

使用 [Conventional Commits](https://conventionalcommits.org/) 格式：

```
type(scope): description

feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建过程或辅助工具的变动
```

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 🆘 支持

- 📧 邮件: tech-support@example.com
- 💬 Slack: #tech-news-platform
- 📖 文档: [项目文档](docs/)
- 🐛 问题反馈: [GitHub Issues](https://github.com/your-org/tech-news-platform/issues)

---

**科技新闻聚合平台** - 让信息获取更智能 🚀
