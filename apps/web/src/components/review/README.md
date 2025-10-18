# Content Review Workbench
**Story 3.1: 内容审核工作台组件库**

## 📦 组件概览

这是一个完整的内容审核工作台系统，包含10+个React组件，提供强大的内容审核和管理功能。

## 🎯 主要功能

- ✅ **内容审核**: 批准、拒绝、编辑内容
- ✅ **批量操作**: 支持多选批量处理
- ✅ **高级筛选**: 按状态、分类、来源、日期筛选
- ✅ **审核日志**: 完整的操作历史记录
- ✅ **统计分析**: 审核数据可视化
- ✅ **快捷键**: 键盘快捷操作提升效率
- ✅ **自动刷新**: 60秒自动更新数据

## 📂 组件结构

```
review/
├── ReviewDashboard.tsx        # 主面板（660行）
├── ContentCard.tsx            # 内容卡片（230行）
├── ContentEditor.tsx          # 内容编辑器（380行）
├── StatusBadge.tsx            # 状态标签（110行）
├── ActionButtons.tsx          # 操作按钮（180行）
├── AdvancedFilters.tsx        # 高级筛选（300行）
├── AuditLogViewer.tsx         # 审核日志（240行）
├── StatsPanel.tsx             # 统计面板（270行）
├── index.ts                   # 导出文件
└── __tests__/                 # 测试文件
    ├── StatusBadge.test.tsx
    └── README.md
```

## 🚀 快速开始

### 基础使用

```tsx
import { ReviewDashboard } from '@/components/review';

export default function ReviewPage() {
  return <ReviewDashboard />;
}
```

### 独立组件使用

```tsx
import { ContentCard, StatusBadge, ActionButtons } from '@/components/review';

// 内容卡片
<ContentCard
  content={contentItem}
  selected={false}
  onApprove={(id) => console.log('Approve', id)}
  onReject={(id) => console.log('Reject', id)}
  onEdit={(id) => console.log('Edit', id)}
/>

// 状态标签
<StatusBadge status="APPROVED" size="md" showIcon={true} />

// 操作按钮
<ActionButtons
  onApprove={() => {}}
  onReject={() => {}}
  onEdit={() => {}}
  size="md"
/>
```

## ⌨️ 快捷键

| 按键 | 功能 |
|------|------|
| `A` | 批准当前内容 |
| `R` | 拒绝当前内容 |
| `E` | 编辑当前内容 |
| `↑` | 上一项 |
| `↓` | 下一项 |
| `F` | 打开筛选面板 |
| `Shift + ?` | 显示快捷键帮助 |

## 🎨 主题定制

组件使用 Tailwind CSS，可通过配置文件定制主题：

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { /* 主色调 */ },
        success: { /* 成功色 */ },
        error: { /* 错误色 */ },
        warning: { /* 警告色 */ },
      },
    },
  },
};
```

## 📡 API 集成

组件使用 `contentReviewService` 与后端交互：

```typescript
import { contentReviewService } from '@/services/contentReviewService';

// 获取内容列表
const data = await contentReviewService.getList({
  page: 1,
  limit: 20,
  filters: {
    status: ['PENDING_REVIEW'],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
});

// 更新状态
await contentReviewService.updateStatus(contentId, 'APPROVE');

// 批量操作
await contentReviewService.batchUpdateStatus(
  ['id1', 'id2'],
  'APPROVE'
);
```

## 🔧 状态管理

使用 Zustand 进行状态管理：

```typescript
import { useContentReviewStore } from '@/stores/contentReviewStore';

function MyComponent() {
  const {
    items,
    selectedIds,
    filters,
    loading,
    setFilters,
    toggleSelect,
  } = useContentReviewStore();

  // 使用状态...
}
```

## 📊 组件详解

### ReviewDashboard
主面板组件，集成所有功能：
- 内容列表展示
- 批量操作工具栏
- 统计卡片
- 筛选面板
- 分页控制

### ContentCard
内容卡片组件，显示单个内容：
- 标题、描述、来源
- 状态标签和评分
- 快速操作按钮
- 选择框

### ContentEditor
内容编辑器，侧边栏模态框：
- 完整表单字段
- 实时预览
- 表单验证（Zod）
- 保存/取消操作

### StatusBadge
状态标签组件：
- 5种状态：DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED
- 3种尺寸：sm, md, lg
- 图标+文本

### ActionButtons
操作按钮组：
- 通过、拒绝、发布、编辑、查看
- 加载状态
- 水平/垂直布局

### AdvancedFilters
高级筛选面板：
- 按分类、来源筛选
- 日期范围选择
- 排序设置
- 可折叠区域

### AuditLogViewer
审核日志查看器：
- 时间轴视图
- 详细变更记录
- 操作人信息
- 可展开详情

### StatsPanel
统计面板：
- 总体统计卡片
- 状态分布图
- 审核员排行
- 分类统计

## 🧪 测试

```bash
# 运行测试
pnpm test

# 查看覆盖率
pnpm test --coverage
```

详见 [测试文档](./__tests__/README.md)

## 🎯 使用场景

### 场景1: 基础审核流程
```typescript
// 1. 获取待审核列表
// 2. 浏览内容（使用快捷键↑↓）
// 3. 审核决策（按A批准或R拒绝）
// 4. 添加备注（可选）
```

### 场景2: 批量处理
```typescript
// 1. 多选内容（点击复选框）
// 2. 点击"批量通过"或"批量拒绝"
// 3. 确认操作
```

### 场景3: 高级筛选
```typescript
// 1. 点击"高级筛选"按钮
// 2. 设置筛选条件（分类、来源、日期）
// 3. 应用筛选
// 4. 查看筛选结果
```

## 📈 性能优化

- ✅ 使用 `React.memo` 避免不必要的重渲染
- ✅ 虚拟滚动（大列表时可启用）
- ✅ 防抖/节流优化搜索和筛选
- ✅ 乐观更新提升用户体验

## 🔐 权限控制

组件需要 EDITOR 或 ADMIN 角色：

```typescript
import { RoleGuard } from '@/components/auth';

<RoleGuard requiredRoles={['EDITOR', 'ADMIN']}>
  <ReviewDashboard />
</RoleGuard>
```

## 🐛 常见问题

### Q: 快捷键不工作？
A: 检查是否在输入框中，快捷键在输入框中会被禁用。

### Q: 自动刷新如何暂停？
A: 点击顶部工具栏的暂停/播放按钮。

### Q: 如何自定义刷新间隔？
A: 在 ReviewDashboard 中修改 `autoRefresh.interval` 参数。

## 📚 相关文档

- [Story 3.1 完整文档](../../../../docs/stories/story-3-1-content-review-workbench.md)
- [API 文档](../../../../docs/api-documentation.md)
- [测试文档](./__tests__/README.md)

## 🤝 贡献指南

1. 保持组件职责单一
2. 添加 TypeScript 类型定义
3. 编写单元测试
4. 遵循 ESLint 规则
5. 更新相关文档

## 📝 更新日志

- **v1.5** (2025-10-14): Phase 5完成 - 快捷键+自动刷新
- **v1.4** (2025-10-14): Phase 3-4完成 - 高级筛选+日志+统计
- **v1.3** (2025-10-14): Phase 2完成 - 所有核心组件
- **v1.1** (2025-10-14): Phase 1完成 - 后端API
- **v1.0** (2025-10-14): 项目初始化

