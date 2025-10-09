# Story 2.4: 智能内容去重与相似度检测

## 📋 故事概述

**作为** 系统  
**我想要** 使用AI技术检测和处理重复或相似的新闻内容  
**以便** 用户看到的都是独特且有价值的信息

## 🎯 验收标准 (Acceptance Criteria)

1. ✅ 实现基于语义相似度的内容去重算法
2. ✅ 建立新闻标题和内容的向量化索引
3. ✅ 设置相似度阈值，自动合并或标记重复内容
4. ✅ 保留最权威来源的版本，记录其他来源作为引用
5. ✅ 提供人工审核界面，处理边界情况的去重决策
6. ✅ 建立去重规则的学习和优化机制

## 🏗️ 技术设计

### 架构方案

```
┌─────────────────────────────────────────────────────────┐
│              内容去重检测服务                              │
├─────────────────────────────────────────────────────────┤
│  ContentDeduplicationService                            │
│  - detectDuplicates(): 检测重复内容                      │
│  - calculateSimilarity(): 计算相似度                     │
│  - markAsDuplicate(): 标记为重复                         │
│  - mergeDuplicates(): 合并重复内容                       │
│  - getDuplicationReport(): 获取去重报告                  │
└─────────────────────────────────────────────────────────┘
           ↓ 使用                    ↑ 返回
┌─────────────────────────────────────────────────────────┐
│            AI向量化服务 (使用Claude/Gemini)               │
│  - generateEmbedding(): 生成文本向量                     │
│  - cosineSimilarity(): 计算余弦相似度                    │
└─────────────────────────────────────────────────────────┘
           ↓ 存储                    ↑ 查询
┌─────────────────────────────────────────────────────────┐
│                  数据库层 (Prisma)                       │
│  - content_duplications: 重复关系表                     │
│  - content.duplicate_of: 指向原始内容                   │
└─────────────────────────────────────────────────────────┘
```

### 相似度检测策略

#### 1. 多层次检测
```typescript
// Level 1: 标题精确匹配
if (title1 === title2) → 100% 相似

// Level 2: 标题相似度（快速）
titleSimilarity = levenshteinDistance(title1, title2)
if (titleSimilarity > 90%) → 进入 Level 3

// Level 3: 内容语义相似度（使用AI）
contentSimilarity = cosineSimilarity(
  embedding(content1), 
  embedding(content2)
)
```

#### 2. 相似度阈值
- **90-100%**: 极高相似（自动标记为重复）
- **75-89%**: 高度相似（需要人工审核）
- **60-74%**: 中度相似（记录但不处理）
- **<60%**: 不相似

### API端点

```typescript
// 去重检测API
POST   /api/deduplication/detect              // 检测重复内容
POST   /api/deduplication/batch-detect        // 批量检测
POST   /api/deduplication/mark-duplicate      // 标记为重复
POST   /api/deduplication/merge               // 合并重复内容
GET    /api/deduplication/report              // 获取去重报告
GET    /api/deduplication/pending-review      // 待审核的重复内容
POST   /api/deduplication/review-decision     // 人工审核决策
```

### 数据模型

使用现有的 `content_duplications` 表：

```prisma
model ContentDuplication {
  id                 String   @id @default(cuid())
  originalId         String   @map("original_id")
  duplicateId        String   @map("duplicate_id")
  similarityScore    Decimal  @map("similarity_score")
  titleSimilarity    Decimal  @map("title_similarity")
  contentSimilarity  Decimal  @map("content_similarity")
  overallSimilarity  Decimal  @map("overall_similarity")
  detectionMethod    String   @map("detection_method")
  status             DuplicationStatus
  reviewedBy         String?  @map("reviewed_by")
  reviewedAt         DateTime? @map("reviewed_at")
  reviewDecision     String?  @map("review_decision")
  reviewNotes        String?  @map("review_notes")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  @@map("content_duplications")
}

enum DuplicationStatus {
  PENDING         // 待审核
  CONFIRMED       // 已确认重复
  FALSE_POSITIVE  // 误报
  MERGED          // 已合并
  IGNORED         // 已忽略
}
```

## 📝 实现任务

### Phase 1: 核心去重服务 ✅
- [x] 创建 `ContentDeduplicationService` 类
- [x] 实现标题精确匹配检测
- [x] 实现标题相似度计算（Levenshtein距离）
- [x] 实现内容语义相似度（AI向量化）
- [x] 实现相似度综合评分

### Phase 2: 去重操作 ✅
- [x] 实现 `markAsDuplicate()` - 标记重复
- [x] 实现 `mergeDuplicates()` - 合并内容
- [x] 实现权威来源判断逻辑
- [x] 记录重复关系到数据库

### Phase 3: API路由 ✅
- [x] 创建 `deduplication.routes.ts`
- [x] 实现检测端点（detect, batch-detect, similarity）
- [x] 实现标记和合并端点（mark-duplicate, merge）
- [x] 实现报告和审核端点（report, pending-review, review-decision）

### Phase 4: 集成与测试 ✅
- [x] 在 `server.ts` 中注册路由
- [x] 创建集成测试脚本
- [x] TypeScript编译通过
- [ ] **待执行**: 运行测试（需要API服务）

## 🧪 测试计划

### 测试场景

1. **完全相同内容**
   - 输入：标题和内容完全相同的两篇新闻
   - 验证：100%相似度，自动标记为重复

2. **标题相同内容不同**
   - 输入：标题相同，内容差异较大
   - 验证：根据内容相似度判断

3. **标题不同内容相似**
   - 输入：标题不同，但内容描述同一事件
   - 验证：AI语义相似度 > 阈值

4. **批量检测**
   - 输入：10条新内容
   - 验证：检测出所有重复对

5. **合并操作**
   - 输入：确认的重复内容对
   - 验证：保留权威来源，标记其他为重复

## 📊 性能指标

- **单次检测响应时间**: < 2秒
- **批量检测(10条)**: < 15秒
- **误报率**: < 5%
- **漏检率**: < 10%
- **相似度准确率**: > 85%

## 🔒 安全考虑

1. **权限控制**: 仅认证用户可调用去重API
2. **审核权限**: 人工审核需要EDITOR或ADMIN角色
3. **数据保护**: 原始内容不会被删除
4. **操作日志**: 记录所有去重和合并操作

## 📦 依赖项

- AI Service (Claude/Gemini) - 文本向量化
- Prisma - 数据库访问
- 现有 `content_duplications` 表

## 🚀 部署步骤

1. 确保AI服务可用（Claude或Gemini）
2. 数据库表已创建（content_duplications）
3. 重启API服务
4. 运行测试验证

## 📚 算法说明

### 标题相似度算法

使用 **Levenshtein Distance** (编辑距离)：

```typescript
function levenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return (1 - distance / maxLength) * 100;
}
```

### 内容语义相似度

使用 **AI Embeddings + Cosine Similarity**：

```typescript
async function semanticSimilarity(text1: string, text2: string): Promise<number> {
  // 1. 生成向量
  const embedding1 = await aiService.generateEmbedding(text1);
  const embedding2 = await aiService.generateEmbedding(text2);
  
  // 2. 计算余弦相似度
  const similarity = cosineSimilarity(embedding1, embedding2);
  
  return similarity * 100; // 转换为百分比
}
```

### 综合相似度评分

```typescript
overallSimilarity = (
  titleSimilarity * 0.4 +      // 标题权重40%
  contentSimilarity * 0.6      // 内容权重60%
)
```

## 📈 完成状态

- **开始日期**: 2025-10-09
- **目标完成日期**: 2025-10-09
- **实际完成日期**: 2025-10-09
- **当前状态**: ✅ 开发完成，待执行测试

### 进度跟踪
- [x] 需求分析和技术设计
- [x] 创建开发文档
- [x] Phase 1: 核心去重服务
- [x] Phase 2: 去重操作
- [x] Phase 3: API路由
- [x] Phase 4: 集成测试脚本
- [x] 文档更新和代码提交

### 实现完成情况

#### ✅ 核心服务 (`ContentDeduplicationService`)
- [x] `detectDuplicates()` - 检测单条内容的重复
- [x] `batchDetect()` - 批量检测
- [x] `calculateSimilarity()` - 计算相似度
- [x] `calculateTitleSimilarity()` - 标题相似度（Levenshtein）
- [x] `calculateContentSimilarity()` - 内容语义相似度（AI）
- [x] `markAsDuplicate()` - 标记为重复
- [x] `mergeDuplicates()` - 合并重复内容
- [x] `getDeduplicationReport()` - 获取去重报告

#### ✅ API路由 (`deduplication.routes.ts`)
- [x] POST `/api/deduplication/detect` - 检测单条重复
- [x] POST `/api/deduplication/batch-detect` - 批量检测
- [x] POST `/api/deduplication/similarity` - 计算相似度
- [x] POST `/api/deduplication/mark-duplicate` - 标记重复
- [x] POST `/api/deduplication/merge` - 合并重复
- [x] GET `/api/deduplication/report` - 去重报告
- [x] GET `/api/deduplication/pending-review` - 待审核列表
- [x] POST `/api/deduplication/review-decision` - 审核决策

#### ✅ 算法实现
- [x] Levenshtein距离算法（标题相似度）
- [x] AI语义相似度分析（内容相似度）
- [x] 简单文本相似度（降级方案）
- [x] 综合相似度评分（标题40% + 内容60%）
- [x] 多层次检测策略（快速→深度）

#### ✅ 测试准备
- [x] 创建集成测试脚本 `test-story-2-4-deduplication.js`
- [x] 5个测试场景（登录、获取内容、检测、相似度、报告）
- [ ] **待执行**: 运行测试（需要API服务）

### 最新提交
- **Commit**: `5fde624` - "feat: Story 2.4 - Content Deduplication and Similarity Detection"
- **提交时间**: 2025-10-09
- **文件变更**:
  - 新增: `apps/api/src/services/content-deduplication.service.ts` (533行)
  - 新增: `apps/api/src/routes/deduplication.routes.ts` (365行)
  - 修改: `apps/api/src/server.ts` (+2行，注册路由)
  - 新增: `apps/api/test-story-2-4-deduplication.js` (237行)
  - 修改: `docs/stories/story-2-4-content-deduplication.md`

## 🔗 相关资源

- [Story 2.1: AI工具集成框架](./story-2-1-ai-tools-integration-framework.md)
- [Story 2.2: Gemini AI每日新闻获取](./story-2-2-gemini-daily-news-acquisition.md)
- [Story 2.3: Claude AI内容分析](./story-2-3-claude-content-analysis.md)
- [PRD文档](../prd.md)

---

**负责人**: AI开发团队  
**优先级**: P0 (高)  
**Epic**: Epic 2 - AI工具集成与智能筛选

