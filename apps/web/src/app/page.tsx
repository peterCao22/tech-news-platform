// 科技新闻聚合平台 - 首页
// 根据用户认证状态重定向到相应页面

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // 如果用户已认证，重定向到仪表板
    if (isAuthenticated && user) {
      router.push('/dashboard');
    } else {
      // 未认证用户重定向到登录页面
      router.push('/auth/login');
    }
  }, [isAuthenticated, user, router]);

  // 显示加载状态
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">正在加载...</p>
      </div>
    </div>
  );
}
