# AI数据库日志记录修复

## 📋 问题描述

在Story 2.1和2.2完成后，发现以下两个数据库表一直是空的：
1. **`ai_usage_logs`** - AI服务使用日志表
2. **`gemini_news_queries`** - Gemini新闻查询历史表

## 🔍 根本原因

### 1. `ai_usage_logs` 表为空
**原因：** `BaseAIProvider.recordUsage()` 方法只是打印到控制台，没有写入数据库

**原代码：**
```typescript
protected async recordUsage(...): Promise<void> {
  console.log(`AI Usage - Provider: ${this.name}, ...`);
  // ❌ 只有日志输出，没有数据库操作
}
```

### 2. `gemini_news_queries` 表为空
**原因：** `GeminiNewsService.recordQuery()` 方法只存储在内存 Map 中，没有持久化到数据库

**原代码：**
```typescript
private recordQuery(record: QueryRecord): void {
  this.queryHistory.set(record.id, record);
  // ❌ 只存储在内存中，服务重启后数据丢失
}
```

## ✅ 修复方案

### 修复1：实现 `ai_usage_logs` 数据库记录

**文件：** `apps/api/src/services/ai/base-ai-provider.ts`

**改动：**
```typescript
protected async recordUsage(
  operation: string,
  inputTokens: number,
  outputTokens: number,
  responseTime: number,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    const { db } = await import('@tech-news-platform/database');
    
    // 计算成本
    const costPerToken = this.name === 'gemini' ? 0.000001 : 0.000003;
    const costUsd = (inputTokens + outputTokens) * costPerToken;
    
    // ✅ 写入数据库
    await db.aiUsageLog.create({
      data: {
        configId: `env-${this.name}`,
        provider: this.name.toUpperCase() as any,
        operation,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd,
        responseTimeMs: responseTime,
        success,
        errorMessage
      }
    });
    
    logger.info(`AI使用记录已保存`, { 
      provider: this.name, 
      operation, 
      totalTokens: inputTokens + outputTokens,
      costUsd: costUsd.toFixed(6)
    });
  } catch (error) {
    // 记录失败不应该影响主流程
    logger.error(`保存AI使用记录失败`, { error, provider: this.name, operation });
  }
}
```

**特性：**
- ✅ 自动计算成本（Gemini: $0.000001/token, Claude: $0.000003/token）
- ✅ 记录所有Token使用情况（输入、输出、总计）
- ✅ 记录响应时间和成功/失败状态
- ✅ 失败不影响主流程（try-catch保护）

### 修复2：实现 `gemini_news_queries` 数据库记录

**文件：** `apps/api/src/services/gemini-news.service.ts`

**改动：**
```typescript
private async recordQuery(record: QueryRecord): Promise<void> {
  // 内存中保存（保持原有功能）
  this.queryHistory.set(record.id, record);
  
  if (this.queryHistory.size > 100) {
    const oldestKey = Array.from(this.queryHistory.keys())[0];
    this.queryHistory.delete(oldestKey);
  }
  
  // ✅ 写入数据库
  try {
    await db.geminiNewsQuery.create({
      data: {
        queryType: record.queryType,
        prompt: GEMINI_QUERY_PROMPTS[record.queryType].substring(0, 500),
        response: null,
        totalFetched: record.resultCount,
        totalSaved: record.resultCount,
        success: record.success,
        errorMessage: record.errorMessage,
        tokensUsed: null, // 可后续补充
        costUsd: null // 可后续补充
      }
    });
    
    logger.debug('查询历史已保存到数据库', { 
      queryType: record.queryType, 
      success: record.success,
      resultCount: record.resultCount
    });
  } catch (error) {
    logger.error('保存查询历史到数据库失败', { error, record });
  }
}
```

**改动调用处：**
```typescript
// 修改前：同步调用
this.recordQuery({...});

// 修改后：异步调用，不阻塞主流程
this.recordQuery({...}).catch(err => logger.error('记录查询历史失败', { err }));
```

**特性：**
- ✅ 同时保持内存缓存（快速查询）和数据库持久化
- ✅ 记录查询类型、提示词、获取/保存数量
- ✅ 记录成功/失败状态和错误信息
- ✅ 异步写入，不阻塞主流程

## 🧪 验证方法

### 方法1：运行测试脚本
```bash
cd apps/api
node test-db-logging.js
```

**脚本会：**
1. 登录系统
2. 触发一次Gemini新闻查询（写入 `gemini_news_queries`）
3. 调用AI文本生成服务（写入 `ai_usage_logs`）
4. 验证两个表的数据

### 方法2：手动触发并查询

**触发Gemini查询：**
```bash
curl -X POST http://localhost:3001/api/gemini-news/trigger-query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "tech_news"}'
```

**查询数据库：**
```sql
-- 查看AI使用日志（最新5条）
SELECT * FROM ai_usage_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- 查看Gemini查询历史（最新5条）
SELECT * FROM gemini_news_queries 
ORDER BY created_at DESC 
LIMIT 5;
```

### 方法3：使用Prisma Studio
```bash
cd packages/database
npx prisma studio
```

然后查看 `ai_usage_logs` 和 `gemini_news_queries` 表。

## 📊 预期结果

### `ai_usage_logs` 表将记录：
- **每次AI调用**的详细信息
- 包括：文本生成、摘要、内容分析等操作
- 自动计算：Token消耗、成本、响应时间

**示例数据：**
| provider | operation | total_tokens | cost_usd | response_time_ms | success |
|----------|-----------|--------------|----------|------------------|---------|
| GEMINI   | generate  | 125          | 0.000125 | 1234             | true    |
| CLAUDE   | summarize | 89           | 0.000267 | 987              | true    |

### `gemini_news_queries` 表将记录：
- **每次Gemini新闻查询**的历史
- 包括：科技新闻、AI新闻、股票新闻查询
- 记录：获取数量、保存数量、成功状态

**示例数据：**
| query_type  | total_fetched | total_saved | success | created_at          |
|-------------|---------------|-------------|---------|---------------------|
| tech_news   | 5             | 5           | true    | 2025-10-08 10:30:00 |
| ai_news     | 3             | 3           | true    | 2025-10-08 11:00:00 |
| stock_news  | 0             | 0           | false   | 2025-10-08 11:30:00 |

## 🎯 影响范围

### 自动触发记录的场景：

1. **`ai_usage_logs` 自动记录：**
   - ✅ 调用 `/api/ai/generate-text`
   - ✅ 调用 `/api/ai/summarize`
   - ✅ 调用 `/api/ai/analyze`
   - ✅ Gemini新闻服务内部调用AI

2. **`gemini_news_queries` 自动记录：**
   - ✅ 手动触发 `/api/gemini-news/trigger-query`
   - ✅ 定时任务自动触发（每天执行）
   - ✅ 无论成功或失败都会记录

## 📝 注意事项

1. **成本计算是简化的**
   - 当前使用固定价格：Gemini $0.000001/token, Claude $0.000003/token
   - 实际价格应根据模型版本和定价策略调整

2. **提示词截取**
   - `gemini_news_queries.prompt` 字段只存储前500字符
   - 避免存储过大文本影响性能

3. **日志记录失败不影响主流程**
   - 所有数据库写入都用 try-catch 包裹
   - 失败只会打印错误日志，不会中断业务逻辑

4. **性能考虑**
   - 数据库写入是异步的
   - 使用 `.catch()` 确保不阻塞主流程

## ✅ 完成状态

- ✅ `base-ai-provider.ts` 修复完成
- ✅ `gemini-news.service.ts` 修复完成
- ✅ 编译通过
- ✅ 测试脚本创建
- ✅ 代码已提交到GitHub (commit: a139d5f)

## 🚀 后续优化建议

1. **增强成本计算**
   - 根据实际模型定价更新成本计算逻辑
   - 支持不同模型的差异化定价

2. **补充Token信息**
   - 在 `gemini_news_queries` 中记录实际Token使用量
   - 从AI响应中提取Token信息并保存

3. **添加数据分析功能**
   - 创建API查询Token使用统计
   - 创建成本分析和优化建议

4. **数据清理策略**
   - 定期清理过期日志（如：30天前的记录）
   - 归档重要查询历史

---

**修复日期：** 2025-10-08  
**相关Story：** Story 2.1, Story 2.2  
**提交记录：** [a139d5f] fix: Implement database logging for AI usage and Gemini queries

