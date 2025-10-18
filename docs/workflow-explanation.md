# 内容审核工作流程说明

## 📋 当前设计的工作流程

### **状态流转路径**

```
手工创建 → DRAFT (草稿)
         ↓
    编辑完善内容
         ↓
  PENDING_REVIEW (待审核) ← 需要手动改状态
         ↓
    审核人员审核
         ↓
    ├─→ APPROVED (已通过)
    └─→ REJECTED (已拒绝)
         ↓
    PUBLISHED (已发布)
```

---

## 🤔 问题分析

### **问题1：草稿状态的用途**

**当前情况：**
- 手工创建的内容默认为 `DRAFT` 状态
- 草稿状态的内容不会出现在审核工作台（`/review`）
- 无法直接从草稿状态进行审核

**设计意图：**
1. **草稿 = 未完成的内容**
   - 允许作者分多次编辑
   - 保存进度，稍后继续
   - 不打扰审核人员

2. **提交审核前的质量保证**
   - 作者自行检查内容质量
   - 确保标题、描述、正文完整
   - 检查链接和分类正确

3. **权限分离**
   - 作者：可以编辑草稿
   - 审核人员：只处理提交的内容
   - 避免审核队列被未完成内容污染

---

## ✅ 优化方案

### **方案 A：添加"提交审核"功能**

**在内容编辑页面添加状态切换：**

```
草稿 → [提交审核按钮] → 待审核
```

**实现位置：**
- `ContentEditor` 组件添加状态选择下拉框
- `/content/[id]` 详情页添加"提交审核"按钮

**优点：**
- 工作流程清晰
- 作者主动提交
- 审核队列干净

---

### **方案 B：扩展审核工作台筛选**

**在审核工作台添加"草稿"筛选：**

```
状态筛选: [全部] [草稿] [待审核] [已通过] [已拒绝]
```

**实现位置：**
- `ReviewDashboard` 添加草稿状态筛选
- 允许审核人员查看所有状态

**优点：**
- 灵活性高
- 可以查看草稿
- 紧急情况下可快速处理

---

### **方案 C：自动提交（简化版）**

**手工创建时直接设为"待审核"：**

```
手工创建 → PENDING_REVIEW (待审核)
```

**实现位置：**
- 修改 `content-management.service.ts`
- 默认状态改为 `PENDING_REVIEW`

**优点：**
- 最简单
- 立即可审核
- 无需额外操作

**缺点：**
- 失去草稿功能
- 无法保存进度

---

## 🚀 推荐实现：方案 A + B 组合

### **第1步：在详情页添加状态切换**

位置：`apps/web/src/app/content/[id]/page.tsx`

```tsx
{/* 状态管理卡片 */}
<Card>
  <CardHeader>
    <CardTitle>状态管理</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* 当前状态 */}
      <div>
        <label className="text-sm font-medium text-gray-700">当前状态:</label>
        <StatusBadge status={content.reviewStatus} />
      </div>

      {/* 状态操作按钮 */}
      {content.reviewStatus === 'DRAFT' && (
        <Button onClick={handleSubmitForReview}>
          📤 提交审核
        </Button>
      )}

      {content.reviewStatus === 'PENDING_REVIEW' && (
        <div className="flex gap-2">
          <Button onClick={handleApprove}>✅ 通过</Button>
          <Button onClick={handleReject}>❌ 拒绝</Button>
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

### **第2步：扩展审核工作台筛选**

位置：`apps/web/src/components/review/ReviewDashboard.tsx`

```tsx
{/* 状态筛选 */}
<select value={status} onChange={(e) => setStatus(e.target.value)}>
  <option value="">全部状态</option>
  <option value="DRAFT">草稿</option>
  <option value="PENDING_REVIEW">待审核</option>
  <option value="APPROVED">已通过</option>
  <option value="REJECTED">已拒绝</option>
  <option value="PUBLISHED">已发布</option>
</select>
```

---

## 📊 工作流程对比

### **优化前：**
```
创建内容 → DRAFT → ❌ 卡住（无法进入审核）
```

### **优化后：**
```
创建内容 → DRAFT → [提交审核按钮] → PENDING_REVIEW → 审核 → APPROVED/REJECTED
```

或

```
创建内容 → DRAFT → [审核人员可在工作台筛选查看] → 直接审核
```

---

## 🎯 立即可行的快速修复

### **最小改动方案：修改默认状态**

**文件：** `apps/api/src/services/content-management.service.ts`

```typescript
// 第 89 行附近
const content = await prisma.content.create({
  data: {
    // ...其他字段
    reviewStatus: input.reviewStatus || 'PENDING_REVIEW', // ← 改这里
    // 原来是: reviewStatus: input.reviewStatus || 'DRAFT',
  }
});
```

**影响：**
- 手工创建的内容立即可审核
- 无需额外操作
- 5分钟修复

---

## 📝 总结

**草稿状态的作用：**
1. ✅ 保存未完成的内容
2. ✅ 允许多次编辑
3. ✅ 避免审核队列混乱

**当前问题：**
- ❌ 缺少从草稿到待审核的路径
- ❌ 草稿无法被审核人员看到

**解决方案优先级：**
1. **立即修复**：改默认状态为 `PENDING_REVIEW`（2分钟）
2. **短期优化**：添加审核工作台草稿筛选（30分钟）
3. **长期完善**：实现完整的状态流转按钮（2小时）

---

**您希望我实现哪个方案？**
- A: 立即修复（改默认状态）
- B: 添加状态切换按钮
- C: 扩展工作台筛选
- D: 全部实现

