/**
 * Content Review Service
 * Story 3.1: 内容审核工作台界面
 * 
 * 封装所有与内容审核相关的API调用
 */

import axios from 'axios';
import type { ContentItem, ContentReviewStatus, FilterParams } from '../stores/contentReviewStore';

// 自动检测API地址
const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 在浏览器环境中，根据当前域名自动配置
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // 如果是IP地址或非localhost域名，使用相同的主机名
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3001`;
    }
  }
  
  // 默认使用localhost:3001（API服务器端口）
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

// 创建axios实例
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    // 从Zustand persist storage中获取token
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('解析auth storage失败:', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，跳转到登录页
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// API响应类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ListResponse {
  items: ContentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    publishedCount: number;
  };
}

interface BatchUpdateResponse {
  successCount: number;
  failedCount: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

interface AuditLog {
  id: string;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
  changes?: any;
  createdAt: string;
}

interface StatsResponse {
  totalReviewed: number;
  approvalRate: number;
  avgReviewTime: number;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
    published: number;
  };
  byReviewer: Array<{
    userId: string;
    userName: string;
    reviewCount: number;
    avgTime: number;
  }>;
  byCategory: Record<string, number>;
}

/**
 * Content Review API Service
 */
export const contentReviewService = {
  /**
   * 获取审核列表
   */
  async getList(params: {
    page?: number;
    limit?: number;
    filters?: FilterParams;
  }): Promise<ListResponse> {
    const { page = 1, limit = 20, filters = {} } = params;

    const queryParams: any = {
      page,
      limit,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc',
    };

    // 添加筛选参数
    if (filters.status && filters.status.length > 0) {
      queryParams.status = filters.status.join(',');
    }
    if (filters.category) {
      queryParams.category = filters.category;
    }
    if (filters.sourceId) {
      queryParams.sourceId = filters.sourceId;
    }
    if (filters.dateFrom) {
      queryParams.dateFrom = filters.dateFrom.toISOString();
    }
    if (filters.dateTo) {
      queryParams.dateTo = filters.dateTo.toISOString();
    }

    const response = await apiClient.get<ApiResponse<ListResponse>>(
      '/content-review',
      { params: queryParams }
    );

    return response.data.data;
  },

  /**
   * 获取单个内容详情
   */
  async getDetail(contentId: string): Promise<ContentItem> {
    const response = await apiClient.get<ApiResponse<ContentItem>>(
      `/content-review/${contentId}`
    );
    return response.data.data;
  },

  /**
   * 更新审核状态
   */
  async updateStatus(
    contentId: string,
    action: 'APPROVE' | 'REJECT' | 'PUBLISH',
    notes?: string
  ): Promise<ContentItem> {
    const response = await apiClient.post<ApiResponse<ContentItem>>(
      `/content-review/${contentId}/status`,
      { action, notes }
    );
    return response.data.data;
  },

  /**
   * 批量更新状态
   */
  async batchUpdateStatus(
    contentIds: string[],
    action: 'APPROVE' | 'REJECT' | 'PUBLISH',
    notes?: string
  ): Promise<BatchUpdateResponse> {
    const response = await apiClient.post<ApiResponse<BatchUpdateResponse>>(
      '/content-review/batch-update',
      { contentIds, action, notes }
    );
    return response.data.data;
  },

  /**
   * 更新内容详情
   */
  async updateDetails(
    contentId: string,
    updates: {
      title?: string;
      description?: string;
      content?: string;
      category?: string;
      tags?: string[];
      metadata?: any;
    }
  ): Promise<ContentItem> {
    const response = await apiClient.patch<ApiResponse<ContentItem>>(
      `/content-review/${contentId}`,
      updates
    );
    return response.data.data;
  },

  /**
   * 获取审核日志
   */
  async getAuditLog(contentId: string, limit: number = 20): Promise<AuditLog[]> {
    const response = await apiClient.get<ApiResponse<{ logs: AuditLog[] }>>(
      `/content-review/${contentId}/audit-log`,
      { params: { limit } }
    );
    return response.data.data.logs;
  },

  /**
   * 获取统计数据
   */
  async getStats(params?: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<StatsResponse> {
    const queryParams: any = {};
    if (params?.dateFrom) {
      queryParams.dateFrom = params.dateFrom.toISOString();
    }
    if (params?.dateTo) {
      queryParams.dateTo = params.dateTo.toISOString();
    }

    const response = await apiClient.get<ApiResponse<StatsResponse>>(
      '/content-review/stats/summary',
      { params: queryParams }
    );
    return response.data.data;
  },
};

// 导出类型
export type { AuditLog, StatsResponse, BatchUpdateResponse };

