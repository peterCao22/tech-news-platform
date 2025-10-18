/**
 * Story 4.3: 历史内容分析与趋势 - 前端服务层
 */

import axios from 'axios';

// 动态获取API基础URL
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

// 获取认证token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    }
  } catch (error) {
    console.error('获取token失败:', error);
  }
  
  return null;
};

// 配置axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除认证信息并跳转到登录页
      localStorage.removeItem('auth-storage');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 个人vs平台对比分析
 */
export const getPersonalVsPlatform = async (period: '7d' | '30d' = '30d') => {
  const response = await apiClient.get('/history/personal-vs-platform', {
    params: { period },
  });
  return response.data;
};

/**
 * 获取每日阅读记录
 */
export const getDailyReading = async (
  date: string,
  category?: string
) => {
  const response = await apiClient.get('/history/daily-reading', {
    params: { date, category },
  });
  return response.data;
};

/**
 * 导出每日阅读记录
 */
export const exportDailyReading = async (
  date: string,
  format: 'json' | 'csv' | 'markdown' = 'json'
) => {
  const response = await apiClient.get('/history/daily-reading', {
    params: { date, export: format },
    responseType: format === 'json' ? 'json' : 'blob',
  });

  if (format !== 'json') {
    // 创建下载链接
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reading-${date}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  return response.data;
};

/**
 * 获取关键词趋势
 */
export const getKeywordTrends = async (
  period: '7d' | '30d' = '7d',
  limit: number = 20
) => {
  const response = await apiClient.get('/history/trends/keywords', {
    params: { period, limit },
  });
  return response.data;
};

/**
 * 获取分类趋势
 */
export const getCategoryTrends = async (
  period: '7d' | '30d' = '7d',
  limit: number = 10
) => {
  const response = await apiClient.get('/history/trends/categories', {
    params: { period, limit },
  });
  return response.data;
};

/**
 * 获取完整趋势报告
 */
export const getTrendReport = async (period: '7d' | '30d' = '7d') => {
  const response = await apiClient.get('/history/trends/report', {
    params: { period },
  });
  return response.data;
};

/**
 * 追踪公司新闻
 */
export const trackCompanyNews = async (
  companyName: string,
  period: '7d' | '30d' = '30d'
) => {
  const response = await apiClient.get(
    `/history/company/${encodeURIComponent(companyName)}`,
    {
      params: { period },
    }
  );
  return response.data;
};

/**
 * 获取关注公司动态
 */
export const getFollowingCompanies = async (period: '7d' | '30d' = '7d') => {
  const response = await apiClient.get('/history/following-companies', {
    params: { period },
  });
  return response.data;
};

/**
 * 手动触发趋势聚合（管理员）
 */
export const triggerTrendAggregation = async (date?: string) => {
  const response = await apiClient.post('/history/trends/aggregate', {
    date,
  });
  return response.data;
};

