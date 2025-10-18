# Content Review Workbench Tests
**Story 3.1: 内容审核工作台测试文档**

## 📋 测试概览

本目录包含内容审核工作台的前端单元测试，涵盖：
- ✅ Store测试（状态管理）
- ✅ 组件测试（UI组件）
- ✅ Hooks测试（自定义钩子）

## 🧪 测试覆盖

### Store Tests (`contentReviewStore.test.ts`)
- **项目操作**: setItems, updateItemStatus, updateItemDetails, removeItem
- **选择操作**: toggleSelect, selectAll, clearSelection
- **筛选操作**: setFilters
- **编辑器操作**: openEditor, closeEditor
- **状态管理**: loading, error, stats

### Component Tests (`StatusBadge.test.tsx`)
- **渲染测试**: 所有5种状态正确渲染
- **尺寸测试**: sm, md, lg 三种尺寸
- **样式测试**: 颜色类正确应用
- **图标测试**: 显示/隐藏图标

### Hook Tests (`useKeyboardShortcuts.test.ts`)
- **基础功能**: 按键触发动作
- **修饰键**: Ctrl, Shift, Alt 组合键
- **禁用状态**: disabled 和 enabled 控制
- **输入忽略**: input/textarea 中不触发
- **清理**: 组件卸载时移除监听器

## 🚀 运行测试

### 运行所有测试
```bash
cd apps/web
pnpm test
```

### 运行特定测试
```bash
# 运行 Store 测试
pnpm test contentReviewStore

# 运行组件测试
pnpm test StatusBadge

# 运行 Hook 测试
pnpm test useKeyboardShortcuts
```

### 生成测试覆盖率报告
```bash
pnpm test --coverage
```

## 📦 测试依赖

测试使用以下工具：
- **Jest**: 测试运行器
- **@testing-library/react**: React 组件测试
- **@testing-library/react-hooks**: React Hooks 测试
- **@testing-library/user-event**: 用户交互模拟

## 📝 编写新测试

### 测试文件命名规范
- 文件名: `<ComponentName>.test.tsx` 或 `<hookName>.test.ts`
- 位置: 与源文件同级的 `__tests__` 目录

### 测试结构示例
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  describe('rendering', () => {
    it('should render correctly', () => {
      render(<MyComponent />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should handle click', () => {
      // Test implementation
    });
  });
});
```

## ✅ 测试最佳实践

1. **描述清晰**: 使用 describe 和 it 清晰描述测试意图
2. **AAA模式**: Arrange（准备）, Act（执行）, Assert（断言）
3. **独立性**: 每个测试应该独立运行
4. **清理**: 使用 beforeEach/afterEach 清理状态
5. **覆盖率**: 关注核心业务逻辑和边界情况

## 🐛 调试测试

### 查看测试输出
```bash
pnpm test --verbose
```

### 调试单个测试
```bash
pnpm test --watch <test-name>
```

### 使用调试器
在测试文件中添加 `debugger` 语句，然后运行：
```bash
node --inspect-brk node_modules/.bin/jest --runInBand <test-file>
```

## 📊 当前测试状态

| 组件/模块 | 测试状态 | 覆盖率 | 备注 |
|----------|---------|--------|------|
| contentReviewStore | ✅ 完成 | ~90% | 核心状态管理 |
| StatusBadge | ✅ 完成 | ~95% | UI组件 |
| useKeyboardShortcuts | ✅ 完成 | ~85% | 快捷键Hook |
| ContentCard | ⬜ 待添加 | - | 复杂组件 |
| ContentEditor | ⬜ 待添加 | - | 表单组件 |
| ReviewDashboard | ⬜ 待添加 | - | 主面板集成 |

## 🎯 后续测试计划

1. **组件测试扩展**:
   - ContentCard 交互测试
   - ContentEditor 表单验证测试
   - AdvancedFilters 筛选逻辑测试

2. **集成测试**:
   - ReviewDashboard 端到端流程
   - API service 集成测试

3. **性能测试**:
   - 大量数据渲染性能
   - 快捷键响应时间

## 🔗 相关文档

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Story 3.1 PRD](../../../../docs/stories/story-3-1-content-review-workbench.md)

