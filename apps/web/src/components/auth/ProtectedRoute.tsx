// 科技新闻聚合平台 - 受保护路由组件
// 路由守卫和权限检查

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'USER' | 'EDITOR' | 'ADMIN';
  requirePermission?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  requirePermission,
  fallback,
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    setUser, 
    setTokens,
    setLoading,
    hasRole,
    hasPermission
  } = useAuthStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 初始化认证状态
  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitialized) return;

      try {
        setLoading(true);
        
        // 如果已有用户信息，验证令牌有效性
        if (isAuthenticated && user) {
          const response = await authApi.getCurrentUser();
          
          if (response.success && response.data) {
            setUser(response.data.user);
          } else {
            // 令牌无效，清除认证状态
            useAuthStore.getState().logout();
          }
        }
      } catch (error) {
        // 认证失败，清除状态
        useAuthStore.getState().logout();
        setAuthError('认证验证失败');
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [isAuthenticated, user, setUser, setLoading, isInitialized]);

  // 检查权限
  const checkPermissions = () => {
    if (!requireAuth) return true;
    
    if (!isAuthenticated || !user) {
      return false;
    }

    // 检查角色权限
    if (requireRole && !hasRole(requireRole)) {
      setAuthError(`需要 ${requireRole} 权限`);
      return false;
    }

    // 检查特定权限
    if (requirePermission && !hasPermission(requirePermission)) {
      setAuthError(`缺少必要权限: ${requirePermission}`);
      return false;
    }

    return true;
  };

  // 处理重定向
  const handleRedirect = () => {
    if (redirectTo) {
      router.push(redirectTo);
      return;
    }

    if (!isAuthenticated) {
      // 保存当前路径，登录后返回
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
    } else if (authError) {
      // 权限不足，重定向到无权限页面
      router.push('/unauthorized');
    }
  };

  // 加载中状态
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">验证身份中...</p>
        </div>
      </div>
    );
  }

  // 权限检查
  const hasPermissions = checkPermissions();

  if (!hasPermissions) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // 显示错误信息并准备重定向
    setTimeout(handleRedirect, 2000);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {!isAuthenticated ? '需要登录' : '权限不足'}
          </h2>
          <p className="text-gray-600 mb-4">
            {authError || (!isAuthenticated 
              ? '请先登录您的账户' 
              : '您没有访问此页面的权限'
            )}
          </p>
          <p className="text-sm text-gray-500">
            正在重定向...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// 高阶组件版本
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// 权限检查钩子
export function useRequireAuth(options?: {
  requireRole?: 'USER' | 'EDITOR' | 'ADMIN';
  requirePermission?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, hasRole, hasPermission } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(options?.redirectTo || `/auth/login?returnUrl=${returnUrl}`);
      return;
    }

    if (options?.requireRole && !hasRole(options.requireRole)) {
      router.push('/unauthorized');
      return;
    }

    if (options?.requirePermission && !hasPermission(options.requirePermission)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, router, pathname, hasRole, hasPermission, options]);

  return {
    isAuthenticated,
    user,
    hasRole,
    hasPermission,
  };
}
