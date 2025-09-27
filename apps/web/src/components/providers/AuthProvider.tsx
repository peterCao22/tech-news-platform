// 科技新闻聚合平台 - 认证提供者
// 全局认证状态管理和初始化

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const { 
    isAuthenticated, 
    user, 
    setUser, 
    setLoading, 
    logout,
    updateUser
  } = useAuthStore();
  
  const [isInitialized, setIsInitialized] = useState(false);

  // 公开路由，不需要认证检查
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/terms',
    '/privacy',
    '/support',
    '/about',
  ];

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // 初始化认证状态
  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitialized) return;

      try {
        setLoading(true);

        // 如果有认证状态，验证用户信息
        if (isAuthenticated && user) {
          try {
            const response = await authApi.getCurrentUser();
            
            if (response.success && response.data) {
              // 更新用户信息
              const userData = response.data.user;
              setUser(userData);
              
              // 检查用户状态
              if (userData.status === 'SUSPENDED') {
                logout();
                // 可以显示账户被暂停的提示
              }
            } else {
              // 用户信息获取失败，清除认证状态
              logout();
            }
          } catch (error) {
            // API调用失败，可能是网络问题或令牌过期
            console.warn('Failed to verify user authentication:', error);
            
            // 如果不是公开路由，清除认证状态
            if (!isPublicRoute) {
              logout();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [isAuthenticated, user, setUser, setLoading, logout, isInitialized, isPublicRoute]);

  // 监听路由变化，更新用户活动
  useEffect(() => {
    if (isAuthenticated && user && isInitialized) {
      // 记录用户活动（可选）
      // 这里可以调用API记录用户的页面访问
    }
  }, [pathname, isAuthenticated, user, isInitialized]);

  // 如果还在初始化且不是公开路由，显示加载状态
  if (!isInitialized && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">初始化中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// 认证状态钩子
export function useAuth() {
  const authStore = useAuthStore();
  
  return {
    ...authStore,
    isReady: true, // 可以添加更多的就绪状态检查
  };
}

// 用户信息钩子
export function useUser() {
  const { user, isAuthenticated } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    isAdmin: user?.role === 'ADMIN',
    isEditor: user?.role === 'EDITOR' || user?.role === 'ADMIN',
    isActive: user?.status === 'ACTIVE',
    isEmailVerified: !!user?.emailVerified,
  };
}
