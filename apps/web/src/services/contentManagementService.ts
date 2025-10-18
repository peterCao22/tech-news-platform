/**
 * Content Management Service
 * 手工内容管理的前端API服务
 * Story 3.3: Manual Content Management
 */

import axios from 'axios';

// 自动检测API地址
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    return `http://${hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token (Zustand persist)
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('解析 auth token 失败:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理401错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 未授权: 请先登录或 token 已过期');
      // 清除认证信息
      localStorage.removeItem('auth-storage');
      // 可选：跳转到登录页
      // window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// 类型定义
export interface CreateContentInput {
  title: string;
  description?: string;
  content?: string;
  url?: string;
  category?: string;
  tags?: string[];
  sourceId?: string;
  customSource?: {
    name: string;
    domain: string;
  };
  publishedAt?: Date;
  reviewStatus?: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  template: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BatchImport {
  id: string;
  importType: string;
  totalItems: number;
  successCount: number;
  failedCount: number;
  status: string;
  errorLog?: any;
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  suggestions: string[];
}

// Content Management API
export const contentManagementService = {
  /**
   * 创建手工内容
   */
  async createContent(input: CreateContentInput) {
    const response = await api.post('/content-management/create', input);
    return response.data;
  },

  /**
   * 从URL导入内容
   */
  async importFromUrl(url: string, autoFill: boolean = false) {
    const response = await api.post('/content-management/import-url', {
      url,
      autoFill,
    });
    return response.data;
  },

  /**
   * 批量导入URLs
   */
  async batchImportUrls(
    urls: string[],
    options?: {
      autoApprove?: boolean;
      defaultCategory?: string;
      defaultTags?: string[];
    }
  ) {
    const response = await api.post('/content-management/batch-import', {
      type: 'urls',
      data: { urls },
      options,
    });
    return response.data;
  },

  /**
   * 批量导入文本（一行一个URL）
   */
  async batchImportText(
    text: string,
    options?: {
      autoApprove?: boolean;
      defaultCategory?: string;
      defaultTags?: string[];
    }
  ) {
    const response = await api.post('/content-management/batch-import', {
      type: 'text',
      data: { text },
      options,
    });
    return response.data;
  },

  /**
   * 批量导入JSON数据
   */
  async batchImportJson(
    items: Array<Partial<CreateContentInput>>,
    options?: {
      autoApprove?: boolean;
      defaultCategory?: string;
      defaultTags?: string[];
    }
  ) {
    const response = await api.post('/content-management/batch-import', {
      type: 'json',
      data: { items },
      options,
    });
    return response.data;
  },

  /**
   * 获取批量导入状态
   */
  async getBatchImportStatus(batchId: string): Promise<{ success: boolean; data: BatchImport }> {
    const response = await api.get(`/content-management/batch-import/${batchId}`);
    return response.data;
  },

  /**
   * 验证内容
   */
  async validateContent(input: Partial<CreateContentInput>): Promise<{ success: boolean; data: ValidationResult }> {
    const response = await api.post('/content-management/validate', input);
    return response.data;
  },

  /**
   * 获取内容模板列表
   */
  async getTemplates(params?: {
    category?: string;
    isActive?: boolean;
  }): Promise<{ success: boolean; data: { items: ContentTemplate[] } }> {
    const response = await api.get('/content-management/templates', { params });
    return response.data;
  },

  /**
   * 获取内置模板
   */
  async getBuiltInTemplates(): Promise<{ success: boolean; data: { items: any[] } }> {
    const response = await api.get('/content-management/templates/built-in');
    return response.data;
  },

  /**
   * 获取单个模板详情
   */
  async getTemplate(templateId: string): Promise<{ success: boolean; data: ContentTemplate }> {
    const response = await api.get(`/content-management/templates/${templateId}`);
    return response.data;
  },

  /**
   * 创建内容模板
   */
  async createTemplate(input: {
    name: string;
    description?: string;
    category?: string;
    template: Record<string, any>;
  }): Promise<{ success: boolean; data: ContentTemplate }> {
    const response = await api.post('/content-management/templates', input);
    return response.data;
  },

  /**
   * 更新模板
   */
  async updateTemplate(
    templateId: string,
    input: Partial<{
      name: string;
      description: string;
      category: string;
      template: Record<string, any>;
      isActive: boolean;
    }>
  ): Promise<{ success: boolean; data: ContentTemplate }> {
    const response = await api.patch(`/content-management/templates/${templateId}`, input);
    return response.data;
  },

  /**
   * 删除模板
   */
  async deleteTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/content-management/templates/${templateId}`);
    return response.data;
  },
};

export default contentManagementService;

