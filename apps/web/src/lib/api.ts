// 科技新闻聚合平台 - API客户端
// 统一的API请求处理和错误管理

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// API错误接口
export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// 创建axios实例
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      const { token } = useAuthStore.getState();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 添加请求ID用于调试
      config.headers['X-Request-ID'] = Math.random().toString(36).substring(7);

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // 处理401错误（未授权）
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const { refreshToken, setTokens, logout } = useAuthStore.getState();

        if (refreshToken) {
          try {
            // 尝试刷新令牌
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
              { refreshToken }
            );

            const { token } = response.data.data;
            setTokens(token);

            // 重试原始请求
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          } catch (refreshError) {
            // 刷新令牌失败，登出用户
            logout();
            toast.error('登录已过期，请重新登录');
            
            // 重定向到登录页面
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
          }
        } else {
          // 没有刷新令牌，直接登出
          logout();
          toast.error('请先登录');
          
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      }

      // 处理其他错误
      const apiError: ApiError = {
        success: false,
        message: error.response?.data?.message || '请求失败',
        code: error.response?.data?.code || 'UNKNOWN_ERROR',
        errors: error.response?.data?.errors,
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

// 创建API客户端实例
export const apiClient = createApiClient();

// API请求包装器
export class ApiService {
  // GET请求
  static async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  // POST请求
  static async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // PUT请求
  static async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // PATCH请求
  static async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // DELETE请求
  static async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  }
}

// 认证API
export const authApi = {
  // 用户注册
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    acceptTerms: boolean;
  }) => ApiService.post('/api/auth/register', data),

  // 用户登录
  login: (data: {
    email: string;
    password: string;
    remember?: boolean;
  }) => ApiService.post('/api/auth/login', data),

  // 用户登出
  logout: () => ApiService.post('/api/auth/logout'),

  // 刷新令牌
  refreshToken: (refreshToken: string) => 
    ApiService.post('/api/auth/refresh', { refreshToken }),

  // 获取当前用户信息
  getCurrentUser: () => ApiService.get('/api/auth/me'),

  // 邮箱验证
  verifyEmail: (token: string) => 
    ApiService.post('/api/auth/verify-email', { token }),

  // 重新发送验证邮件
  resendVerification: (email: string) => 
    ApiService.post('/api/auth/resend-verification', { email }),

  // 忘记密码
  forgotPassword: (email: string) => 
    ApiService.post('/api/auth/forgot-password', { email }),

  // 重置密码
  resetPassword: (data: {
    token: string;
    password: string;
    confirmPassword: string;
  }) => ApiService.post('/api/auth/reset-password', data),

  // 更改密码
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => ApiService.post('/api/auth/change-password', data),

  // 检查邮箱是否存在
  checkEmail: (email: string) => 
    ApiService.post('/api/auth/check-email', { email }),
};

// 用户API
export const userApi = {
  // 获取用户资料
  getProfile: () => ApiService.get('/api/users/profile'),

  // 更新用户资料
  updateProfile: (data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    timezone?: string;
    language?: string;
  }) => ApiService.put('/api/users/profile', data),

  // 更新用户偏好设置
  updatePreferences: (preferences: any) => 
    ApiService.put('/api/users/preferences', { preferences }),

  // 获取用户活动日志
  getActivities: (params?: {
    page?: number;
    limit?: number;
  }) => ApiService.get('/api/users/activities', { params }),

  // 删除用户账户
  deleteAccount: () => ApiService.delete('/api/users/account'),
};
