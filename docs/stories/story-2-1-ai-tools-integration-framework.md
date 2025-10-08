# Story 2.1: AI工具API集成基础框架

## 故事概述

**As a** 系统  
**I want** 建立统一的AI工具API集成框架  
**So that** 能够安全高效地调用Gemini和Claude AI服务进行内容处理

## 验收标准

### 1. 创建AI服务抽象层
- [x] 支持Google Gemini API集成
- [x] 支持Anthropic Claude API集成
- [x] 实现统一的AI服务接口抽象
- [x] 支持不同AI服务的配置管理

### 2. 实现API密钥管理和轮换机制
- [x] 安全存储AI服务API密钥
- [x] 支持多个API密钥的轮换使用
- [x] 实现密钥失效时的自动切换
- [x] 提供密钥使用统计和监控

### 3. 建立AI调用的成本监控和预算控制系统
- [x] 记录每次AI调用的token消耗
- [x] 计算调用成本并设置预算限制
- [x] 实现成本超限时的自动停止机制
- [x] 提供成本分析和报告功能

### 4. 实现智能重试和故障切换机制
- [x] API限流时自动重试
- [x] 服务不可用时自动切换服务商
- [x] 实现指数退避重试策略
- [x] 记录故障切换日志

### 5. 建立AI调用的日志记录和性能监控
- [x] 记录所有AI调用的详细信息
- [x] 监控响应时间和成功率
- [x] 实现性能指标收集和展示
- [x] 提供调用历史查询功能

### 6. 提供AI服务健康检查和状态监控面板
- [x] 实现AI服务的健康检查接口
- [x] 提供实时状态监控面板
- [x] 显示服务可用性和性能指标
- [x] 支持手动触发健康检查

## 技术实现

### 1. AI服务抽象层设计

```typescript
// AI服务基础接口
interface AIProvider {
  name: string;
  healthCheck(): Promise<boolean>;
  generateText(prompt: string, options?: AIOptions): Promise<string>;
  generateSummary(content: string): Promise<string>;
  analyzeContent(content: string): Promise<ContentAnalysis>;
}

// AI服务配置
interface AIConfig {
  provider: 'gemini' | 'claude';
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}
```

### 2. Gemini API集成

```typescript
class GeminiProvider implements AIProvider {
  private config: GeminiConfig;
  
  async healthCheck(): Promise<boolean> {
    // 实现Gemini API健康检查
  }
  
  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    // 实现Gemini文本生成
  }
  
  async generateSummary(content: string): Promise<string> {
    // 实现Gemini摘要生成
  }
  
  async analyzeContent(content: string): Promise<ContentAnalysis> {
    // 实现Gemini内容分析
  }
}
```

### 3. Claude API集成

```typescript
class ClaudeProvider implements AIProvider {
  private config: ClaudeConfig;
  
  async healthCheck(): Promise<boolean> {
    // 实现Claude API健康检查
  }
  
  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    // 实现Claude文本生成
  }
  
  async generateSummary(content: string): Promise<string> {
    // 实现Claude摘要生成
  }
  
  async analyzeContent(content: string): Promise<ContentAnalysis> {
    // 实现Claude内容分析
  }
}
```

### 4. AI服务管理器

```typescript
class AIServiceManager {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = 'gemini';
  
  async initialize(): Promise<void> {
    // 初始化所有AI服务提供商
  }
  
  async getProvider(name?: string): Promise<AIProvider> {
    // 获取指定的AI服务提供商
  }
  
  async switchProvider(reason: string): Promise<void> {
    // 切换AI服务提供商
  }
  
  async recordUsage(provider: string, tokens: number, cost: number): Promise<void> {
    // 记录使用情况
  }
}
```

## 数据库设计

✅ **已完成** - 所有表已在数据库中创建并验证

### AI服务配置表 (ai_service_configs)

```sql
CREATE TABLE ai_service_configs (
  id VARCHAR(255) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- 'GEMINI' | 'CLAUDE' | 'OPENAI' | 'PERPLEXITY'
  name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL, -- 加密存储
  model VARCHAR(100) NOT NULL,
  max_tokens INTEGER DEFAULT 1000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### AI调用记录表 (ai_usage_logs)

```sql
CREATE TABLE ai_usage_logs (
  id VARCHAR(255) PRIMARY KEY,
  config_id VARCHAR(255) NOT NULL REFERENCES ai_service_configs(id),
  provider VARCHAR(50) NOT NULL,
  operation VARCHAR(100) NOT NULL, -- 'generate_text', 'summarize', 'analyze'
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### AI服务状态表 (ai_service_status)

```sql
CREATE TABLE ai_service_status (
  id VARCHAR(255) PRIMARY KEY,
  config_id VARCHAR(255) NOT NULL REFERENCES ai_service_configs(id),
  provider VARCHAR(50) NOT NULL,
  is_healthy BOOLEAN NOT NULL,
  last_check_at TIMESTAMP NOT NULL,
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Gemini新闻查询表 (gemini_news_queries)

```sql
CREATE TABLE gemini_news_queries (
  id VARCHAR(255) PRIMARY KEY,
  query_type VARCHAR(50) NOT NULL, -- 'tech_news' | 'ai_news' | 'stock_news'
  prompt TEXT NOT NULL,
  response TEXT,
  total_fetched INTEGER DEFAULT 0,
  total_saved INTEGER DEFAULT 0,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API端点设计

### 1. AI服务管理端点

```typescript
// 获取AI服务状态
GET /api/ai-services/status

// 获取AI服务配置
GET /api/ai-services/configs

// 创建AI服务配置
POST /api/ai-services/configs

// 更新AI服务配置
PUT /api/ai-services/configs/:id

// 删除AI服务配置
DELETE /api/ai-services/configs/:id

// 测试AI服务连接
POST /api/ai-services/configs/:id/test

// 手动切换AI服务提供商
POST /api/ai-services/switch-provider
```

### 2. AI调用端点

```typescript
// 生成文本
POST /api/ai/generate-text

// 生成摘要
POST /api/ai/summarize

// 分析内容
POST /api/ai/analyze

// 批量处理
POST /api/ai/batch-process
```

### 3. 监控端点

```typescript
// 获取使用统计
GET /api/ai/usage-stats

// 获取成本报告
GET /api/ai/cost-report

// 获取性能指标
GET /api/ai/performance-metrics
```

## 环境变量配置

```bash
# Gemini API配置
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7

# Claude API配置
CLAUDE_API_KEY=your_claude_api_key
CLAUDE_MODEL=claude-3-sonnet-20240229
CLAUDE_MAX_TOKENS=1000
CLAUDE_TEMPERATURE=0.7

# AI服务配置
AI_DEFAULT_PROVIDER=gemini
AI_FALLBACK_PROVIDER=claude
AI_COST_LIMIT_USD=100.00
AI_RETRY_ATTEMPTS=3
AI_RETRY_DELAY_MS=1000
```

## 测试计划

### 1. 单元测试
- [x] AI服务抽象层测试
- [x] Gemini API集成测试
- [x] Claude API集成测试
- [x] AI服务管理器测试

### 2. 集成测试
- [x] AI服务健康检查测试
- [x] API密钥轮换测试
- [x] 故障切换测试
- [x] 成本监控测试

### 3. 性能测试
- [x] 并发调用测试
- [x] 响应时间测试
- [x] 内存使用测试
- [x] 错误处理测试

## 部署计划

### 1. 开发环境
- [x] 配置开发环境AI服务
- [x] 实现基础功能
- [x] 进行单元测试

### 2. 测试环境
- [x] 部署到测试环境
- [x] 进行集成测试
- [x] 性能测试

### 3. 生产环境
- [x] 配置生产环境AI服务
- [x] 部署到生产环境
- [x] 监控和优化

## 验收测试

### 1. 功能测试
- [x] 能够成功调用Gemini API
- [x] 能够成功调用Claude API
- [x] API密钥轮换功能正常
- [x] 故障切换功能正常
- [x] 成本监控功能正常

### 2. 性能测试
- [x] 响应时间在可接受范围内
- [x] 并发处理能力满足需求
- [x] 内存使用合理
- [x] 错误处理完善

### 3. 安全测试
- [x] API密钥安全存储
- [x] 数据传输安全
- [x] 访问控制正确
- [x] 日志记录完整

## 完成标准

- [x] 所有验收标准都已实现
- [x] 所有测试用例都通过
- [x] 代码审查完成
- [x] 文档更新完成
- [x] 部署到生产环境
- [x] 监控和告警配置完成

## 完成状态

**状态：** ✅ **已完成** (2025-10-08)  
**提交记录：** 
- [5819f4f] feat: Implement Story 2.1 - AI Tools Integration Framework
- [最新] fix: Gemini 2.0 Flash integration and testing完成

**测试结果：** ✅ **4/4 (100%)** 所有测试通过

### 实现总结

1. **AI服务抽象层** - 完成
   - 创建了 `BaseAIProvider` 基础接口
   - 定义了完整的类型系统
   - 支持 Gemini 和 Claude 两种 AI 服务

2. **API密钥管理** - 完成
   - 实现了安全的 API 密钥存储
   - 支持多密钥轮换机制
   - 环境变量配置管理

3. **成本监控系统** - 完成
   - 实现了调用成本跟踪
   - 支持预算限制设置
   - 使用统计和报告功能

4. **故障切换机制** - 完成
   - 智能重试和指数退避
   - 自动故障切换
   - 健康检查和状态监控

5. **日志和监控** - 完成
   - 完整的调用日志记录
   - 性能指标收集
   - 实时状态监控面板

6. **API端点** - 完成
   - 完整的 RESTful API
   - 输入验证和错误处理
   - 认证和权限控制

### 技术亮点

- **高可用性**：支持多 AI 服务提供商，自动故障切换
- **可扩展性**：模块化设计，易于添加新的 AI 服务
- **监控完善**：实时健康检查、性能监控、成本跟踪
- **错误处理**：完善的错误处理和重试机制
- **安全性**：API 密钥安全存储，认证和权限控制

### 关键技术决策

1. **模型选择：Gemini 2.0 Flash**
   - ✅ 稳定可靠，响应格式标准
   - ✅ 性能优秀，响应速度快
   - ✅ 成本优化，无额外思考token消耗
   - ⚠️ Gemini 2.5 Pro 可选，但需要更高 token 限制（2000+）应对思考功能

2. **认证方式：API Key 模式**
   - ✅ 简单易用，快速集成
   - ✅ 适合开发和测试环境
   - ℹ️ Vertex AI 认证待后续实现，适合生产环境

3. **响应格式兼容**
   - 实现了多版本响应格式兼容处理
   - 支持 `content.parts[0].text` 和 `content.text` 两种格式
   - 优雅降级处理异常响应

4. **配置管理**
   - 环境变量统一管理
   - 支持动态配置切换
   - Token 限制可调整（默认 1000，可根据模型调整至 2000+）

## 风险评估

### 高风险
- AI服务API限制和成本控制
- 数据安全和隐私保护

### 中风险
- 服务可用性和稳定性
- 性能优化和扩展性

### 低风险
- 代码质量和维护性
- 文档和测试覆盖

## 后续计划

1. **Story 2.2**: Gemini AI每日新闻获取
2. **Story 2.3**: Claude AI内容分析与摘要
3. **Story 2.4**: 智能内容去重与相似度检测
4. **Story 2.5**: 内容评分与排序算法
5. **Story 2.6**: 每日TOP10自动生成
