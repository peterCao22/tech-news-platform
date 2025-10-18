/**
 * Filter Rules Service
 * Story 3.2: Intelligent Filter Rules
 * 
 * API service layer for filter rules management
 */

import axios from 'axios';
import type { FilterRule, RuleType, RuleStatus, RuleVersion, SourceListItem, RuleTestResult } from '../stores/filterRulesStore';

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
      return `http://${hostname}:3001/api`;
    }
  }
  
  // 默认使用localhost（开发环境）
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    // 从Zustand persist storage中获取token
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.token || null;
      } catch (e) {
        console.error('解析auth storage失败:', e);
      }
    }
  }
  return null;
};

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('⚠️ 未找到认证 token，请先登录。访问 /login 页面或使用浏览器控制台登录。');
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 未授权: 请先登录或 token 已过期');
      // 可选：自动跳转到登录页
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

interface RulesListResponse {
  items: FilterRule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RuleTestResponse {
  affectedCount: number;
  results: RuleTestResult[];
  summary: {
    totalTested: number;
    boosted: number;
    penalized: number;
    blocked: number;
    avgScoreChange: number;
  };
}

interface SourceListResponse {
  items: SourceListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Rules API
export const filterRulesService = {
  /**
   * Get list of filter rules
   */
  async getRules(params?: {
    type?: RuleType;
    status?: RuleStatus;
    page?: number;
    limit?: number;
    sortBy?: 'priority' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<RulesListResponse> {
    const response = await api.get<ApiResponse<RulesListResponse>>('/filter-rules', {
      params,
    });
    return response.data.data;
  },

  /**
   * Get single rule by ID
   */
  async getRule(ruleId: string): Promise<FilterRule> {
    const response = await api.get<ApiResponse<FilterRule>>(`/filter-rules/${ruleId}`);
    return response.data.data;
  },

  /**
   * Create new filter rule
   */
  async createRule(data: {
    name: string;
    description?: string;
    ruleType: RuleType;
    priority?: number;
    config: any;
  }): Promise<FilterRule> {
    const response = await api.post<ApiResponse<FilterRule>>('/filter-rules', data);
    return response.data.data;
  },

  /**
   * Update existing rule
   */
  async updateRule(
    ruleId: string,
    data: {
      name?: string;
      description?: string;
      priority?: number;
      status?: RuleStatus;
      config?: any;
    }
  ): Promise<FilterRule> {
    const response = await api.put<ApiResponse<FilterRule>>(`/filter-rules/${ruleId}`, data);
    return response.data.data;
  },

  /**
   * Delete rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    await api.delete(`/filter-rules/${ruleId}`);
  },

  /**
   * Test rule against existing content
   */
  async testRule(ruleId: string, params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<RuleTestResponse> {
    const response = await api.post<ApiResponse<RuleTestResponse>>(
      `/filter-rules/${ruleId}/test`,
      params
    );
    return response.data.data;
  },

  /**
   * Publish rule (create new version)
   */
  async publishRule(ruleId: string, changeLog?: string): Promise<FilterRule> {
    const response = await api.post<ApiResponse<FilterRule>>(
      `/filter-rules/${ruleId}/publish`,
      { changeLog }
    );
    return response.data.data;
  },

  /**
   * Get rule version history
   */
  async getRuleVersions(ruleId: string): Promise<RuleVersion[]> {
    const response = await api.get<ApiResponse<{ versions: RuleVersion[] }>>(
      `/filter-rules/${ruleId}/versions`
    );
    return response.data.data.versions;
  },

  /**
   * Rollback to specific version
   */
  async rollbackRule(ruleId: string, version: number, changeLog?: string): Promise<FilterRule> {
    const response = await api.post<ApiResponse<FilterRule>>(
      `/filter-rules/${ruleId}/rollback`,
      { version, changeLog }
    );
    return response.data.data;
  },

  /**
   * Get rule analytics
   */
  async getRuleAnalytics(ruleId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const response = await api.get<ApiResponse<any>>(
      `/filter-rules/${ruleId}/analytics`,
      { params }
    );
    return response.data.data;
  },
};

// Source Lists API
export const sourceListsService = {
  /**
   * Get source lists (whitelist/blacklist)
   */
  async getSourceLists(params?: {
    listType?: 'WHITELIST' | 'BLACKLIST';
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<SourceListResponse> {
    const response = await api.get<ApiResponse<SourceListResponse>>('/source-lists', {
      params,
    });
    return response.data.data;
  },

  /**
   * Add source to list
   */
  async addSourceToList(data: {
    listType: 'WHITELIST' | 'BLACKLIST';
    sourceId?: string;
    sourceName: string;
    sourceDomain?: string;
    weight: number;
    reason?: string;
  }): Promise<SourceListItem> {
    const response = await api.post<ApiResponse<SourceListItem>>('/source-lists', data);
    return response.data.data;
  },

  /**
   * Update source list item
   */
  async updateSourceListItem(
    listId: string,
    data: {
      weight?: number;
      reason?: string;
      isActive?: boolean;
    }
  ): Promise<SourceListItem> {
    const response = await api.put<ApiResponse<SourceListItem>>(
      `/source-lists/${listId}`,
      data
    );
    return response.data.data;
  },

  /**
   * Remove source from list
   */
  async removeSourceFromList(listId: string): Promise<void> {
    await api.delete(`/source-lists/${listId}`);
  },

  /**
   * Batch add sources to list
   */
  async batchAddSources(data: {
    listType: 'WHITELIST' | 'BLACKLIST';
    sources: Array<{
      sourceId?: string;
      sourceName: string;
      sourceDomain?: string;
      weight: number;
      reason?: string;
    }>;
  }): Promise<SourceListItem[]> {
    const response = await api.post<ApiResponse<SourceListItem[]>>(
      '/source-lists/batch',
      data
    );
    return response.data.data;
  },
};

