# Filter Rules Components

智能筛选规则管理组件集 - Story 3.2

## 组件列表

### 1. RulesManagement
规则管理主界面，提供规则列表、搜索、筛选和CRUD操作。

**使用方式：**
```tsx
import { RulesManagement } from '@/components/filter-rules';

function Page() {
  return <RulesManagement />;
}
```

**功能：**
- 规则列表展示（卡片式布局）
- 搜索和筛选（按类型、状态）
- 分页支持
- 快速操作（查看、编辑、测试、删除）
- 创建新规则

### 2. RuleEditor
规则编辑器模态框，支持创建、编辑和查看规则。

**Props：**
```typescript
interface RuleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  rule?: FilterRule | null;
  mode: 'create' | 'edit' | 'view';
}
```

**支持的规则类型：**
- KEYWORD_BOOST: 关键词加权
- KEYWORD_PENALTY: 关键词降权
- CATEGORY_BOOST: 分类加权
- CATEGORY_PENALTY: 分类降权
- SOURCE_WHITELIST: 来源白名单
- SOURCE_BLACKLIST: 来源黑名单
- CUSTOM: 自定义规则

### 3. KeywordManager
关键词管理组件，支持添加、删除、批量导入/导出关键词。

**Props：**
```typescript
interface KeywordManagerProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  maxKeywords?: number;
}
```

**功能：**
- 单个添加关键词
- 批量导入（逗号、分号、换行分隔）
- 导出为文本文件
- 最大数量限制
- 重复检查

### 4. WeightAdjuster
权重调整器，提供直观的权重配置界面。

**Props：**
```typescript
interface WeightAdjusterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  description?: string;
}
```

**权重说明：**
- < 1.0: 降低评分
- = 1.0: 不影响评分
- > 1.0: 提升评分
- = 0: 完全屏蔽

### 5. RuleCard
规则卡片组件，展示单个规则的信息和快速操作。

**Props：**
```typescript
interface RuleCardProps {
  rule: FilterRule;
  onEdit: (rule: FilterRule) => void;
  onView: (rule: FilterRule) => void;
  onTest: (rule: FilterRule) => void;
}
```

### 6. RuleStatusBadge
规则状态徽章。

**支持的状态：**
- DRAFT: 草稿
- ACTIVE: 生效中
- INACTIVE: 已停用
- ARCHIVED: 已归档

### 7. RuleTypeIcon
规则类型图标，提供视觉化的类型标识。

## 状态管理

使用 Zustand 进行状态管理，store 位于 `stores/filterRulesStore.ts`。

**主要状态：**
- rules: 规则列表
- currentRule: 当前选中的规则
- filters: 筛选条件
- pagination: 分页信息
- isEditorOpen: 编辑器开关
- testResults: 测试结果

## API 服务

API 服务层位于 `services/filterRulesService.ts`，提供所有后端API的封装。

**主要方法：**
- getRules(): 获取规则列表
- getRule(): 获取单个规则
- createRule(): 创建规则
- updateRule(): 更新规则
- deleteRule(): 删除规则
- testRule(): 测试规则效果
- publishRule(): 发布规则
- getRuleVersions(): 获取版本历史
- rollbackRule(): 回滚版本

## 路由

页面路由：`/filter-rules`

## 权限

所有规则管理操作需要 ADMIN 权限。

## 后续开发

### Phase 3: 规则测试与预览（待开发）
- RulePreview 组件
- 实时预览功能
- 测试结果展示

### Phase 4: 版本管理与回滚（待开发）
- RuleVersionControl 组件
- 版本对比
- A/B 测试

### Phase 5: 效果分析与报告（待开发）
- EffectAnalysis 组件
- 数据可视化
- 定时分析任务

### Phase 6: 测试与文档（待开发）
- 单元测试
- 集成测试
- API 文档

## 技术栈

- React 18
- Next.js 14
- TypeScript
- Tailwind CSS
- Zustand (状态管理)
- Axios (HTTP 客户端)
- Lucide React (图标)

