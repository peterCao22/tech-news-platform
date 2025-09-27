// 科技新闻聚合平台 - 认证状态管理
// 使用Zustand管理用户认证状态

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 用户信息接口
export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  image?: string;
  role: 'USER' | 'EDITOR' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified?: Date | null;
  timezone?: string;
  language?: string;
  preferences?: any;
  createdAt: Date;
  lastLoginAt?: Date | null;
}

// 认证状态接口
interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // 动作
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  
  // 权限检查
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

// 权限映射
const ROLE_PERMISSIONS = {
  USER: ['read:own_profile', 'update:own_profile'],
  EDITOR: [
    'read:own_profile', 
    'update:own_profile',
    'read:content',
    'create:content',
    'update:content',
    'review:content'
  ],
  ADMIN: [
    'read:own_profile',
    'update:own_profile',
    'read:content',
    'create:content',
    'update:content',
    'delete:content',
    'review:content',
    'read:users',
    'create:users',
    'update:users',
    'delete:users',
    'manage:system'
  ],
};

// 创建认证状态存储
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // 设置用户信息
      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
        });
      },

      // 设置令牌
      setTokens: (token: string, refreshToken?: string) => {
        set({
          token,
          refreshToken: refreshToken || get().refreshToken,
        });
      },

      // 更新用户信息
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      // 登出
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // 检查用户角色
      hasRole: (role: string) => {
        const user = get().user;
        if (!user) return false;
        
        const roleHierarchy = {
          USER: 0,
          EDITOR: 1,
          ADMIN: 2,
        };
        
        return roleHierarchy[user.role] >= roleHierarchy[role as keyof typeof roleHierarchy];
      },

      // 检查用户权限
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        
        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        return userPermissions.includes(permission);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化必要的状态
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 选择器函数
export const useAuth = () => useAuthStore();
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
