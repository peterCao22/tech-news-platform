/**
 * Story 4.2: 高级搜索与筛选 - API服务层
 * 
 * 封装所有搜索相关的API调用
 */

import axios from 'axios';

// 动态获取API基础URL
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const apiPort = hostname === 'localhost' ? '3001' : '3001';
    return `http://${hostname}:${apiPort}/api`;
  }
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// 获取认证Token
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    }
  } catch (error) {
    console.error('Failed to parse auth token:', error);
  }
  
  return null;
};

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除认证信息
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== 类型定义 ====================

interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  sources?: string[];
  categories?: string[];
  scoreMin?: number;
  scoreMax?: number;
}

interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  page?: number;
  pageSize?: number;
  sortBy?: 'relevance' | 'date' | 'score';
  sortOrder?: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  score: number;
  publishedAt: string;
  createdAt: string;
  category: string;
  source: {
    id: string;
    name: string;
    url: string;
  } | null;
  highlights?: {
    title?: string;
    description?: string;
    content?: string;
  };
}

interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    filters: SearchFilters;
    performance: {
      searchTime: number;
      totalTime: number;
    };
  };
}

interface FilterOptionsResponse {
  success: boolean;
  data: {
    sources: Array<{ id: string; name: string; count: number }>;
    categories: Array<{ name: string; count: number }>;
  };
}

interface ValidateQueryResponse {
  success: boolean;
  data: {
    isValid: boolean;
    error?: string;
    parsedQuery?: string;
  };
}

// ==================== API方法 ====================

export const searchService = {
  /**
   * 执行搜索
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const response = await apiClient.post<SearchResponse>('/search/query', {
      query: options.query,
      filters: options.filters || {},
      page: options.page || 1,
      pageSize: options.pageSize || 20,
      sortBy: options.sortBy || 'relevance',
      sortOrder: options.sortOrder || 'desc',
    });
    
    return response.data;
  },

  /**
   * 获取筛选选项（来源、分类列表及统计）
   */
  async getFilterOptions(): Promise<FilterOptionsResponse> {
    const response = await apiClient.get<FilterOptionsResponse>('/search/filters/options');
    return response.data;
  },

  /**
   * 验证搜索查询语法
   */
  async validateQuery(query: string): Promise<ValidateQueryResponse> {
    const response = await apiClient.get<ValidateQueryResponse>('/search/validate', {
      params: { query },
    });
    return response.data;
  },
};

export type { SearchOptions, SearchResult, SearchResponse, SearchFilters };

