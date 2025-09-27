// 科技新闻聚合平台 - 角色权限守卫组件
// 基于角色和权限的条件渲染

'use client';

import { useAuthStore } from '@/stores/auth.store';

interface RoleGuardProps {
  children: React.ReactNode;
  role?: 'USER' | 'EDITOR' | 'ADMIN';
  permission?: string;
  fallback?: React.ReactNode;
  requireAll?: boolean; // 是否需要同时满足角色和权限
}

export function RoleGuard({
  children,
  role,
  permission,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) {
  const { user, hasRole, hasPermission } = useAuthStore();

  if (!user) {
    return <>{fallback}</>;
  }

  const hasRequiredRole = role ? hasRole(role) : true;
  const hasRequiredPermission = permission ? hasPermission(permission) : true;

  let shouldRender = false;

  if (requireAll) {
    // 需要同时满足角色和权限
    shouldRender = hasRequiredRole && hasRequiredPermission;
  } else {
    // 满足其中一个即可（如果都没有指定，则默认通过）
    if (!role && !permission) {
      shouldRender = true;
    } else if (role && !permission) {
      shouldRender = hasRequiredRole;
    } else if (!role && permission) {
      shouldRender = hasRequiredPermission;
    } else {
      shouldRender = hasRequiredRole || hasRequiredPermission;
    }
  }

  return shouldRender ? <>{children}</> : <>{fallback}</>;
}

// 管理员专用组件
export function AdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <RoleGuard role="ADMIN" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// 编辑者及以上权限组件
export function EditorOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <RoleGuard role="EDITOR" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// 已认证用户组件
export function AuthenticatedOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  const { isAuthenticated } = useAuthStore();
  
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}

// 未认证用户组件（如登录/注册链接）
export function GuestOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  const { isAuthenticated } = useAuthStore();
  
  return !isAuthenticated ? <>{children}</> : <>{fallback}</>;
}
