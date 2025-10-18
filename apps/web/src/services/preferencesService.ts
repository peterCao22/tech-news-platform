/**
 * Story 4.1: User Preferences Service
 * 用户个性化偏好 API 服务
 * 
 * 提供与后端 API 交互的方法
 */

import axios from 'axios';

/**
 * 获取 API 基础 URL
 */
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
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器 - 添加认证 token
 */
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

/**
 * 响应拦截器 - 处理错误
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 未授权，清除认证信息
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 偏好服务类
 */
export class PreferencesService {
  
  // ==========================================
  // 基础偏好管理
  // ==========================================
  
  /**
   * 获取用户偏好
   */
  static async getPreference() {
    const response = await apiClient.get('/preferences');
    return response.data.data;
  }

  /**
   * 更新用户偏好
   */
  static async updatePreference(data: {
    contentTypes?: string[];
    preferredLanguage?: string;
    timezone?: string;
    itemsPerPage?: number;
    defaultSortBy?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    notificationFrequency?: string;
  }) {
    const response = await apiClient.put('/preferences', data);
    return response.data.data;
  }

  // ==========================================
  // 兴趣管理
  // ==========================================

  /**
   * 获取兴趣列表
   */
  static async getInterests(filters?: {
    category?: string;
    isActive?: boolean;
  }) {
    const response = await apiClient.get('/preferences/interests', {
      params: filters,
    });
    return response.data.data;
  }

  /**
   * 添加兴趣
   */
  static async addInterest(data: {
    category: string;
    name: string;
    weight?: number;
  }) {
    const response = await apiClient.post('/preferences/interests', data);
    return response.data.data;
  }

  /**
   * 批量添加兴趣
   */
  static async batchAddInterests(interests: Array<{
    category: string;
    name: string;
    weight?: number;
  }>) {
    const response = await apiClient.post('/preferences/interests/batch', {
      interests,
    });
    return response.data.data;
  }

  /**
   * 更新兴趣
   */
  static async updateInterest(
    id: string,
    data: {
      weight?: number;
      isActive?: boolean;
    }
  ) {
    const response = await apiClient.put(`/preferences/interests/${id}`, data);
    return response.data.data;
  }

  /**
   * 删除兴趣
   */
  static async deleteInterest(id: string) {
    await apiClient.delete(`/preferences/interests/${id}`);
  }

  // ==========================================
  // 关注列表管理
  // ==========================================

  /**
   * 获取关注列表
   */
  static async getFollowings(filters?: {
    followType?: string;
    isActive?: boolean;
  }) {
    const response = await apiClient.get('/preferences/followings', {
      params: filters,
    });
    return response.data.data;
  }

  /**
   * 添加关注
   */
  static async addFollowing(data: {
    followType: 'COMPANY' | 'STOCK' | 'PERSON' | 'ORGANIZATION';
    name: string;
    identifier?: string;
    weight?: number;
    notifyOnNews?: boolean;
    notifyOnPrice?: boolean;
  }) {
    const response = await apiClient.post('/preferences/followings', data);
    return response.data.data;
  }

  /**
   * 更新关注
   */
  static async updateFollowing(
    id: string,
    data: {
      weight?: number;
      isActive?: boolean;
      notifyOnNews?: boolean;
      notifyOnPrice?: boolean;
    }
  ) {
    const response = await apiClient.put(`/preferences/followings/${id}`, data);
    return response.data.data;
  }

  /**
   * 删除关注
   */
  static async deleteFollowing(id: string) {
    await apiClient.delete(`/preferences/followings/${id}`);
  }

  // ==========================================
  // 信息源权重管理
  // ==========================================

  /**
   * 获取信息源权重列表
   */
  static async getSourceWeights() {
    const response = await apiClient.get('/preferences/source-weights');
    return response.data.data;
  }

  /**
   * 设置信息源权重
   */
  static async setSourceWeight(
    sourceId: string,
    data: {
      weight: number;
      reason?: string;
    }
  ) {
    const response = await apiClient.put(
      `/preferences/source-weights/${sourceId}`,
      data
    );
    return response.data.data;
  }

  // ==========================================
  // 偏好导入导出
  // ==========================================

  /**
   * 导出偏好
   */
  static async exportPreferences() {
    const response = await apiClient.post('/preferences/export', {});
    return response.data.data;
  }

  /**
   * 导入偏好
   */
  static async importPreferences(data: any, overwrite: boolean = false) {
    const response = await apiClient.post('/preferences/import', {
      data,
      overwrite,
    });
    return response.data;
  }

  // ==========================================
  // 偏好模板管理
  // ==========================================

  /**
   * 获取偏好模板列表
   */
  static async getTemplates(filters?: {
    category?: string;
    isPublic?: boolean;
  }) {
    const response = await apiClient.get('/preferences/templates', {
      params: filters,
    });
    return response.data.data;
  }

  /**
   * 应用偏好模板
   */
  static async applyTemplate(templateId: string) {
    const response = await apiClient.post(
      `/preferences/templates/${templateId}/apply`,
      {}
    );
    return response.data;
  }

  // ==========================================
  // 个性化内容
  // ==========================================

  /**
   * 获取个性化内容
   */
  static async getPersonalizedContent(options?: {
    page?: number;
    limit?: number;
    category?: string;
    minScore?: number;
  }) {
    const response = await apiClient.get('/preferences/content/personalized', {
      params: options,
    });
    return response.data.data;
  }

  /**
   * 获取个性化TOP10
   */
  static async getPersonalizedTop10(date?: string) {
    const response = await apiClient.get('/preferences/daily-top10/personalized', {
      params: date ? { date } : {},
    });
    return response.data.data;
  }
}

// 导出默认实例
export default PreferencesService;

