# Tech News Platform API 文档

## 概述

Tech News Platform API 提供了完整的新闻内容管理功能，包括内容的CRUD操作、标签管理、搜索功能和用户认证。

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

所有需要认证的API都需要在请求头中包含JWT token：

```http
Authorization: Bearer <your-jwt-token>
```

## API 端点

### 1. 内容管理 API

#### 1.1 获取内容列表

```http
GET /api/content-items
```

**查询参数:**
- `page` (number, optional): 页码，默认为1
- `limit` (number, optional): 每页数量，默认为20
- `status` (string, optional): 内容状态 (`RAW`, `REVIEWED`, `PUBLISHED`, `ARCHIVED`, `DUPLICATE`)
- `type` (string, optional): 内容类型 (`NEWS`, `ARTICLE`, `BLOG`, `PRESS_RELEASE`, `RESEARCH`, `OTHER`)
- `category` (string, optional): 分类名称
- `search` (string, optional): 搜索关键词
- `tags` (string[], optional): 标签ID数组
- `dateFrom` (string, optional): 开始日期 (ISO 8601)
- `dateTo` (string, optional): 结束日期 (ISO 8601)

**响应示例:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "content-123",
        "title": "AI技术发展趋势",
        "description": "人工智能技术的最新发展动态",
        "content": "详细内容...",
        "summary": "内容摘要",
        "type": "NEWS",
        "status": "PUBLISHED",
        "category": "AI",
        "author": "张三",
        "url": "https://example.com/news/ai-trends",
        "imageUrl": "https://example.com/images/ai.jpg",
        "publishedAt": "2025-01-07T10:00:00Z",
        "createdAt": "2025-01-07T09:00:00Z",
        "updatedAt": "2025-01-07T09:30:00Z",
        "viewCount": 150,
        "shareCount": 25,
        "score": 8.5,
        "quality": 9.0,
        "relevance": 8.8,
        "keywords": ["AI", "人工智能", "技术"],
        "source": {
          "id": "source-123",
          "name": "科技日报",
          "url": "https://example.com"
        },
        "contentTags": [
          {
            "tag": {
              "id": "tag-1",
              "name": "人工智能",
              "type": "TECHNOLOGY"
            },
            "relevance": 0.95
          }
        ]
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

#### 1.2 获取单个内容

```http
GET /api/content-items/{id}
```

**路径参数:**
- `id` (string): 内容ID

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "content-123",
    "title": "AI技术发展趋势",
    // ... 完整的内容对象
    "versions": [
      {
        "id": "version-1",
        "version": 1,
        "title": "原始标题",
        "changeType": "CREATE",
        "changeNote": "初始创建",
        "changedBy": "user-123",
        "createdAt": "2025-01-07T09:00:00Z"
      }
    ],
    "auditLogs": [
      {
        "id": "audit-1",
        "action": "CREATE",
        "userId": "user-123",
        "tableName": "content",
        "createdAt": "2025-01-07T09:00:00Z"
      }
    ]
  }
}
```

#### 1.3 创建内容

```http
POST /api/content-items
```

**请求体:**
```json
{
  "title": "新内容标题",
  "description": "内容描述",
  "content": "详细内容",
  "summary": "内容摘要",
  "type": "NEWS",
  "category": "AI",
  "author": "作者名称",
  "url": "https://example.com/source",
  "imageUrl": "https://example.com/image.jpg",
  "sourceId": "source-123",
  "publishedAt": "2025-01-07T10:00:00Z",
  "keywords": ["AI", "技术"],
  "metadata": {
    "customField": "value"
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "content-456",
    "title": "新内容标题",
    "status": "RAW",
    // ... 完整的内容对象
  },
  "message": "内容创建成功"
}
```

#### 1.4 更新内容

```http
PUT /api/content-items/{id}
```

**请求体:** (所有字段都是可选的)
```json
{
  "title": "更新的标题",
  "description": "更新的描述",
  "status": "REVIEWED",
  "quality": 9.5,
  "relevance": 9.0
}
```

#### 1.5 删除内容

```http
DELETE /api/content-items/{id}
```

#### 1.6 批量更新内容状态

```http
PATCH /api/content-items/batch/status
```

**请求体:**
```json
{
  "ids": ["content-1", "content-2", "content-3"],
  "status": "PUBLISHED"
}
```

#### 1.7 内容去重检查

```http
POST /api/content-items/check-duplication
```

**请求体:**
```json
{
  "title": "要检查的标题",
  "content": "要检查的内容",
  "url": "https://example.com/article"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "isDuplicate": true,
    "duplicateId": "content-123",
    "similarity": 0.95,
    "method": "TITLE_SIMILARITY",
    "confidence": 0.98
  }
}
```

#### 1.8 获取内容统计

```http
GET /api/content-items/statistics
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "totalContent": 1000,
    "contentByStatus": {
      "RAW": 200,
      "REVIEWED": 150,
      "PUBLISHED": 600,
      "ARCHIVED": 45,
      "DUPLICATE": 5
    },
    "contentByType": {
      "NEWS": 600,
      "ARTICLE": 300,
      "BLOG": 80,
      "RESEARCH": 20
    },
    "recentContent": 50,
    "duplicateContent": 5,
    "averageQuality": 8.2,
    "topCategories": [
      { "category": "AI", "count": 200 },
      { "category": "区块链", "count": 150 }
    ]
  }
}
```

#### 1.9 记录内容分享

```http
POST /api/content-items/{id}/share
```

### 2. 标签管理 API

#### 2.1 为内容添加标签

```http
POST /api/content-items/{id}/tags
```

**请求体:**
```json
{
  "tagIds": ["tag-1", "tag-2"],
  "tagNames": ["新标签1", "新标签2"],
  "relevance": 0.9
}
```

#### 2.2 移除内容标签

```http
DELETE /api/content-items/{id}/tags
```

**请求体:**
```json
{
  "tagIds": ["tag-1", "tag-2"]
}
```

#### 2.3 获取标签列表

```http
GET /api/content-items/tags
```

**查询参数:**
- `page` (number): 页码
- `limit` (number): 每页数量
- `search` (string): 搜索关键词
- `type` (string): 标签类型
- `parentId` (string): 父标签ID

**响应示例:**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "tag-1",
        "name": "人工智能",
        "slug": "artificial-intelligence",
        "type": "TECHNOLOGY",
        "description": "AI相关技术",
        "color": "#FF5722",
        "usageCount": 150,
        "parentId": null,
        "children": [
          {
            "id": "tag-2",
            "name": "机器学习",
            "parentId": "tag-1"
          }
        ],
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### 2.4 创建标签

```http
POST /api/content-items/tags
```

**请求体:**
```json
{
  "name": "新标签",
  "slug": "new-tag",
  "type": "TOPIC",
  "description": "标签描述",
  "color": "#2196F3",
  "parentId": "parent-tag-id"
}
```

#### 2.5 获取标签建议

```http
GET /api/content-items/tags/suggestions
```

**查询参数:**
- `query` (string, required): 搜索查询
- `limit` (number): 返回数量限制
- `type` (string): 标签类型过滤

#### 2.6 获取热门标签

```http
GET /api/content-items/tags/popular
```

**查询参数:**
- `limit` (number): 返回数量限制
- `type` (string): 标签类型过滤

## 错误处理

API使用标准的HTTP状态码和统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息",
  "code": "ERROR_CODE"
}
```

**常见错误码:**
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或token无效
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突（如重复内容）
- `422 Unprocessable Entity`: 数据验证失败
- `500 Internal Server Error`: 服务器内部错误

## 数据模型

### Content (内容)

```typescript
interface Content {
  id: string;
  title: string;
  description?: string;
  content?: string;
  summary?: string;
  type: ContentType;
  status: ContentStatus;
  category?: string;
  author?: string;
  url?: string;
  imageUrl?: string;
  sourceId: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  shareCount: number;
  score?: number;
  quality?: number;
  relevance?: number;
  contentHash?: string;
  titleHash?: string;
  duplicateOf?: string;
  keywords?: string[];
  searchVector?: string;
  metadata?: Record<string, any>;
}
```

### Tag (标签)

```typescript
interface Tag {
  id: string;
  name: string;
  slug: string;
  type: TagType;
  description?: string;
  color?: string;
  parentId?: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 枚举类型

```typescript
enum ContentStatus {
  RAW = 'RAW',
  REVIEWED = 'REVIEWED', 
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DUPLICATE = 'DUPLICATE'
}

enum ContentType {
  NEWS = 'NEWS',
  ARTICLE = 'ARTICLE',
  BLOG = 'BLOG',
  PRESS_RELEASE = 'PRESS_RELEASE',
  RESEARCH = 'RESEARCH',
  OTHER = 'OTHER'
}

enum TagType {
  TECHNOLOGY = 'TECHNOLOGY',
  COMPANY = 'COMPANY',
  PERSON = 'PERSON',
  TOPIC = 'TOPIC',
  LOCATION = 'LOCATION',
  EVENT = 'EVENT',
  OTHER = 'OTHER'
}
```

## 使用示例

### JavaScript/TypeScript 客户端

```typescript
class TechNewsAPI {
  private baseURL = 'http://localhost:3001/api';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  }

  // 获取内容列表
  async getContent(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/content-items?${query}`);
  }

  // 创建内容
  async createContent(data: {
    title: string;
    description?: string;
    content?: string;
    sourceId: string;
    type: string;
  }) {
    return this.request('/content-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 添加标签
  async addTags(contentId: string, tagIds: string[]) {
    return this.request(`/content-items/${contentId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagIds }),
    });
  }
}

// 使用示例
const api = new TechNewsAPI('your-jwt-token');

// 获取内容
const contentList = await api.getContent({
  page: 1,
  limit: 10,
  status: 'PUBLISHED'
});

// 创建内容
const newContent = await api.createContent({
  title: '新的AI技术突破',
  description: '描述内容',
  sourceId: 'source-123',
  type: 'NEWS'
});
```

### cURL 示例

```bash
# 获取内容列表
curl -X GET "http://localhost:3001/api/content-items?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"

# 创建内容
curl -X POST "http://localhost:3001/api/content-items" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新内容标题",
    "description": "内容描述",
    "sourceId": "source-123",
    "type": "NEWS"
  }'

# 添加标签
curl -X POST "http://localhost:3001/api/content-items/content-123/tags" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "tagIds": ["tag-1", "tag-2"]
  }'
```

## 最佳实践

### 1. 分页处理
- 使用合理的页面大小（建议10-50条记录）
- 总是检查 `totalPages` 来判断是否还有更多数据

### 2. 错误处理
- 始终检查响应的 `success` 字段
- 实现适当的重试机制
- 记录错误日志用于调试

### 3. 性能优化
- 使用适当的查询参数过滤数据
- 缓存不经常变化的数据（如标签列表）
- 使用搜索功能而不是客户端过滤

### 4. 安全考虑
- 妥善保管JWT token
- 定期刷新token
- 验证用户输入数据

## 版本历史

- **v1.0.0** (2025-01-07): 初始版本，包含基础内容管理和标签功能
- 支持内容CRUD操作
- 支持标签管理
- 支持内容去重检查
- 支持搜索和过滤功能

## 支持

如有问题或建议，请联系开发团队或查看项目文档。
