// 科技新闻聚合平台 - 受保护路由组件
// 用于保护需要认证的页面

'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'USER' | 'ADMIN';
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    // 如果还在加载认证状态，等待
    if (isLoading) {
      return;
    }

    // 如果需要认证但用户未认证
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // 如果需要特定角色但用户角色不匹配
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }

    // 暂时取消强制邮箱验证，允许PENDING状态用户访问
    // if (isAuthenticated && user && !user.emailVerified && user.status === 'PENDING') {
    //   router.push('/auth/verify-email');
    //   return;
    // }
  }, [isAuthenticated, user, isLoading, requireAuth, requiredRole, redirectTo, router]);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">验证身份中...</p>
        </div>
      </div>
    );
  }

  // 如果需要认证但用户未认证，不渲染内容
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // 如果需要特定角色但用户角色不匹配，不渲染内容
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // 渲染受保护的内容
  return <>{children}</>;
}