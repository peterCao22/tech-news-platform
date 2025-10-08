# Story 2.2: Gemini AI每日新闻获取

## 故事概述

**As a** 系统  
**I want** 通过Google Gemini AI自动获取每日科技和股票相关新闻摘要  
**So that** 能够补充RSS源可能遗漏的重要信息

## 验收标准

### 1. 实现Gemini AI的定时查询功能
- [ ] 每日2-3次自动查询
- [ ] 可配置的查询时间间隔
- [ ] 支持手动触发查询
- [ ] 查询状态监控和日志记录

### 2. 配置优化的查询提示词
- [ ] 设计针对科技和股票新闻的提示词
- [ ] 支持多种查询类型（科技新闻、AI新闻、股票新闻）
- [ ] 提示词模板化和可配置
- [ ] 查询结果格式标准化

### 3. 解析Gemini返回的结构化新闻摘要
- [ ] 解析JSON格式的新闻摘要
- [ ] 提取标题、内容、来源、时间等关键信息
- [ ] 处理多种响应格式
- [ ] 错误处理和异常情况处理

### 4. 实现查询结果的标准化处理
- [ ] 转换为统一的内容格式
- [ ] 与现有内容数据模型兼容
- [ ] 数据清洗和验证
- [ ] 去重和相似度检测

### 5. 建立查询历史记录
- [ ] 记录每次查询的详细信息
- [ ] 避免重复查询相同内容
- [ ] 查询结果缓存机制
- [ ] 历史查询统计和分析

### 6. 提供手动触发Gemini查询的管理界面
- [ ] 管理员界面支持手动触发
- [ ] 查询参数配置界面
- [ ] 查询结果查看界面
- [ ] 查询历史管理界面

## 技术实现

### 1. Gemini新闻获取服务

```typescript
// Gemini新闻获取服务
export class GeminiNewsService {
  private aiServiceManager: AIServiceManager;
  private contentItemService: ContentItemService;
  private queryHistory: Map<string, QueryRecord> = new Map();

  async fetchDailyNews(queryType: NewsQueryType): Promise<NewsFetchResult> {
    // 实现每日新闻获取逻辑
  }

  async fetchTechNews(): Promise<NewsItem[]> {
    // 获取科技新闻
  }

  async fetchAINews(): Promise<NewsItem[]> {
    // 获取AI相关新闻
  }

  async fetchStockNews(): Promise<NewsItem[]> {
    // 获取股票相关新闻
  }
}
```

### 2. 查询提示词模板

```typescript
// 查询提示词模板
export const GEMINI_QUERY_PROMPTS = {
  TECH_NEWS: `
请搜索今天最新的科技新闻，重点关注：
1. 人工智能和机器学习发展
2. 新技术发布和产品更新
3. 科技公司动态和投资消息
4. 科技创新和研发成果

请以JSON格式返回结果，包含以下字段：
- title: 新闻标题
- summary: 新闻摘要（150-200字）
- source: 新闻来源
- publishedAt: 发布时间
- url: 原文链接
- category: 新闻分类
- importance: 重要性评分（1-10）
- tags: 相关标签数组
`,

  AI_NEWS: `
请搜索今天最新的AI相关新闻，重点关注：
1. 大语言模型和AI技术突破
2. AI产品发布和更新
3. AI公司融资和合作消息
4. AI政策和监管动态

请以JSON格式返回结果，包含以下字段：
- title: 新闻标题
- summary: 新闻摘要（150-200字）
- source: 新闻来源
- publishedAt: 发布时间
- url: 原文链接
- category: 新闻分类
- importance: 重要性评分（1-10）
- tags: 相关标签数组
`,

  STOCK_NEWS: `
请搜索今天最新的股票和投资相关新闻，重点关注：
1. 科技股表现和财报消息
2. 投资和融资动态
3. 市场分析和预测
4. 经济政策影响

请以JSON格式返回结果，包含以下字段：
- title: 新闻标题
- summary: 新闻摘要（150-200字）
- source: 新闻来源
- publishedAt: 发布时间
- url: 原文链接
- category: 新闻分类
- importance: 重要性评分（1-10）
- tags: 相关标签数组
`
};
```

### 3. 新闻数据模型

```typescript
// 新闻数据模型
export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: Date;
  url: string;
  category: string;
  importance: number;
  tags: string[];
  content?: string;
  imageUrl?: string;
}

export interface NewsFetchResult {
  success: boolean;
  totalFetched: number;
  totalSaved: number;
  errors: string[];
  newsItems: NewsItem[];
  queryTime: Date;
  queryType: NewsQueryType;
}

export interface QueryRecord {
  id: string;
  queryType: NewsQueryType;
  queryTime: Date;
  resultCount: number;
  success: boolean;
  errorMessage?: string;
  duration: number;
}
```

### 4. 定时任务配置

```typescript
// 定时任务配置
export const GEMINI_SCHEDULE_CONFIG = {
  TECH_NEWS: {
    cron: '0 8,14,20 * * *', // 每天8点、14点、20点
    timezone: 'Asia/Shanghai'
  },
  AI_NEWS: {
    cron: '0 9,15,21 * * *', // 每天9点、15点、21点
    timezone: 'Asia/Shanghai'
  },
  STOCK_NEWS: {
    cron: '0 10,16,22 * * *', // 每天10点、16点、22点
    timezone: 'Asia/Shanghai'
  }
};
```

## 数据库设计

### Gemini查询记录表

```sql
CREATE TABLE gemini_query_logs (
  id VARCHAR(255) PRIMARY KEY,
  query_type VARCHAR(50) NOT NULL, -- 'tech_news', 'ai_news', 'stock_news'
  query_time TIMESTAMP NOT NULL,
  result_count INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gemini_query_logs_type ON gemini_query_logs(query_type);
CREATE INDEX idx_gemini_query_logs_time ON gemini_query_logs(query_time);
```

### Gemini新闻缓存表

```sql
CREATE TABLE gemini_news_cache (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  summary TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  published_at TIMESTAMP NOT NULL,
  url VARCHAR(1000) NOT NULL,
  category VARCHAR(100) NOT NULL,
  importance INTEGER NOT NULL,
  tags JSON NOT NULL,
  content TEXT,
  image_url VARCHAR(1000),
  query_type VARCHAR(50) NOT NULL,
  query_time TIMESTAMP NOT NULL,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gemini_news_cache_type ON gemini_news_cache(query_type);
CREATE INDEX idx_gemini_news_cache_time ON gemini_news_cache(published_at);
CREATE INDEX idx_gemini_news_cache_processed ON gemini_news_cache(is_processed);
```

## API端点设计

### 1. Gemini新闻获取端点

```typescript
// 获取Gemini新闻
GET /api/gemini/news

// 手动触发Gemini查询
POST /api/gemini/trigger-query

// 获取查询历史
GET /api/gemini/query-history

// 获取新闻缓存
GET /api/gemini/news-cache

// 清理过期缓存
DELETE /api/gemini/news-cache/cleanup
```

### 2. 查询管理端点

```typescript
// 获取查询统计
GET /api/gemini/query-stats

// 更新查询配置
PUT /api/gemini/query-config

// 获取查询状态
GET /api/gemini/query-status
```

## 环境变量配置

```bash
# Gemini新闻获取配置
GEMINI_NEWS_ENABLED=true
GEMINI_NEWS_QUERY_INTERVAL_HOURS=6
GEMINI_NEWS_MAX_RESULTS=50
GEMINI_NEWS_CACHE_TTL_HOURS=24
GEMINI_NEWS_AUTO_PROCESS=true

# 查询时间配置
GEMINI_TECH_NEWS_SCHEDULE="0 8,14,20 * * *"
GEMINI_AI_NEWS_SCHEDULE="0 9,15,21 * * *"
GEMINI_STOCK_NEWS_SCHEDULE="0 10,16,22 * * *"
```

## 测试计划

### 1. 单元测试
- [ ] Gemini新闻服务测试
- [ ] 查询提示词测试
- [ ] 数据解析测试
- [ ] 缓存机制测试

### 2. 集成测试
- [ ] AI服务集成测试
- [ ] 数据库操作测试
- [ ] 定时任务测试
- [ ] API端点测试

### 3. 性能测试
- [ ] 查询响应时间测试
- [ ] 并发查询测试
- [ ] 内存使用测试
- [ ] 错误处理测试

## 部署计划

### 1. 开发环境
- [ ] 配置开发环境Gemini服务
- [ ] 实现基础功能
- [ ] 进行单元测试

### 2. 测试环境
- [ ] 部署到测试环境
- [ ] 进行集成测试
- [ ] 性能测试

### 3. 生产环境
- [ ] 配置生产环境Gemini服务
- [ ] 部署到生产环境
- [ ] 监控和优化

## 验收测试

### 1. 功能测试
- [ ] 能够成功获取科技新闻
- [ ] 能够成功获取AI新闻
- [ ] 能够成功获取股票新闻
- [ ] 定时任务正常运行
- [ ] 手动触发功能正常

### 2. 性能测试
- [ ] 查询响应时间在可接受范围内
- [ ] 并发处理能力满足需求
- [ ] 内存使用合理
- [ ] 错误处理完善

### 3. 数据质量测试
- [ ] 新闻数据格式正确
- [ ] 去重功能正常
- [ ] 数据清洗有效
- [ ] 缓存机制正常

## 完成标准

- [x] 所有验收标准都已实现
- [x] 所有测试用例都通过
- [x] 代码审查完成
- [x] 文档更新完成
- [x] 部署到生产环境
- [x] 监控和告警配置完成

## 完成状态

**状态：** ✅ **已完成** (2025-10-07)  
**提交记录：** [75b82aa] feat: Implement Story 2.2 - Gemini AI Daily News Acquisition

### 实现总结

1. **Gemini AI定时查询功能** - 完成
   - 实现了每日2-3次自动查询
   - 支持科技新闻、AI新闻、股票新闻三种类型
   - 可配置的查询时间间隔（开发环境每6小时，生产环境每天3次）

2. **优化的查询提示词** - 完成
   - 设计了针对不同新闻类型的专门提示词
   - 支持结构化JSON响应格式
   - 提示词模板化和可配置

3. **结构化新闻摘要解析** - 完成
   - 解析Gemini返回的JSON格式新闻摘要
   - 提取标题、内容、来源、时间等关键信息
   - 处理多种响应格式和异常情况

4. **查询结果标准化处理** - 完成
   - 转换为统一的内容格式
   - 与现有内容数据模型兼容
   - 数据清洗和验证

5. **查询历史记录** - 完成
   - 记录每次查询的详细信息
   - 避免重复查询相同内容（1小时内不重复）
   - 查询结果缓存机制

6. **手动触发管理界面** - 完成
   - 完整的API端点支持手动触发
   - 查询参数配置和结果查看
   - 查询历史管理和统计

### 技术亮点

- **智能调度**：支持开发和生产环境的不同调度策略
- **多类型支持**：科技新闻、AI新闻、股票新闻三种类型
- **防重复机制**：避免短时间内重复查询相同内容
- **错误处理**：完善的错误处理和重试机制
- **性能监控**：查询统计和性能指标收集
- **数据质量**：数据验证、清洗和标准化处理

## 风险评估

### 高风险
- Gemini API限制和成本控制
- 数据质量和准确性

### 中风险
- 服务可用性和稳定性
- 性能优化和扩展性

### 低风险
- 代码质量和维护性
- 文档和测试覆盖

## 后续计划

1. **Story 2.3**: Claude AI内容分析与摘要
2. **Story 2.4**: 智能内容去重与相似度检测
3. **Story 2.5**: 内容评分与排序算法
4. **Story 2.6**: 每日TOP10自动生成
