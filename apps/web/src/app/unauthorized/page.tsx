// 科技新闻聚合平台 - 无权限访问页面
// 权限不足时显示的页面

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 头部 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            科技新闻聚合平台
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            AI驱动的智能新闻筛选系统
          </p>
        </div>

        {/* 无权限提示卡片 */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">访问被拒绝</CardTitle>
            <CardDescription>
              您没有访问此页面的权限
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isAuthenticated && user ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">当前账户信息：</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">邮箱：</span>{user.email}</p>
                  <p><span className="font-medium">角色：</span>{user.role}</p>
                  <p><span className="font-medium">状态：</span>{user.status}</p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  您当前未登录，请先登录您的账户。
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">可能的原因：</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  您的账户权限不足以访问此页面
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  您的账户可能已被暂停或限制
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  此功能需要更高级别的权限
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  您的登录会话可能已过期
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">建议操作：</h4>
              <div className="grid gap-3">
                {!isAuthenticated ? (
                  <Link href="/auth/login">
                    <Button className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      登录账户
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    返回上一页
                  </Button>
                )}

                <Link href="/">
                  <Button variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    返回首页
                  </Button>
                </Link>

                {isAuthenticated && (
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full">
                      查看个人设置
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* 联系支持 */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 text-center">
                如果您认为这是一个错误，请{' '}
                <Link
                  href="/support"
                  className="text-primary-600 hover:text-primary-500 inline-flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  联系客服
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            错误代码: 403 - Forbidden
          </p>
        </div>
      </div>
    </div>
  );
}
