# 手工内容管理组件

Story 3.3: Manual Content Management

## 📦 组件列表

### 1. **ContentForm** - 内容表单组件
主要的内容创建表单，包含所有必要字段和验证。

**特性：**
- 标题、描述、正文（富文本）、URL 输入
- 分类和标签管理
- 审核状态选择
- 表单验证（Zod schema）
- 实时同步到 Zustand store

**使用示例：**
```tsx
import { ContentForm } from '@/components/content-management';

<ContentForm
  onSubmit={handleSubmit}
  isSubmitting={isSaving}
/>
```

---

### 2. **RichTextEditor** - 富文本编辑器
基于 React Quill 的富文本编辑器。

**特性：**
- 完整的文本格式化工具栏
- 标题、粗体、斜体、列表、链接、图片
- 代码块和引用块
- 响应式设计

**使用示例：**
```tsx
import { RichTextEditor } from '@/components/content-management';

<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="输入内容..."
  height="400px"
/>
```

---

### 3. **ContentPreview** - 内容预览组件
实时预览内容的最终展示效果。

**特性：**
- HTML 内容清理（DOMPurify）
- 状态徽章显示
- 元数据展示（分类、标签、日期）
- 响应式布局

**使用示例：**
```tsx
import { ContentPreview } from '@/components/content-management';

<ContentPreview formData={formData} />
```

---

### 4. **URLImporter** - URL 导入组件
从网页 URL 抓取内容的弹窗组件。

**特性：**
- URL 输入和验证
- 自动抓取标题、描述、正文
- 内容预览
- 应用到表单或直接创建

**使用示例：**
```tsx
import { URLImporter } from '@/components/content-management';

<URLImporter
  isOpen={showUrlImporter}
  onClose={() => setShowUrlImporter(false)}
  onImportSuccess={handleImportSuccess}
/>
```

---

### 5. **BatchImporter** - 批量导入组件
批量导入多个 URL 的弹窗组件。

**特性：**
- 多行 URL 输入
- 默认分类和标签设置
- 自动审核选项
- 实时进度跟踪
- 成功/失败统计
- 错误日志展示

**使用示例：**
```tsx
import { BatchImporter } from '@/components/content-management';

<BatchImporter
  isOpen={showBatchImporter}
  onClose={() => setShowBatchImporter(false)}
  onImportComplete={handleBatchComplete}
/>
```

---

### 6. **TemplateSelector** - 模板选择器
选择和应用内容模板的组件。

**特性：**
- 内置模板和自定义模板
- 模板预览和描述
- 一键应用模板到表单
- 自动填充分类和标签

**使用示例：**
```tsx
import { TemplateSelector } from '@/components/content-management';

<TemplateSelector
  onTemplateSelect={handleTemplateSelect}
/>
```

---

## 🗂️ Zustand Store

### `useContentManagementStore`

**状态：**
- `formData` - 表单数据
- `activeTab` - 当前标签页（'edit' | 'preview'）
- `templates` - 模板列表
- `selectedTemplateId` - 当前选中的模板
- `isImporting` - 导入状态
- `importedData` - 导入的数据
- `batchImportStatus` - 批量导入状态
- `validation` - 验证结果

**Actions：**
- `setFormData()` - 更新表单数据
- `resetForm()` - 重置表单
- `setActiveTab()` - 切换标签页
- `applyTemplate()` - 应用模板
- `setImportedData()` - 设置导入数据
- `setBatchImportStatus()` - 更新批量导入状态
- `setValidation()` - 设置验证结果

---

## 🌐 API 服务

### `contentManagementService`

**方法：**
- `createContent(input)` - 创建内容
- `importFromUrl(url, autoFill)` - 从 URL 导入
- `batchImportUrls(urls, options)` - 批量导入 URLs
- `getBatchImportStatus(batchId)` - 查询导入状态
- `validateContent(input)` - 验证内容
- `getTemplates(params)` - 获取模板列表
- `getBuiltInTemplates()` - 获取内置模板
- `createTemplate(input)` - 创建模板
- `updateTemplate(id, input)` - 更新模板
- `deleteTemplate(id)` - 删除模板

---

## 📝 使用流程

### 1. 手工创建内容
1. 访问 `/content-management/create`
2. 填写表单（可选使用模板）
3. 切换到预览查看效果
4. 点击"发布内容"提交

### 2. 从 URL 导入
1. 点击"URL导入"按钮
2. 输入网页 URL
3. 点击"抓取"
4. 选择"应用到表单"或"直接创建"

### 3. 批量导入
1. 点击"批量导入"按钮
2. 粘贴多个 URL（每行一个）
3. 设置默认分类和标签
4. 点击"开始导入"
5. 查看实时进度

### 4. 使用模板
1. 点击"使用模板"按钮
2. 选择内置或自定义模板
3. 模板内容自动填充到表单
4. 继续编辑或直接发布

---

## 🎨 样式说明

所有组件使用 Tailwind CSS 样式，确保：
- 响应式设计（移动端友好）
- 一致的颜色主题（蓝色为主色调）
- 清晰的视觉层次
- 流畅的过渡动画

---

## ⚙️ 配置要求

### 依赖包：
```json
{
  "react-quill": "^2.0.0",
  "dompurify": "^3.3.0",
  "react-hook-form": "^7.63.0",
  "zod": "^3.25.76",
  "@hookform/resolvers": "^3.10.0"
}
```

### 环境变量：
无需额外环境变量（API URL 自动检测）

---

## 🐛 故障排查

### 问题：富文本编辑器不显示
**解决方案：** React Quill 使用动态导入（`next/dynamic`），确保 `ssr: false`

### 问题：HTML 内容被清理
**解决方案：** DOMPurify 默认只允许安全标签，可在 `ContentPreview.tsx` 中调整 `ALLOWED_TAGS`

### 问题：API 请求失败
**解决方案：** 检查 API 服务器是否运行，确认 token 已正确存储在 localStorage

---

## 📚 相关文档

- [Story 3.3 完整文档](../../../../docs/stories/story-3-3-manual-content-management.md)
- [后端 API 文档](../../../../docs/api-documentation.md)
- [测试脚本](../../../../apps/api/test-story-3-3-manual-content.js)

