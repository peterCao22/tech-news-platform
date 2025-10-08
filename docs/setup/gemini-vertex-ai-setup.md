# Gemini Vertex AI 配置指南

本指南介绍如何配置 Google Gemini AI，支持两种方式：**API Key** 和 **Vertex AI**。

---

## 📌 配置方式对比

| 特性 | API Key | Vertex AI |
|------|---------|-----------|
| **配置难度** | 简单 | 中等 |
| **适用场景** | 开发测试 | 生产环境 |
| **费用** | 免费额度有限 | 按使用付费 |
| **功能** | 基础功能 | 完整功能 |
| **配额管理** | 有限 | 灵活可扩展 |
| **企业支持** | 否 | 是 |

---

## 🔑 方式1: 使用 API Key（快速开始）

### 步骤 1: 获取 API Key

1. 访问 **Google AI Studio**: https://makersuite.google.com/app/apikey
2. 使用 Google 账号登录
3. 点击 **"Create API Key"**
4. 选择一个 Google Cloud 项目（或创建新项目）
5. 复制生成的 API Key

### 步骤 2: 配置环境变量

在项目根目录的 `.env` 文件中添加：

```bash
# Google Gemini API Key
GEMINI_API_KEY=AIzaSyC...your_actual_api_key_here

# Gemini 模型配置
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
GEMINI_TIMEOUT=30000
```

### 步骤 3: 测试配置

重启 API 服务：

```bash
cd apps/api
pnpm dev
```

查看日志确认 Gemini 已初始化：
```
✓ Gemini提供商已初始化 { mode: 'API Key' }
```

---

## 🏢 方式2: 使用 Vertex AI（生产推荐）

### 前置要求

- Google Cloud 账号
- 已启用计费的 Google Cloud 项目
- 安装 Google Cloud SDK（可选）

### 步骤 1: 创建 Google Cloud 项目

1. 访问 **Google Cloud Console**: https://console.cloud.google.com/
2. 点击项目下拉菜单 → **"New Project"**
3. 输入项目名称（如：`my-tech-news-platform`）
4. 记录项目 ID（如：`my-tech-news-platform-123456`）
5. 点击 **"Create"**

### 步骤 2: 启用 Vertex AI API

1. 在 Google Cloud Console 中，导航到：
   - **"APIs & Services"** → **"Library"**
2. 搜索 **"Vertex AI API"**
3. 点击 **"Enable"**
4. 同时启用 **"Cloud AI Platform API"**

### 步骤 3: 创建服务账号

1. 导航到 **"IAM & Admin"** → **"Service Accounts"**
2. 点击 **"Create Service Account"**
3. 填写服务账号信息：
   - **Name**: `gemini-api-access`
   - **Description**: `Service account for Gemini AI API access`
4. 点击 **"Create and Continue"**

### 步骤 4: 授予权限

为服务账号授予以下角色：

- **Vertex AI User** (`roles/aiplatform.user`)
- 或 **AI Platform Admin** (`roles/ml.admin`) （如需更多权限）

选择方式：
1. 在 "Grant this service account access to project" 部分
2. 点击 **"Select a role"**
3. 搜索并选择 **"Vertex AI User"**
4. 点击 **"Continue"** → **"Done"**

### 步骤 5: 生成 JSON 密钥文件

1. 在服务账号列表中，点击刚创建的服务账号
2. 切换到 **"Keys"** 标签
3. 点击 **"Add Key"** → **"Create new key"**
4. 选择 **"JSON"** 格式
5. 点击 **"Create"**
6. JSON 文件会自动下载到你的电脑

**⚠️ 重要**：妥善保管这个 JSON 文件，不要提交到 Git 仓库！

### 步骤 6: 配置环境变量

#### 方式 A: 设置文件路径（推荐）

将 JSON 密钥文件放在项目外的安全位置，然后在 `.env` 文件中配置：

```bash
# Vertex AI 认证（使用服务账号 JSON 密钥文件）
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json

# Google Cloud 项目配置
GOOGLE_PROJECT_ID=my-tech-news-platform-123456
GOOGLE_LOCATION=us-central1

# Gemini 模型配置
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
GEMINI_TIMEOUT=30000
```

#### 方式 B: 在项目内（不推荐，仅用于开发）

如果必须在项目内存放密钥文件：

1. 在项目根目录创建 `secrets` 文件夹（已在 `.gitignore` 中）
2. 将 JSON 文件移动到 `secrets/` 目录
3. 配置相对路径：

```bash
GOOGLE_APPLICATION_CREDENTIALS=./secrets/service-account-key.json
GOOGLE_PROJECT_ID=my-tech-news-platform-123456
GOOGLE_LOCATION=us-central1
```

### 步骤 7: 选择区域

Vertex AI 支持多个区域，选择离你最近的：

| 区域 | 位置 | 代码 |
|------|------|------|
| 美国中部 | Iowa | `us-central1` |
| 美国东部 | South Carolina | `us-east1` |
| 美国西部 | Oregon | `us-west1` |
| 欧洲西部 | Belgium | `europe-west4` |
| 亚太东北 | Tokyo | `asia-northeast1` |
| 亚太东南 | Singapore | `asia-southeast1` |

在 `.env` 中设置：

```bash
GOOGLE_LOCATION=asia-northeast1  # 如果你在亚洲地区
```

### 步骤 8: 测试配置

重启 API 服务：

```bash
cd apps/api
pnpm dev
```

查看日志确认 Vertex AI 模式已启用：

```
✓ Gemini提供商已初始化 {
  mode: 'Vertex AI',
  projectId: 'my-tech-news-platform-123456',
  location: 'us-central1'
}
```

---

## 🧪 测试 Gemini 配置

### 方式 1: 使用测试脚本

```bash
cd apps/api
node test-story-2-1-qa.js
```

### 方式 2: 使用 API 端点

```bash
# 健康检查
curl http://localhost:3001/api/ai/health \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# 测试聊天
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, Gemini!"}
    ]
  }'
```

### 方式 3: 查看日志

在 API 服务日志中查找：

```
✅ 成功的配置:
  - "Gemini提供商已初始化"
  - "AI服务管理器初始化完成"

❌ 配置问题:
  - "Gemini API密钥或Vertex AI配置未设置"
  - "Gemini健康检查失败"
```

---

## 🔧 故障排除

### 问题 1: "Gemini健康检查失败"

**可能原因**:
- API Key 无效或过期
- Vertex AI 未启用
- 服务账号权限不足
- 网络连接问题

**解决方案**:
```bash
# 1. 验证 API Key
echo $GEMINI_API_KEY

# 2. 验证 Vertex AI 配置
echo $GOOGLE_PROJECT_ID
echo $GOOGLE_APPLICATION_CREDENTIALS

# 3. 检查服务账号权限
gcloud projects get-iam-policy $GOOGLE_PROJECT_ID

# 4. 测试网络连接
curl -I https://generativelanguage.googleapis.com/
```

### 问题 2: "Permission denied"

**原因**: 服务账号权限不足

**解决方案**:
```bash
# 授予 Vertex AI User 角色
gcloud projects add-iam-policy-binding $GOOGLE_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### 问题 3: "Quota exceeded"

**原因**: 超出 API 配额

**解决方案**:
1. 访问 Google Cloud Console
2. 导航到 **"APIs & Services"** → **"Quotas"**
3. 搜索 **"Vertex AI API"**
4. 申请增加配额

### 问题 4: JSON 密钥文件路径错误

**症状**: "ENOENT: no such file or directory"

**解决方案**:
```bash
# 使用绝对路径
GOOGLE_APPLICATION_CREDENTIALS=/Users/username/secrets/key.json

# 或在 Linux/Mac 使用 ~ 展开
GOOGLE_APPLICATION_CREDENTIALS=~/secrets/key.json

# Windows 使用反斜杠
GOOGLE_APPLICATION_CREDENTIALS=C:\secrets\key.json
```

---

## 💰 费用说明

### API Key 免费额度

- 每分钟 60 次请求
- 每天有限制
- 适合开发和小规模使用

### Vertex AI 定价

Gemini 1.5 Pro 定价（截至 2024 年）:

| 操作 | 价格 |
|------|------|
| 输入 tokens | $0.00025 / 1K tokens |
| 输出 tokens | $0.001 / 1K tokens |
| 免费额度 | 无 |

**示例成本**:
- 生成 100 字摘要（约 150 tokens）：~$0.00015
- 分析 1000 字文章（约 1500 tokens）：~$0.0015

---

## 🔒 安全最佳实践

### ✅ DO（应该做）

1. **使用环境变量** 存储敏感信息
2. **不要提交** JSON 密钥文件到 Git
3. **定期轮换** API Keys 和服务账号密钥
4. **最小权限原则** 只授予必需的权限
5. **监控使用情况** 设置预算警报

### ❌ DON'T（不要做）

1. ❌ 不要在代码中硬编码 API Key
2. ❌ 不要在公共仓库中存储密钥文件
3. ❌ 不要使用个人账号，使用服务账号
4. ❌ 不要授予过高权限
5. ❌ 不要忽视成本监控

---

## 📚 相关资源

### 官方文档

- **Google AI Studio**: https://makersuite.google.com/
- **Vertex AI 文档**: https://cloud.google.com/vertex-ai/docs
- **Gemini API 文档**: https://ai.google.dev/docs
- **定价信息**: https://cloud.google.com/vertex-ai/pricing

### 项目文档

- [AI 服务集成指南](./ai-service-integration.md)
- [Story 2.1 文档](../stories/story-2-1-ai-tools-integration-framework.md)
- [API 文档](../api-documentation.md)

---

## ❓ 常见问题

### Q: 我应该选择 API Key 还是 Vertex AI？

**A**: 
- 开发和测试：使用 **API Key**（简单快速）
- 生产环境：使用 **Vertex AI**（更稳定、可扩展）

### Q: Vertex AI 比 API Key 有什么优势？

**A**:
- ✅ 更高的配额和更灵活的限流
- ✅ 企业级支持和 SLA
- ✅ 更好的监控和日志
- ✅ 可与其他 Google Cloud 服务集成

### Q: 如何避免高额费用？

**A**:
1. 设置预算警报
2. 实现请求缓存
3. 优化提示词以减少 token 使用
4. 监控 API 调用频率

### Q: 服务账号密钥丢失怎么办？

**A**:
1. 立即在 Google Cloud Console 中删除旧密钥
2. 创建新的密钥
3. 更新环境变量配置

---

## 📞 获取帮助

如果遇到问题：

1. 查看 API 服务日志
2. 运行测试脚本诊断
3. 检查 Google Cloud Console 的配额和计费
4. 参考官方文档

---

**最后更新**: 2025-10-08  
**维护者**: Tech News Platform Development Team
