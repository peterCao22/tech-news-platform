# Story 2.5: 内容评分与排序算法

## ✅ 完成状态

### 最新提交
- **评分服务**: `apps/api/src/services/content-scoring.service.ts` (842行) - 6维度评分算法
- **权重管理**: `apps/api/src/services/scoring-weight-manager.service.ts` (558行) - 动态权重、A/B测试
- **API路由**: `apps/api/src/routes/content-scoring.routes.ts` (473行) - 完整API接口
- **数据库模型**: `packages/database/prisma/schema.prisma` - ContentScore, ScoringWeight, ABTestConfig
- **测试脚本**: `apps/api/test-story-2-5-content-scoring.js` - 集成测试

### 实现进度
- [x] Phase 1: 核心评分算法 - 6维度评分系统
- [x] Phase 2: 权重管理 - 动态权重、5个预设模板、A/B测试
- [x] Phase 3: 数据库模型 - 3个表、关系定义、迁移应用
- [x] Phase 4: API路由 - 20个端点、完整CRUD
- [ ] Phase 5: 集成测试 - 进行中

### 核心功能
✅ 6维度评分：时效性、权威性、质量、相关性、AI重要性、用户行为  
✅ 6级来源权威性：顶级机构(95-100)、知名媒体(85-94)、专业博客(75-84)、AI简报(80-90)、金融数据(85-95)、一般来源(60-74)  
✅ 动态权重管理：可创建、更新、激活、删除权重配置  
✅ 5个预设模板：时效性优先、权威性优先、质量优先、AI推荐优先、用户行为优先  
✅ A/B测试框架：创建测试、追踪指标、分析结果、应用获胜配置  
✅ 个性化评分：基于用户分类、公司、来源偏好  
✅ 评分透明化：生成评分解释，显示主要影响因素  

## 📋 故事概述

**作为** 系统  
**我想要** 建立综合的内容评分和排序算法  
**以便** 能够自动识别最有价值的新闻内容

## 🎯 验收标准 (Acceptance Criteria)

1. ✅ 实现多维度评分算法：时效性、来源权威性、内容质量、相关性
2. ✅ 集成AI生成的重要性评分和用户行为数据
3. ✅ 建立动态权重调整机制，根据用户反馈优化算法
4. ✅ 实现个性化评分，考虑用户的关注偏好
5. ✅ 提供评分透明度，显示评分的主要影响因素
6. ✅ 建立A/B测试框架，持续优化排序效果

## 🏗️ 技术设计

### 架构方案

```
┌─────────────────────────────────────────────────────────┐
│              内容评分与排序服务                            │
├─────────────────────────────────────────────────────────┤
│  ContentScoringService                                  │
│  - calculateScore(): 计算综合评分                        │
│  - scoreByDimension(): 按维度评分                        │
│  - applyWeights(): 应用权重                              │
│  - personalizeScore(): 个性化评分                        │
│  - explainScore(): 评分透明化                            │
└─────────────────────────────────────────────────────────┘
           ↓ 使用                    ↑ 返回
┌─────────────────────────────────────────────────────────┐
│            评分维度计算模块                                │
│  - TimelinessScorer: 时效性评分                          │
│  - AuthorityScorer: 来源权威性评分                       │
│  - QualityScorer: 内容质量评分                           │
│  - RelevanceScorer: 相关性评分                           │
│  - AIScorer: AI重要性评分                                │
│  - EngagementScorer: 用户行为评分                        │
└─────────────────────────────────────────────────────────┘
           ↓ 存储                    ↑ 查询
┌─────────────────────────────────────────────────────────┐
│                  数据库层 (Prisma)                       │
│  - content_scores: 内容评分记录                          │
│  - scoring_weights: 评分权重配置                         │
│  - user_preferences: 用户偏好                            │
│  - ab_test_configs: A/B测试配置                         │
└─────────────────────────────────────────────────────────┘
```

### 评分算法设计

#### 1. 多维度评分模型

```typescript
// 综合评分公式
totalScore = 
  timeliness * wT +         // 时效性权重
  authority * wA +          // 权威性权重
  quality * wQ +            // 质量权重
  relevance * wR +          // 相关性权重
  aiImportance * wAI +      // AI评分权重
  engagement * wE           // 用户行为权重

// 默认权重
defaultWeights = {
  timeliness: 0.20,    // 20%
  authority: 0.25,     // 25%
  quality: 0.20,       // 20%
  relevance: 0.15,     // 15%
  aiImportance: 0.15,  // 15%
  engagement: 0.05     // 5%
}
```

#### 2. 各维度评分算法

**时效性评分 (Timeliness)**
```typescript
// 使用指数衰减函数
timelinessScore = 100 * Math.exp(-λ * hoursAge)
// λ = 0.01 (衰减系数)
// 0-24小时: 90-100分
// 24-48小时: 70-90分
// 48-72小时: 50-70分
// >72小时: <50分
```

**来源权威性评分 (Authority)**
```typescript
// 基于预定义的来源评级（0-100分）

// Tier 1: 顶级权威机构 (95-100分)
const tier1Sources = {
  // 学术机构
  'mit.edu': 100,
  'stanford.edu': 100,
  'berkeley.edu': 98,
  'arxiv.org': 97,
  
  // 金融权威
  'bloomberg.com': 99,
  'reuters.com': 98,
  'wsj.com': 98,
  'ft.com': 97,
  
  // 科技巨头官方
  'openai.com': 98,
  'google.ai': 98,
  'microsoft.com/ai': 97,
  'nvidia.com': 96,
  'anthropic.com': 96
};

// Tier 2: 知名科技媒体 (85-94分)
const tier2Sources = {
  'techcrunch.com': 92,
  'wired.com': 91,
  'arstechnica.com': 90,
  'theverge.com': 89,
  'technologyreview.com': 94,
  'nature.com': 95,
  'science.org': 95,
  'venturebeat.com': 88,
  'zdnet.com': 87,
  'cnet.com': 86
};

// Tier 3: 专业科技博客与社区 (75-84分)
const tier3Sources = {
  'hackernews.ycombinator.com': 83,
  'medium.com': 78,
  'techmeme.com': 82,
  'slashdot.org': 80,
  'reddit.com/r/technology': 76,
  'github.blog': 81,
  'stackoverflow.blog': 80
};

// Tier 4: AI专题简报 (80-90分)
const tier4Sources = {
  'bensbites.co': 85,
  'therundown.ai': 84,
  'tldr.tech': 83,
  'importai.com': 86,
  'thesequence.substack.com': 87
};

// Tier 5: 金融数据提供商 (85-95分)
const tier5Sources = {
  'polygon.io': 88,
  'finnhub.io': 87,
  'alphavantage.co': 86,
  'yahoofinance.com': 85,
  'marketwatch.com': 86,
  'seekingalpha.com': 84
};

// Tier 6: 一般来源 (60-74分)
const tier6Sources = {
  'news.google.com': 70,
  'twitter.com': 65,
  'linkedin.com': 68,
  'unknown': 50
};

// 动态计算逻辑
function getAuthorityScore(sourceUrl: string): number {
  const domain = extractDomain(sourceUrl);
  
  // 按优先级查找
  return tier1Sources[domain] ||
         tier2Sources[domain] ||
         tier3Sources[domain] ||
         tier4Sources[domain] ||
         tier5Sources[domain] ||
         tier6Sources[domain] ||
         50; // 默认分数
}

// 额外加成逻辑
function applyAuthorityBonus(baseScore: number, metadata: any): number {
  let bonus = 0;
  
  // 如果是原创内容 +5
  if (metadata.isOriginal) bonus += 5;
  
  // 如果有作者认证 +3
  if (metadata.authorVerified) bonus += 3;
  
  // 如果引用了学术论文 +5
  if (metadata.hasCitations) bonus += 5;
  
  return Math.min(100, baseScore + bonus);
}
```

**内容质量评分 (Quality)**
```typescript
// 基于内容特征
qualityScore = (
  titleQuality * 0.2 +      // 标题质量
  contentLength * 0.2 +     // 内容长度适中
  readability * 0.2 +       // 可读性
  mediaPresence * 0.2 +     // 是否有图片/视频
  structureQuality * 0.2    // 结构质量
) * 100
```

**相关性评分 (Relevance)**
```typescript
// 基于关键词匹配和分类
relevanceScore = (
  categoryMatch * 0.4 +     // 分类匹配
  keywordMatch * 0.4 +      // 关键词匹配
  tagMatch * 0.2            // 标签匹配
) * 100
```

**AI重要性评分 (AI Importance)**
```typescript
// 使用Claude分析结果
// 直接使用AI生成的1-10分，转换为0-100
aiScore = claudeImportanceScore * 10
```

**用户行为评分 (Engagement)**
```typescript
// 基于用户互动数据
engagementScore = (
  viewCount * 0.3 +
  shareCount * 0.4 +
  bookmarkCount * 0.3
) / maxEngagement * 100
```

#### 3. 个性化评分

```typescript
// 用户偏好加成
personalizedScore = baseScore * (1 + preferenceBonus)

preferenceBonus = 
  userCategoryPreference * 0.3 +    // 用户关注的分类
  userCompanyPreference * 0.4 +     // 用户关注的公司
  userSourcePreference * 0.3        // 用户偏好的来源
```

### API端点

```typescript
// 评分API
POST   /api/scoring/calculate           // 计算单条内容评分
POST   /api/scoring/batch-calculate     // 批量计算评分
GET    /api/scoring/explain/:contentId  // 评分解释
POST   /api/scoring/recalculate-all     // 重新计算所有评分

// 权重管理API
GET    /api/scoring/weights             // 获取当前权重配置
PUT    /api/scoring/weights             // 更新权重配置
POST   /api/scoring/weights/reset       // 重置为默认权重

// A/B测试API
POST   /api/scoring/ab-test             // 创建A/B测试
GET    /api/scoring/ab-test/:id         // 获取测试结果
PUT    /api/scoring/ab-test/:id/apply   // 应用获胜配置

// 排序API
GET    /api/content/ranked              // 获取排序后的内容列表
POST   /api/content/personalized-rank   // 获取个性化排序
```

### 数据模型

```prisma
model ContentScore {
  id                 String   @id @default(cuid())
  contentId          String   @map("content_id")
  totalScore         Float    @map("total_score")
  timelinessScore    Float    @map("timeliness_score")
  authorityScore     Float    @map("authority_score")
  qualityScore       Float    @map("quality_score")
  relevanceScore     Float    @map("relevance_score")
  aiImportanceScore  Float    @map("ai_importance_score")
  engagementScore    Float    @map("engagement_score")
  personalizedScore  Float?   @map("personalized_score")
  weightConfigId     String?  @map("weight_config_id")
  calculatedAt       DateTime @default(now()) @map("calculated_at")
  content            Content  @relation(fields: [contentId], references: [id])
  
  @@index([contentId])
  @@index([totalScore])
  @@index([calculatedAt])
  @@map("content_scores")
}

model ScoringWeight {
  id              String   @id @default(cuid())
  name            String   @db.VarChar(100)
  description     String?
  timeliness      Float    @default(0.20)
  authority       Float    @default(0.25)
  quality         Float    @default(0.20)
  relevance       Float    @default(0.15)
  aiImportance    Float    @default(0.15) @map("ai_importance")
  engagement      Float    @default(0.05)
  isActive        Boolean  @default(false) @map("is_active")
  isDefault       Boolean  @default(false) @map("is_default")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  @@map("scoring_weights")
}

model ABTestConfig {
  id              String   @id @default(cuid())
  name            String   @db.VarChar(100)
  description     String?
  weightConfigAId String   @map("weight_config_a_id")
  weightConfigBId String   @map("weight_config_b_id")
  startDate       DateTime @map("start_date")
  endDate         DateTime? @map("end_date")
  status          String   @default("ACTIVE") // ACTIVE, COMPLETED, CANCELLED
  winnerConfigId  String?  @map("winner_config_id")
  metricsA        Json?    @map("metrics_a")
  metricsB        Json?    @map("metrics_b")
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@index([status])
  @@map("ab_test_configs")
}
```

## 📝 实现任务

### Phase 1: 核心评分算法 ⏳
- [ ] 创建 `ContentScoringService` 类
- [ ] 实现时效性评分算法
- [ ] 实现来源权威性评分
- [ ] 实现内容质量评分
- [ ] 实现相关性评分
- [ ] 实现AI重要性评分集成
- [ ] 实现用户行为评分

### Phase 2: 权重与个性化 ⏳
- [ ] 实现权重配置管理
- [ ] 实现动态权重应用
- [ ] 实现用户个性化评分
- [ ] 实现评分透明化（解释功能）

### Phase 3: 数据库与存储 ⏳
- [ ] 添加 Prisma 数据模型
- [ ] 创建数据库迁移
- [ ] 实现评分结果持久化
- [ ] 实现评分历史记录

### Phase 4: API路由 ⏳
- [ ] 创建 `scoring.routes.ts`
- [ ] 实现评分计算端点
- [ ] 实现权重管理端点
- [ ] 实现A/B测试端点
- [ ] 实现排序端点

### Phase 5: 集成与测试 ⏳
- [ ] 在 `server.ts` 中注册路由
- [ ] 集成到内容处理流程
- [ ] 创建集成测试脚本
- [ ] 性能测试和优化
- [ ] 更新文档

## 🧪 测试计划

### 测试场景

1. **基础评分测试**
   - 输入：不同时效性的内容
   - 验证：时效性评分正确计算

2. **权重应用测试**
   - 输入：相同内容，不同权重配置
   - 验证：综合评分差异符合预期

3. **个性化评分测试**
   - 输入：用户偏好 + 内容列表
   - 验证：个性化评分生效

4. **批量评分性能测试**
   - 输入：1000条内容
   - 验证：评分时间 < 5秒

5. **评分解释测试**
   - 输入：已评分内容ID
   - 验证：返回各维度评分详情

## 📊 性能指标

- **单条评分响应时间**: < 100ms
- **批量评分(100条)**: < 3秒
- **评分准确率**: > 85% (基于人工标注对比)
- **个性化提升**: 用户满意度提升 > 20%

## 🔒 安全考虑

1. **权限控制**: 仅管理员可修改权重配置
2. **数据验证**: 所有评分值必须在0-100范围内
3. **审计日志**: 记录所有权重配置变更
4. **A/B测试隔离**: 确保测试组之间的数据隔离

## 📦 依赖项

- Claude AI Service (重要性评分)
- Content Repository (内容数据)
- User Preferences (用户偏好)
- Source Configuration (来源评级)

## 🚀 部署步骤

1. 应用数据库迁移
2. 初始化默认权重配置
3. 配置来源评级数据
4. 重启API服务
5. 运行测试验证
6. 对所有现有内容进行评分

## 📈 完成状态

- **开始日期**: 2025-10-09
- **目标完成日期**: 2025-10-10
- **实际完成日期**: 待定
- **当前状态**: ⏳ 进行中

### 进度跟踪
- [x] 需求分析和技术设计
- [x] 创建开发文档
- [ ] Phase 1: 核心评分算法
- [ ] Phase 2: 权重与个性化
- [ ] Phase 3: 数据库与存储
- [ ] Phase 4: API路由
- [ ] Phase 5: 集成与测试
- [ ] 文档更新和代码提交

## 🔗 相关资源

- [Story 2.1: AI工具集成框架](./story-2-1-ai-tools-integration-framework.md)
- [Story 2.2: Gemini AI每日新闻获取](./story-2-2-gemini-daily-news-acquisition.md)
- [Story 2.3: Claude AI内容分析](./story-2-3-claude-content-analysis.md)
- [Story 2.4: 智能内容去重](./story-2-4-content-deduplication.md)
- [PRD文档](../prd.md)

---

**负责人**: AI开发团队  
**优先级**: P0 (高)  
**Epic**: Epic 2 - AI工具集成与智能筛选

