# Epic 4 后续开发规划

**规划时间**: 2025-10-17  
**当前状态**: Story 4.1 ✅ 完成 | Story 4.4 🔄 85%完成  
**剩余Story**: 4.2, 4.3, 4.5, 4.6

---

## 📊 当前状态总结

### 已完成的Story

#### ✅ Story 4.1: 用户个性化偏好设置（100%完成）
**核心成果**:
- 显式偏好管理（兴趣、关注、来源权重）
- 个性化推荐引擎
- 个性化TOP10生成
- 偏好导入/导出

**代码统计**:
- 后端: ~1300行 (2个服务 + 19个API端点)
- 前端: ~1450行 (6个组件 + 2个页面)

#### 🔄 Story 4.4: 用户行为分析与学习（85%完成）
**已完成**:
- ✅ 完整的行为追踪SDK
- ✅ 隐式偏好学习引擎
- ✅ 阅读历史管理
- ✅ 基础Dashboard

**未完成** (15%):
- ❌ 行为统计可视化组件（图表）
- ❌ 更多页面的埋点集成
- ❌ 用户使用文档

**代码统计**:
- 后端: ~1970行 (3个服务 + 17个API端点)
- 前端: ~1280行 (3个组件 + 2个页面)

---

## 🎯 开发路径规划

### 推荐路径A: 功能广度优先（快速见效）✅

**理由**: Story 4.4的核心功能已完成（85%），足以支撑后续开发。优先实现更多用户可见功能。

```
当前位置
    ↓
Story 4.2: 高级搜索与筛选 (预计6-8小时) ← 推荐首选
    ↓
Story 4.3: 历史内容分析与趋势 (预计8-10小时)
    ↓
回到Story 4.4: 完成可视化组件 (预计2-3小时)
    ↓
Story 4.5 & 4.6: 根据需求评估
```

**优势**:
- ✅ 每个Story都能快速看到用户价值
- ✅ 搜索功能是高频刚需
- ✅ 历史分析提供数据洞察
- ✅ 保持开发节奏

**风险**:
- ⚠️ Story 4.4留下15%技术债务
- ⚠️ 需要后续回来完善可视化

---

### 备选路径B: 完整度优先

```
当前位置
    ↓
完成Story 4.4剩余15% (预计2-3小时)
    ↓
Story 4.2: 高级搜索与筛选
    ↓
Story 4.3: 历史内容分析与趋势
```

**优势**:
- ✅ Story 4.4达到95%+完整度
- ✅ 减少技术债务
- ✅ 用户体验更完善

**劣势**:
- ❌ 需要安装新依赖（recharts）
- ❌ 延后其他功能2-3小时

---

## 📋 Story详细规划

### Story 4.2: 高级搜索与筛选

#### Story Overview
**As a** 专业用户  
**I want** 使用高级搜索和筛选功能快速找到特定信息  
**So that** 我能够高效地研究特定主题或跟踪特定事件

#### 核心功能（来自PRD）
1. 全文搜索功能（标题、内容、标签）
2. 高级筛选器：
   - 日期范围
   - 来源
   - 分类
   - 股票代码
   - 情感倾向
   - AI评分范围
   - 收藏状态
3. 布尔搜索语法（AND、OR、NOT）
4. 多维度排序（相关性、时间、评分）
5. 搜索历史和保存
6. 搜索建议和自动补全

#### 技术设计建议

##### 后端（4-5小时）
```typescript
// 新增服务
apps/api/src/services/search.service.ts (约600行)
  - fullTextSearch(query, filters, pagination)
  - parseSearchQuery(query) // 解析布尔语法
  - buildSearchConditions(filters)
  - calculateRelevanceScore(content, query)
  - saveSearchHistory(userId, query)
  - getSearchSuggestions(partial)

// 新增API路由
apps/api/src/routes/search.routes.ts (约400行)
  - GET  /api/search                    // 主搜索
  - POST /api/search/advanced           // 高级搜索
  - GET  /api/search/history            // 搜索历史
  - POST /api/search/save               // 保存搜索
  - GET  /api/search/suggestions        // 搜索建议
  - DELETE /api/search/history/:id      // 删除历史

// 数据模型
packages/database/prisma/schema.prisma
  model SearchHistory {
    id        String   @id @default(cuid())
    userId    String
    query     String
    filters   Json
    resultCount Int
    createdAt DateTime @default(now())
    user      User     @relation(fields: [userId], references: [id])
    @@index([userId, createdAt])
  }
  
  model SavedSearch {
    id          String   @id @default(cuid())
    userId      String
    name        String
    query       String
    filters     Json
    isActive    Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    user        User     @relation(fields: [userId], references: [id])
  }
```

##### 前端（2-3小时）
```typescript
// 搜索页面
apps/web/src/app/search/page.tsx (约400行)
  - 搜索输入框（支持布尔语法）
  - 高级筛选面板
  - 搜索结果列表
  - 分页和排序

// 搜索组件
apps/web/src/components/search/SearchBar.tsx (约200行)
  - 实时搜索建议
  - 布尔语法提示
  - 历史记录下拉

apps/web/src/components/search/AdvancedFilters.tsx (约300行)
  - 日期范围选择器
  - 来源/分类多选
  - 评分范围滑块
  - 自定义筛选器

apps/web/src/components/search/SearchResults.tsx (约250行)
  - 结果高亮显示
  - 相关性评分
  - 快速操作（收藏、分享）

apps/web/src/components/search/SavedSearches.tsx (约150行)
  - 保存的搜索列表
  - 快速执行
  - 编辑/删除

// 状态管理
apps/web/src/stores/search.store.ts (约200行)
  - 搜索状态管理
  - 筛选条件
  - 历史记录缓存
```

##### 技术要点
- **搜索引擎**: 使用PostgreSQL的全文搜索（`tsvector`, `tsquery`）
- **性能优化**: 添加全文搜索索引
- **布尔语法解析**: 实现简单的查询解析器
- **相关性评分**: TF-IDF算法 + BM25

#### 预计工作量
- **后端**: 4-5小时（服务 + API + 测试）
- **前端**: 2-3小时（UI组件 + 集成）
- **总计**: 6-8小时

#### 验收测试要点
1. 搜索"AI AND (股票 OR 投资) NOT 加密货币"能正确返回结果
2. 高级筛选能精确定位内容
3. 搜索历史能保存和快速重用
4. 搜索建议响应及时（<200ms）
5. 搜索结果高亮关键词

---

### Story 4.3: 历史内容分析与趋势

#### Story Overview
**As a** 分析师用户  
**I want** 查看和分析历史内容数据  
**So that** 我能够识别趋势和模式，做出更好的决策

#### 核心功能（来自PRD）
1. 历史内容浏览（按时间线）
2. 内容趋势分析：
   - 热门话题变化趋势
   - 关键词频率分析
   - 情感倾向趋势
3. 公司/股票的新闻历史追踪
4. 技术领域发展趋势可视化
5. 自定义时间范围分析报告

#### 技术设计建议

##### 后端（5-6小时）
```typescript
// 新增服务
apps/api/src/services/analytics.service.ts (约800行)
  - getHistoricalTop10(dateRange)
  - analyzeTrends(type, dateRange) // type: keyword, topic, sentiment
  - getCompanyNewsHistory(company, dateRange)
  - getCategoryTrends(category, dateRange)
  - generateTrendReport(config)
  - aggregateKeywords(dateRange)
  - calculateSentimentTrend(dateRange)

// 新增API路由
apps/api/src/routes/analytics.routes.ts (约500行)
  - GET  /api/analytics/historical-top10     // 历史TOP10
  - GET  /api/analytics/trends               // 趋势分析
  - GET  /api/analytics/company/:name        // 公司历史
  - GET  /api/analytics/category/:cat        // 分类趋势
  - GET  /api/analytics/keywords             // 关键词分析
  - POST /api/analytics/report               // 生成报告
  - GET  /api/analytics/sentiment-trend      // 情感趋势

// 数据模型（可选，用于缓存）
packages/database/prisma/schema.prisma
  model TrendSnapshot {
    id          String   @id @default(cuid())
    date        DateTime
    type        String   // keyword, topic, sentiment
    data        Json     // 趋势数据
    createdAt   DateTime @default(now())
    @@index([date, type])
  }
  
  model AnalyticsReport {
    id          String   @id @default(cuid())
    userId      String
    title       String
    config      Json
    result      Json
    createdAt   DateTime @default(now())
    user        User     @relation(fields: [userId], references: [id])
  }
```

##### 前端（3-4小时）
```typescript
// 历史分析页面
apps/web/src/app/analytics/page.tsx (约500行)
  - 时间范围选择
  - 分析类型切换
  - 多维度图表展示

// 分析组件
apps/web/src/components/analytics/TimelineView.tsx (约300行)
  - 历史TOP10时间线
  - 可交互的日期导航
  - 内容卡片展示

apps/web/src/components/analytics/TrendChart.tsx (约400行)
  - 使用recharts绘制趋势图
  - 关键词频率折线图
  - 情感倾向柱状图
  - 分类分布饼图

apps/web/src/components/analytics/KeywordCloud.tsx (约200行)
  - 热门关键词云图
  - 可点击跳转搜索

apps/web/src/components/analytics/CompanyTracker.tsx (约250行)
  - 公司新闻历史
  - 新闻量趋势
  - 情感变化

apps/web/src/components/analytics/ReportGenerator.tsx (约300行)
  - 报告配置面板
  - 自定义时间范围
  - 导出PDF/Excel

// 状态管理
apps/web/src/stores/analytics.store.ts (约200行)
```

##### 技术要点
- **数据聚合**: 使用PostgreSQL的聚合函数和时间窗口
- **图表库**: recharts（需要安装）
- **大数据量处理**: 实现数据分页和懒加载
- **缓存策略**: Redis缓存历史分析结果
- **性能优化**: 
  - 定时任务预计算每日趋势快照
  - 增量更新而非全量查询

#### 必须的依赖安装
```bash
# 前端
pnpm --filter apps/web add recharts date-fns
pnpm --filter apps/web add -D @types/recharts

# 如果需要导出PDF
pnpm --filter apps/web add jspdf jspdf-autotable
```

#### 预计工作量
- **后端**: 5-6小时（聚合服务 + API + 缓存优化）
- **前端**: 3-4小时（图表组件 + 交互）
- **总计**: 8-10小时

#### 验收测试要点
1. 能查看过去30天的历史TOP10
2. 趋势图能正确显示关键词频率变化
3. 公司追踪能列出所有相关新闻
4. 报告生成功能正常
5. 大数据量下性能可接受（<3秒）

---

## 🎯 推荐的开发顺序

### 第一优先级: Story 4.2 高级搜索（✅ 推荐立即开始）

**理由**:
1. **高频刚需**: 搜索是用户最常用的功能之一
2. **技术成熟**: 全文搜索技术成熟，实现风险低
3. **依赖独立**: 不需要Story 4.4的可视化完成
4. **快速见效**: 用户能立即感受到价值

**开发策略**:
- Phase 1: 后端搜索服务 + 基础搜索API（3小时）
- Phase 2: 前端搜索UI + 基础筛选（2小时）
- Phase 3: 高级功能 + 优化（1-2小时）

---

### 第二优先级: Story 4.3 历史分析（可选延后）

**理由**:
1. **依赖图表**: 需要recharts，可以和Story 4.4的可视化一起做
2. **分析型功能**: 不影响日常使用
3. **数据积累**: 需要一定时间积累数据才有分析价值

**建议**: 
- 先完成Story 4.2
- 如果时间充裕，可以在完成Story 4.2后一起处理Story 4.3和Story 4.4的可视化（统一安装recharts）

---

### 第三优先级: 完善Story 4.4可视化

**在以下时机处理**:
1. 实现Story 4.3时（统一安装recharts）
2. 或者作为一个单独的小Sprint（2-3小时）

**待完成清单**:
- [ ] 安装recharts和date-fns
- [ ] 实现`BehaviorStatsCard.tsx`（参与度统计卡片）
- [ ] 实现`InterestDistributionChart.tsx`（兴趣分布饼图）
- [ ] 实现`ReadingTrendChart.tsx`（阅读趋势折线图）
- [ ] 在更多页面集成行为追踪（列表页、搜索页、TOP10页）
- [ ] 编写用户使用文档

---

### Story 4.5 & 4.6 评估（暂缓）

#### Story 4.5: 智能通知与提醒
**复杂度**: 中高  
**依赖**: 需要消息推送基础设施  
**建议**: 暂缓，作为后续增强功能

#### Story 4.6: 社交功能与内容分享
**复杂度**: 高  
**依赖**: 需要完整的用户互动系统  
**建议**: 暂缓，作为独立的Epic处理

---

## 📝 技术债务管理

### 当前技术债务清单

| 来源 | 债务项 | 优先级 | 预计工作量 | 计划时间 |
|------|--------|--------|-----------|---------|
| Story 4.4 | 行为统计可视化 | 高 | 2-3小时 | 与Story 4.3一起 |
| Story 4.4 | 更多页面埋点 | 高 | 1小时 | Story 4.2后 |
| Story 4.4 | 用户使用文档 | 中 | 1小时 | Sprint结束前 |
| Story 4.4 | 单元测试 | 中 | 2小时 | 迭代优化 |
| Story 4.1 | 前端单元测试 | 低 | 2小时 | 迭代优化 |
| Story 4.4 | 数据导出 | 低 | 1-2小时 | 按需实现 |
| Story 4.4 | 管理员Dashboard | 低 | 3-4小时 | 按需实现 |

### 债务偿还策略
1. **高优先级债务**: 在Story 4.3开发时一并处理（统一安装依赖）
2. **中优先级债务**: 在Epic 4完成前的"清理Sprint"中处理
3. **低优先级债务**: 根据实际需求决定是否实现

---

## 🚀 执行计划建议

### 方案A: 平衡型（推荐 ✅）

```
Week 1 (约8小时):
  Day 1-2: Story 4.2 高级搜索（6-8小时）
    - ✅ 后端搜索服务 + API
    - ✅ 前端搜索UI
    - ✅ 集成测试

Week 2 (约12小时):
  Day 3-5: Story 4.3 历史分析 + Story 4.4可视化（10-12小时）
    - ✅ 安装recharts（统一解决可视化需求）
    - ✅ 后端分析服务 + API
    - ✅ Story 4.3前端组件（趋势图、时间线）
    - ✅ Story 4.4前端组件（行为统计图表）
    - ✅ 集成测试

Week 3 (约3-4小时):
  Day 6: 清理和完善
    - ✅ 更多页面埋点集成
    - ✅ 用户文档编写
    - ✅ 整体测试和优化
```

**总工作量**: 约23-24小时  
**完成后状态**:
- Story 4.1: 100% ✅
- Story 4.2: 100% ✅
- Story 4.3: 100% ✅
- Story 4.4: 95%+ ✅

---

### 方案B: 激进型（快速交付）

```
立即开始: Story 4.2（6-8小时）
  - 专注核心搜索功能
  - 跳过高级特性

评估后决定:
  - 如果时间充裕 → 继续Story 4.3
  - 如果时间紧张 → 暂停Epic 4，进入下一个Epic
```

---

## 📊 Epic 4 整体进度预测

| Story | 当前状态 | 预计剩余时间 | 优先级 | 建议开始时间 |
|-------|---------|-------------|--------|-------------|
| 4.1 ✅ | 100%完成 | 0小时 | - | 已完成 |
| 4.2 🎯 | 未开始 | 6-8小时 | 高 | 立即 |
| 4.3 📊 | 未开始 | 8-10小时 | 中高 | Story 4.2后 |
| 4.4 🔄 | 85%完成 | 2-3小时 | 中 | Story 4.3时一起 |
| 4.5 ⏸️ | 未开始 | 10-12小时 | 低 | 暂缓 |
| 4.6 ⏸️ | 未开始 | 12-15小时 | 低 | 暂缓 |

**Epic 4核心功能完成度预测**: 
- 当前: 50% (Story 4.1完成)
- 完成Story 4.2后: 70%
- 完成Story 4.2+4.3后: 90%
- 完成Story 4.2+4.3+4.4完善后: 95%

---

## ✅ 立即行动建议

### 推荐: 开始Story 4.2 高级搜索

**命令**:
```bash
# 开始Story 4.2开发
# 用户确认后，我将执行以下步骤：

1. 创建Story文档: docs/stories/story-4-2-advanced-search.md
2. 更新Prisma Schema（SearchHistory, SavedSearch）
3. 实施Phase 1: 后端搜索服务
4. 实施Phase 2: 前端搜索UI
5. 集成测试
```

**请确认**:
- [ ] A. 立即开始Story 4.2 高级搜索（推荐）
- [ ] B. 先完善Story 4.4剩余15%
- [ ] C. 先讨论具体的技术细节
- [ ] D. 其他建议

---

**文档创建时间**: 2025-10-17  
**下次更新**: 完成Story 4.2后

