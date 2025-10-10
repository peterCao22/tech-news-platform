# API密钥使用情况总结

## 📋 .env 文件中的5个API密钥

根据你的 `.env` 文件，配置了以下5个API密钥：

```env
ALPHA_VANTAGE_API_KEY="KZLKH420TRGXBLPH"
FINNHUB_IO_API_KEY="d3iceahr01qn6oio05a0d3iceahr01qn6oio05ag"
POLYGON_IO_API_KEY="KiW0KO78gsys4aDhNuEj6HHUDteTPMb9"
GEMINI_API_KEY="AIzaSyD0i4ndQqI_BCWTGDe8VirckKGdFkDc1-g"
CLAUDE_API_KEY="sk-ant-api03-PSoAKlFzcvcz9OcaIem7N..."
```

---

## ✅ 正在使用的API密钥（5个）

### 1. **GEMINI_API_KEY** ✅
**状态：** 正在使用  
**用途：**
- **文本向量化（Embedding）**：`apps/api/src/services/embedding.service.ts`
  - 计算文本相似度
  - 内容去重检测
  - 向量搜索
- **AI服务记录**：`apps/api/src/services/ai/base-ai-provider.ts`
  - 自动创建AI配置记录

**代码位置：**
```typescript
// apps/api/src/services/embedding.service.ts
this.apiKey = process.env.GEMINI_API_KEY || null;
```

---

### 2. **CLAUDE_API_KEY** ✅
**状态：** 正在使用  
**用途：**
- **每日TOP10趋势洞察生成**：`apps/api/src/services/daily-top10.service.ts`
  - 使用Claude AI分析TOP10新闻
  - 生成趋势洞察报告（200字以内）

**代码位置：**
```typescript
// apps/api/src/services/daily-top10.service.ts (第417行)
const claudeConfig = {
  apiKey: process.env.CLAUDE_API_KEY || '',
  model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  name: 'Claude AI - Daily TOP10'
};
```

---

### 3. **ALPHA_VANTAGE_API_KEY** ✅
**状态：** 正在使用（通过数据库配置）  
**用途：**
- **金融新闻获取**：`apps/api/src/services/alpha-vantage.service.ts`
  - 科技新闻（tech news）
  - AI新闻（ai news）
  - 公司新闻（company news for GOOGL, MSFT, AAPL等）

**使用方式：**
```
环境变量 → 数据库配置表(api_configurations) → ApiConfigurationService → AlphaVantageClient
```

**定时任务：**
- 开发环境：每30分钟执行一次
- 生产环境：每小时执行一次

**调用链：**
```
SchedulerService.scheduleAlphaVantageFetch()
  → alphaVantageService.executeFullFetchTask()
    → ApiConfigurationService.getAlphaVantageClient()
      → 从数据库读取配置（包含API Key）
        → AlphaVantageClient(apiKey)
```

---

### 4. **FINNHUB_IO_API_KEY** ✅
**状态：** 正在使用（通过数据库配置）  
**用途：**
- **金融市场新闻**：`apps/api/src/services/finnhub.service.ts`
  - 科技新闻
  - AI新闻
  - 公司新闻

**使用方式：**
```
环境变量 → 数据库配置表(api_configurations) → ApiConfigurationService → FinnhubClient
```

**定时任务：**
- 开发环境：每15分钟执行一次
- 生产环境：每30分钟执行一次

**调用链：**
```
SchedulerService.scheduleFinnhubFetch()
  → finnhubService.executeFullFetchTask()
    → ApiConfigurationService.getFinnhubClient()
      → 从数据库读取配置（包含API Key）
        → FinnhubClient(apiKey)
```

---

### 5. **POLYGON_IO_API_KEY** ✅
**状态：** 正在使用（通过数据库配置）  
**用途：**
- **股票市场新闻**：`apps/api/src/services/polygon.service.ts`
  - 科技公司新闻
  - 市场数据
  - 公司新闻（GOOGL, MSFT, AAPL等）

**使用方式：**
```
环境变量 → 数据库配置表(api_configurations) → ApiConfigurationService → PolygonClient
```

**定时任务：**
- 开发环境：每20分钟执行一次
- 生产环境：每45分钟执行一次

**调用链：**
```
SchedulerService.schedulePolygonFetch()
  → polygonService.executeFullFetchTask()
    → ApiConfigurationService.getPolygonClient()
      → 从数据库读取配置（包含API Key）
        → PolygonClient(apiKey)
```

---

## 🔄 API密钥的两种使用模式

### 模式1：直接从环境变量读取（GEMINI、CLAUDE）
```typescript
// 优点：简单直接，适合AI服务
// 缺点：无法动态修改，需要重启服务

const apiKey = process.env.GEMINI_API_KEY;
const client = new GeminiClient(apiKey);
```

**使用场景：**
- AI服务（Gemini Embedding、Claude Analysis）
- 配置固定，不需要频繁更改

---

### 模式2：通过数据库配置读取（Alpha Vantage、Finnhub、Polygon）
```typescript
// 优点：支持多配置、动态切换、加密存储、健康检查
// 缺点：需要先在数据库中配置

const config = await ApiConfigurationService.getConfigurationsByProvider('alpha_vantage');
const client = new AlphaVantageClient(config.apiKey);
```

**使用场景：**
- 第三方数据API（新闻、金融数据）
- 需要管理多个API配置
- 需要运行时切换配置

**数据库表结构：**
```sql
-- api_configurations 表
{
  id: string,
  provider: string,  -- 'alpha_vantage' | 'finnhub' | 'polygon'
  name: string,
  apiKey: string,    -- 加密存储
  baseUrl: string,
  status: string,    -- 'ACTIVE' | 'INACTIVE' | 'ERROR'
  authType: string,  -- 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH'
  ...
}
```

---

## 📊 定时任务执行频率总览

从你的控制台日志可以看到：

| 任务 | 开发环境频率 | 生产环境频率 | API使用 |
|------|------------|------------|---------|
| RSS源抓取 | 每5分钟 | 每15分钟 | 无 |
| Alpha Vantage | 每30分钟 | 每小时 | ✅ ALPHA_VANTAGE_API_KEY |
| Finnhub | 每15分钟 | 每30分钟 | ✅ FINNHUB_IO_API_KEY |
| Polygon | 每20分钟 | 每45分钟 | ✅ POLYGON_IO_API_KEY |
| Gemini新闻 | 每6小时 | 每天3次 | ✅ GEMINI_API_KEY |
| Daily TOP10 | 每2小时 | 每天1次 | ✅ CLAUDE_API_KEY |
| 清理任务 | 凌晨2点 | 凌晨2点 | 无 |

---

## 🎯 总结

### ✅ 所有5个API密钥都在使用中！

1. **GEMINI_API_KEY**：用于文本向量化和相似度计算
2. **CLAUDE_API_KEY**：用于生成TOP10趋势洞察报告
3. **ALPHA_VANTAGE_API_KEY**：通过数据库配置，获取金融新闻
4. **FINNHUB_IO_API_KEY**：通过数据库配置，获取市场新闻
5. **POLYGON_IO_API_KEY**：通过数据库配置，获取股票新闻

### 📝 注意事项

1. **金融API（Alpha Vantage、Finnhub、Polygon）**需要先在数据库中配置才能使用
   - 可以通过API管理界面添加配置
   - 也可以通过种子脚本（seed）自动初始化

2. **AI API（Gemini、Claude）**直接从环境变量读取
   - 无需数据库配置
   - 修改后需要重启服务

3. **API调用成本监控**
   - 所有AI服务调用都会记录到 `ai_usage_logs` 表
   - 金融API调用会记录到 `api_usage_logs` 表

---

## 🚀 下一步建议

1. **检查数据库配置**：
   ```sql
   SELECT * FROM api_configurations WHERE provider IN ('alpha_vantage', 'finnhub', 'polygon');
   ```

2. **验证API配置是否正确**：
   - 访问 `/api/api-configurations` 查看配置状态
   - 测试各API连接性

3. **监控API使用情况**：
   - 查看 `ai_usage_logs` 表了解AI服务使用
   - 查看 `api_usage_logs` 表了解金融API使用

---

**文档创建时间**：2025-10-10  
**状态**：✅ 所有API密钥都已正确配置并在使用中

