/**
 * Story 4.4: Behavior Service
 * 用户行为数据服务
 */

import axios from 'axios';

// API Base URL
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001/api';
  
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  return `http://${hostname}:3001/api`;
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
    console.error('Failed to get auth token:', error);
  }
  return null;
};

// 创建axios实例
const behaviorApi = axios.create({
  baseURL: API_BASE_URL,
});

// 添加请求拦截器
behaviorApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 添加响应拦截器
behaviorApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// 类型定义
// ============================================

export interface ReadingHistoryItem {
  id: string;
  userId: string;
  contentId: string;
  readCount: number;
  totalDuration: number;
  maxScrollDepth: number;
  isCompleted: boolean;
  isBookmarked: boolean;
  isLiked: boolean;
  isShared: boolean;
  firstReadAt: string;
  lastReadAt: string;
  content: {
    id: string;
    title: string;
    description: string;
    category: string;
    imageUrl?: string;
    url?: string;
    source: {
      name: string;
    };
  };
}

export interface BehaviorStats {
  categoryPreferences: Record<string, number>;
  sourcePreferences: Record<string, number>;
  topicPreferences: Record<string, number>;
  topContents: Array<{
    contentId: string;
    title: string;
    viewCount: number;
    readCount: number;
    totalDuration: number;
  }>;
}

export interface EngagementStats {
  totalViews: number;
  totalReads: number;
  totalClicks: number;
  totalShares: number;
  totalBookmarks: number;
  totalLikes: number;
  totalReadingTime: number;
  avgSessionTime: number;
  categoryPreferences: Record<string, number>;
  sourcePreferences: Record<string, number>;
  topicPreferences: Record<string, number>;
  dailyActiveStreak: number;
  lastActiveDate: string;
}

export interface ImplicitPreference {
  id: string;
  userId: string;
  preferenceType: string;
  preferenceKey: string;
  weight: number;
  confidence: number;
  interactionCount: number;
  lastInteraction: string;
}

// ============================================
// API Functions
// ============================================

/**
 * 获取阅读历史
 */
export async function getReadingHistory(params?: {
  page?: number;
  limit?: number;
  isBookmarked?: boolean;
  isCompleted?: boolean;
  category?: string;
}): Promise<{
  items: ReadingHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const response = await behaviorApi.get('/behavior/reading-history', { params });
  return response.data.data;
}

/**
 * 获取行为统计
 */
export async function getBehaviorStats(params?: {
  startDate?: string;
  endDate?: string;
  eventType?: string;
}): Promise<BehaviorStats> {
  const response = await behaviorApi.get('/behavior/stats', { params });
  return response.data.data;
}

/**
 * 获取用户参与度统计
 */
export async function getEngagementStats(): Promise<EngagementStats> {
  const response = await behaviorApi.get('/behavior/engagement');
  return response.data.data;
}

/**
 * 获取隐式偏好
 */
export async function getImplicitPreferences(preferenceType?: string): Promise<ImplicitPreference[]> {
  const params = preferenceType ? { type: preferenceType } : undefined;
  const response = await behaviorApi.get('/behavior/implicit-preferences', { params });
  return response.data.data;
}

/**
 * 触发学习隐式偏好
 */
export async function learnImplicitPreferences(): Promise<void> {
  await behaviorApi.post('/behavior/learn-preferences');
}

/**
 * 清除阅读历史
 */
export async function clearReadingHistory(): Promise<{ deleted: number }> {
  const response = await behaviorApi.delete('/behavior/reading-history');
  return response.data.data;
}

/**
 * 清除隐式偏好
 */
export async function clearImplicitPreferences(): Promise<{ deleted: number }> {
  const response = await behaviorApi.delete('/behavior/implicit-preferences');
  return response.data.data;
}

/**
 * 收藏内容
 */
export async function bookmarkContent(contentId: string): Promise<void> {
  await behaviorApi.post(`/behavior/${contentId}/bookmark`);
}

/**
 * 取消收藏
 */
export async function unbookmarkContent(contentId: string): Promise<void> {
  await behaviorApi.delete(`/behavior/${contentId}/bookmark`);
}

/**
 * 点赞内容
 */
export async function likeContent(contentId: string): Promise<void> {
  await behaviorApi.post(`/behavior/${contentId}/like`);
}

/**
 * 取消点赞
 */
export async function unlikeContent(contentId: string): Promise<void> {
  await behaviorApi.delete(`/behavior/${contentId}/like`);
}

