/**
 * Story 4.5: 智能通知与提醒
 * 前端通知服务 - 封装通知API调用
 */

import axios from 'axios';

// 动态API地址
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

/**
 * 获取认证 token
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    }
  } catch (error) {
    console.error('获取认证token失败:', error);
  }
  
  return null;
};

/**
 * 创建 axios 实例
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 类型定义
export interface NotificationPreference {
  id: string;
  userId: string;
  stockAlertEnabled: boolean;
  importantNewsEnabled: boolean;
  top10DigestEnabled: boolean;
  frequency: 'REALTIME' | 'DAILY' | 'WEEKLY' | 'OFF';
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  digestTime: string | null;
  stockAlertThreshold: number;
  minNewsScore: number;
  emailEnabled: boolean;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  type: 'STOCK_ALERT' | 'IMPORTANT_NEWS' | 'TOP10_DIGEST';
  channel: 'EMAIL' | 'WEB_PUSH' | 'SMS';
  subject: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt: string | null;
  errorMessage: string | null;
  metadata: any;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 获取通知偏好
 */
export const getNotificationPreferences = async (): Promise<NotificationPreference> => {
  const response = await apiClient.get('/notifications/preferences');
  return response.data.data;
};

/**
 * 更新通知偏好
 */
export const updateNotificationPreferences = async (
  data: Partial<Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<NotificationPreference> => {
  const response = await apiClient.put('/notifications/preferences', data);
  return response.data.data;
};

/**
 * 获取通知历史
 */
export const getNotificationHistory = async (params: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}): Promise<PaginatedResult<NotificationLog>> => {
  const response = await apiClient.get('/notifications/history', { params });
  return response.data;
};

/**
 * 发送测试邮件
 */
export const sendTestEmail = async (): Promise<void> => {
  await apiClient.post('/notifications/test-email');
};

/**
 * 手动触发TOP10摘要发送
 */
export const sendDigest = async (): Promise<void> => {
  await apiClient.post('/notifications/send-digest');
};

