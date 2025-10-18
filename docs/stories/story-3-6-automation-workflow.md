# Story 3.6: 自动化工作流集成

## Story Overview

**As a** 工作流管理员  
**I want** 集成外部自动化工具提升工作效率  
**So that** 减少重复性工作并加速内容处理流程

## Acceptance Criteria

1. ✅ 集成Zapier自动化流程，支持RSS到内容管理的自动化
2. ✅ 实现邮件解析功能，自动处理订阅的新闻简报
3. ~~支持Slack/Teams集成，实现内容审核的即时通知~~ (暂不实现)
4. ✅ 建立自动化任务监控，跟踪各种自动化流程的状态
5. ~~提供自定义工作流配置，支持不同团队的工作习惯~~ (暂不实现)
6. ✅ 实现工作流的错误处理和异常恢复机制

**注**: 本次只实现 AC1, AC2, AC4, AC6 四个验收标准

## Technical Design

### Architecture

```
自动化工作流系统
├── Zapier Integration (Webhook接收)
│   ├── POST /api/automation/zapier/webhook - 接收Zapier推送
│   ├── GET /api/automation/zapier/triggers - 获取触发器列表
│   └── POST /api/automation/zapier/test - 测试连接
│
├── Email Parser (邮件解析)
│   ├── IMAP客户端 - 连接邮箱服务器
│   ├── 邮件解析器 - 提取新闻内容
│   └── POST /api/automation/email/process - 手动触发处理
│
├── Automation Monitor (任务监控)
│   ├── GET /api/automation/tasks - 获取任务列表
│   ├── GET /api/automation/tasks/:id - 获取任务详情
│   ├── GET /api/automation/stats - 获取统计信息
│   └── POST /api/automation/tasks/:id/retry - 重试失败任务
│
└── Error Handler (错误处理)
    ├── 自动重试机制
    ├── 降级策略
    └── 告警通知
```

### Data Models

#### AutomationTask (自动化任务)
```prisma
model AutomationTask {
  id            String   @id @default(cuid())
  taskType      String   // 'zapier_webhook', 'email_parse', 'rss_sync'
  status        TaskStatus
  source        String?  // 来源标识
  payload       Json?    // 原始数据
  result        Json?    // 处理结果
  error         String?  // 错误信息
  retryCount    Int      @default(0)
  maxRetries    Int      @default(3)
  nextRetryAt   DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([taskType, status])
  @@index([status, nextRetryAt])
  @@map("automation_tasks")
}

enum TaskStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  RETRYING
}
```

#### EmailAccount (邮件账户配置)
```prisma
model EmailAccount {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  provider    String   // 'gmail', 'outlook', 'imap'
  imapHost    String
  imapPort    Int
  username    String
  password    String   // 加密存储
  folder      String   @default("INBOX")
  isActive    Boolean  @default(true)
  lastSyncAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("email_accounts")
}
```

#### ZapierWebhook (Zapier Webhook配置)
```prisma
model ZapierWebhook {
  id          String   @id @default(cuid())
  name        String
  webhookUrl  String   @unique
  secret      String   // 验证签名
  triggerType String   // 'rss_item', 'email_forward', 'custom'
  isActive    Boolean  @default(true)
  totalCalls  Int      @default(0)
  lastCallAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("zapier_webhooks")
}
```

### API Endpoints

#### 1. POST /api/automation/zapier/webhook
接收Zapier推送的数据

**Request Headers:**
```json
{
  "X-Zapier-Signature": "signature_string",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "webhook_id": "string",
  "trigger_type": "rss_item | email_forward",
  "data": {
    "title": "string",
    "description": "string",
    "content": "string",
    "url": "string",
    "author": "string",
    "publishedAt": "datetime",
    "source": {
      "name": "string",
      "url": "string"
    },
    "tags": ["string"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "string",
  "message": "Webhook received and queued for processing"
}
```

#### 2. GET /api/automation/zapier/triggers
获取可用的触发器类型

**Response:**
```json
{
  "success": true,
  "triggers": [
    {
      "type": "rss_item",
      "name": "RSS Item Received",
      "description": "Trigger when new RSS item is detected",
      "fields": ["title", "description", "url", "publishedAt"]
    },
    {
      "type": "email_forward",
      "name": "Email Forwarded",
      "description": "Trigger when email is forwarded to webhook",
      "fields": ["subject", "from", "body", "html"]
    }
  ]
}
```

#### 3. POST /api/automation/email/accounts
创建邮件账户配置

**Request:**
```json
{
  "name": "Ben's Bites Newsletter",
  "email": "newsletters@example.com",
  "provider": "gmail",
  "imapHost": "imap.gmail.com",
  "imapPort": 993,
  "username": "user@gmail.com",
  "password": "app_specific_password",
  "folder": "INBOX/Newsletters"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "Ben's Bites Newsletter",
    "email": "newsletters@example.com",
    "isActive": true
  }
}
```

#### 4. POST /api/automation/email/process
手动触发邮件处理

**Request:**
```json
{
  "accountId": "string",
  "since": "datetime (optional)",
  "limit": 50
}
```

**Response:**
```json
{
  "success": true,
  "processed": 12,
  "created": 8,
  "skipped": 4,
  "tasks": ["task_id_1", "task_id_2"]
}
```

#### 5. GET /api/automation/tasks
获取自动化任务列表

**Query Parameters:**
- `taskType` - 任务类型筛选
- `status` - 状态筛选
- `page` - 页码
- `limit` - 每页数量
- `sortBy` - 排序字段

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "taskType": "zapier_webhook",
        "status": "COMPLETED",
        "source": "Techmeme RSS",
        "startedAt": "datetime",
        "completedAt": "datetime",
        "result": {
          "contentId": "string",
          "action": "created"
        }
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

#### 6. GET /api/automation/tasks/:id
获取任务详情

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "taskType": "email_parse",
    "status": "FAILED",
    "source": "Ben's Bites",
    "payload": { /* 原始邮件数据 */ },
    "error": "Failed to parse email content",
    "retryCount": 2,
    "maxRetries": 3,
    "nextRetryAt": "datetime",
    "createdAt": "datetime",
    "startedAt": "datetime",
    "logs": [
      {
        "timestamp": "datetime",
        "level": "error",
        "message": "Connection timeout to IMAP server"
      }
    ]
  }
}
```

#### 7. GET /api/automation/stats
获取自动化统计信息

**Query Parameters:**
- `period` - 统计周期 (day|week|month)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "summary": {
      "totalTasks": 342,
      "completed": 315,
      "failed": 12,
      "pending": 15,
      "successRate": 92.1
    },
    "byType": {
      "zapier_webhook": {
        "total": 156,
        "completed": 152,
        "failed": 4
      },
      "email_parse": {
        "total": 89,
        "completed": 82,
        "failed": 7
      },
      "rss_sync": {
        "total": 97,
        "completed": 81,
        "failed": 1
      }
    },
    "timeline": [
      {
        "date": "2025-10-16",
        "total": 45,
        "completed": 42,
        "failed": 3
      }
    ]
  }
}
```

#### 8. POST /api/automation/tasks/:id/retry
手动重试失败任务

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "RETRYING",
    "retryCount": 3,
    "message": "Task queued for retry"
  }
}
```

### Frontend UI Design

#### 1. 自动化工作流配置页面
**路径**: `/automation/config`

**布局**:
```
┌─────────────────────────────────────────────────────┐
│  自动化工作流配置                      [+ 新增配置]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tab: Zapier集成 | 邮件账户 | 监控设置               │
│                                                     │
│  【Zapier Webhook列表】                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📡 Techmeme RSS Webhook            🟢 激活   │   │
│  │ Webhook URL: https://...                   │   │
│  │ 触发类型: rss_item                          │   │
│  │ 总调用: 156次  最后调用: 2分钟前             │   │
│  │ [测试] [编辑] [禁用]                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  【邮件账户列表】                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📧 Ben's Bites Newsletter      🟢 激活      │   │
│  │ Email: newsletters@example.com             │   │
│  │ 最后同步: 5分钟前  新邮件: 3封              │   │
│  │ [立即同步] [测试连接] [编辑] [禁用]          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 2. 任务监控仪表板
**路径**: `/automation/monitor`

**布局**:
```
┌─────────────────────────────────────────────────────┐
│  自动化任务监控                    🔄 自动刷新 (30s)  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  【统计面板】                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ 总任务  │ │ 已完成  │ │ 失败   │ │ 待处理  │      │
│  │  342   │ │  315   │ │   12  │ │   15   │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                     │
│  成功率: ██████████░ 92.1%                          │
│                                                     │
│  【任务列表】                                        │
│  筛选: [全部▼] [Zapier▼] [今天▼]       搜索: [___] │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ✅ Zapier Webhook - Techmeme RSS            │   │
│  │ 创建内容: "OpenAI发布GPT-5"                  │   │
│  │ 完成时间: 2025-10-16 14:30:25               │   │
│  │ 耗时: 1.2s                                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ⚠️ Email Parse - Ben's Bites    [重试]       │   │
│  │ 错误: Connection timeout                    │   │
│  │ 重试次数: 2/3  下次重试: 5分钟后             │   │
│  │ [查看详情] [立即重试] [忽略]                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: 数据模型和基础服务 (Backend)
**预估时间**: 1-2天

- [ ] 1.1 创建 Prisma 数据模型
  - `AutomationTask` 模型
  - `EmailAccount` 模型
  - `ZapierWebhook` 模型
  - `TaskStatus` 枚举

- [ ] 1.2 运行数据库迁移
  ```bash
  cd packages/database
  pnpm prisma migrate dev --name add-automation-models
  pnpm prisma generate
  ```

- [ ] 1.3 创建核心服务类
  - `apps/api/src/services/automation/zapier.service.ts` - Zapier集成
  - `apps/api/src/services/automation/email-parser.service.ts` - 邮件解析
  - `apps/api/src/services/automation/task-manager.service.ts` - 任务管理
  - `apps/api/src/services/automation/error-handler.service.ts` - 错误处理

### Phase 2: Zapier集成 (Backend)
**预估时间**: 2-3天

- [ ] 2.1 实现 Zapier Webhook 接收
  - Webhook签名验证
  - 数据格式验证和转换
  - 异步任务队列处理

- [ ] 2.2 实现 Zapier 触发器
  - RSS item 触发器
  - Email forward 触发器
  - 自定义触发器支持

- [ ] 2.3 创建 Zapier 管理接口
  - CRUD操作
  - 测试连接功能
  - 统计信息收集

### Phase 3: 邮件解析功能 (Backend)
**预估时间**: 3-4天

- [ ] 3.1 实现 IMAP 客户端
  ```bash
  # 安装依赖
  cd apps/api
  pnpm add imap mailparser
  pnpm add -D @types/imap @types/mailparser
  ```

- [ ] 3.2 实现邮件解析器
  - HTML内容提取
  - 新闻内容识别
  - 元数据提取（标题、作者、发布时间）

- [ ] 3.3 实现邮件账户管理
  - 安全的密码加密存储
  - 多账户配置支持
  - 定时同步任务

- [ ] 3.4 创建邮件处理API
  - 手动触发处理
  - 批量处理支持
  - 处理结果统计

### Phase 4: 任务监控系统 (Backend)
**预估时间**: 2-3天

- [ ] 4.1 实现任务管理服务
  - 任务创建和状态更新
  - 任务查询和筛选
  - 任务统计聚合

- [ ] 4.2 实现任务监控API
  - 任务列表接口
  - 任务详情接口
  - 统计信息接口

- [ ] 4.3 实现实时状态更新
  - WebSocket连接（可选）
  - 定时轮询支持
  - 状态变更通知

### Phase 5: 错误处理和重试机制 (Backend)
**预估时间**: 2天

- [ ] 5.1 实现自动重试机制
  - 指数退避策略
  - 最大重试次数限制
  - 重试任务队列

- [ ] 5.2 实现降级策略
  - 服务不可用时的fallback
  - 部分失败处理
  - 数据保护机制

- [ ] 5.3 实现告警通知
  - 错误日志记录
  - 关键错误告警
  - 告警聚合和去重

### Phase 6: 前端管理界面 (Frontend)
**预估时间**: 3-4天

- [ ] 6.1 创建 Zustand Store
  - `automationStore.ts` - 自动化配置状态
  - `taskMonitorStore.ts` - 任务监控状态

- [ ] 6.2 创建 API 服务层
  - `automationService.ts` - API调用封装

- [ ] 6.3 实现自动化配置页面
  - Zapier Webhook配置组件
  - 邮件账户配置组件
  - 配置表单和验证

- [ ] 6.4 实现任务监控仪表板
  - 统计面板组件
  - 任务列表组件
  - 任务详情弹窗
  - 实时刷新功能

- [ ] 6.5 实现错误处理和重试UI
  - 错误提示显示
  - 手动重试按钮
  - 批量重试功能

### Phase 7: 集成测试和文档 (Testing & Docs)
**预估时间**: 2天

- [ ] 7.1 编写集成测试
  - Zapier webhook测试
  - 邮件解析测试
  - 任务管理测试
  - 错误处理测试

- [ ] 7.2 编写使用文档
  - Zapier集成配置指南
  - 邮件账户设置指南
  - 常见问题和故障排除

- [ ] 7.3 创建测试脚本
  - `test-story-3-6-automation.js` - 后端API测试

## Testing Plan

### Unit Tests
1. Zapier Service单元测试
   - Webhook签名验证
   - 数据格式转换
   - 错误处理

2. Email Parser单元测试
   - HTML内容提取
   - 元数据解析
   - 格式识别

3. Task Manager单元测试
   - 任务状态管理
   - 重试逻辑
   - 统计计算

### Integration Tests
1. Zapier Webhook端到端测试
   - 发送测试webhook
   - 验证内容创建
   - 验证任务记录

2. 邮件处理端到端测试
   - 连接测试邮箱
   - 解析测试邮件
   - 创建内容验证

3. 任务监控测试
   - 任务列表获取
   - 任务统计计算
   - 手动重试功能

### Performance Metrics
- Webhook响应时间 < 2秒
- 邮件处理速度 > 10封/分钟
- 任务查询响应 < 500ms
- 重试成功率 > 80%

## Security Considerations

1. **Webhook安全**
   - 签名验证
   - IP白名单（可选）
   - 速率限制

2. **邮件账户安全**
   - 密码加密存储（AES-256）
   - App专用密码使用
   - 连接加密（TLS/SSL）

3. **API安全**
   - JWT认证
   - ADMIN角色权限
   - 输入验证和清理

4. **数据保护**
   - 敏感数据脱敏
   - 日志安全存储
   - 定期清理旧任务

## Dependencies

### Backend Dependencies
```json
{
  "imap": "^0.8.19",
  "mailparser": "^3.6.5",
  "node-cron": "^3.0.3",
  "@types/imap": "^0.8.38",
  "@types/mailparser": "^3.4.4"
}
```

### Frontend Dependencies
```json
{
  "recharts": "^2.10.0",
  "date-fns": "^2.30.0"
}
```

### External Services
- Zapier (webhook集成)
- Gmail/Outlook IMAP (邮件同步)

## Deployment Instructions

### 1. 数据库迁移
```bash
cd packages/database
pnpm prisma migrate deploy
pnpm prisma generate
```

### 2. 环境变量配置
```env
# Zapier配置
ZAPIER_WEBHOOK_SECRET=your_webhook_secret

# 邮件加密密钥
EMAIL_ENCRYPTION_KEY=your_32_character_encryption_key

# 任务配置
TASK_RETRY_MAX_ATTEMPTS=3
TASK_RETRY_DELAY_MS=300000  # 5分钟
```

### 3. 启动服务
```bash
# 后端
cd apps/api
pnpm dev

# 前端
cd apps/web
pnpm dev
```

### 4. 配置Zapier
1. 登录Zapier账户
2. 创建新Zap
3. 选择触发器（RSS、Email等）
4. 添加Webhook操作
5. 配置Webhook URL: `https://your-domain.com/api/automation/zapier/webhook`
6. 添加签名头: `X-Zapier-Signature`

## Acceptance Testing Checklist

- [ ] Zapier webhook能够正常接收数据
- [ ] 邮件账户能够成功连接和同步
- [ ] 任务监控页面能够显示实时状态
- [ ] 失败任务能够自动重试
- [ ] 手动重试功能正常工作
- [ ] 错误信息能够清晰显示
- [ ] 统计数据准确无误
- [ ] 权限控制正常（仅ADMIN可访问）
- [ ] 所有API接口测试通过
- [ ] 文档完整且易于理解

## Success Metrics

- ✅ 自动化任务成功率 > 95%
- ✅ Webhook响应时间 < 2秒
- ✅ 邮件处理速度 > 10封/分钟
- ✅ 重试成功率 > 80%
- ✅ 减少50%的手工内容录入工作

---

## Development Agent Record

**开发代理状态**: 🔄 **已搁置 (On Hold)**

**搁置原因**: 缺少对外可访问的域名服务，暂不具备Zapier Webhook集成条件

**搁置日期**: 2025-10-16

**重新评估条件**:
1. 获得生产环境域名
2. 或使用ngrok进行开发测试
3. 或优先实现邮件解析功能（不需要公网域名）

**预估工作量**: 15-20天（如使用邮件解析方案可减至10-12天）

**优先级**: Medium → Low (已降级)

**技术栈**:
- 后端: Node.js + TypeScript + Express + Prisma
- 邮件: imap + mailparser
- 前端: React + Next.js + Zustand
- 可视化: recharts

**风险评估**:
1. **中等风险**: 邮件解析复杂度取决于不同新闻简报的格式
2. **低风险**: Zapier集成相对标准化
3. **中等风险**: 错误处理和重试逻辑需要仔细设计

**依赖关系**:
- 依赖Story 3.1, 3.2, 3.3的完成（内容管理基础）
- 需要Zapier账户和测试邮箱

---

**创建时间**: 2025-10-16  
**创建者**: Development Agent  
**Story来源**: [PRD - Epic 3](../prd.md#story-36-自动化工作流集成)

