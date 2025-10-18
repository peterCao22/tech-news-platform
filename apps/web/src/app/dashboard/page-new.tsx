// 科技新闻聚合平台 - 用户仪表板
// 登录后的主页面，显示个性化内容和功能

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  Clock,
  Star,
  BookOpen,
} from 'lucide-react';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tech-news-platform/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  // 如果正在加载或未认证，显示加载状态
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎回来，{user.name}！
          </h1>
          <p className="text-gray-600">
            这里是您的个人仪表板，查看最新的科技资讯和个性化内容。
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日阅读</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 比昨天
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本周新闻</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                +12% 比上周
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">我的收藏</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +4 本周新增
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均阅读时间</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.5 min</div>
              <p className="text-xs text-muted-foreground">
                每篇文章
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 今日热门 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>今日热门</CardTitle>
            <CardDescription>最受关注的科技新闻</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    OpenAI发布GPT-5，性能提升显著
                  </p>
                  <p className="text-sm text-gray-500">
                    2小时前 · TechCrunch · AI技术
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    苹果新品发布会定档，iPhone 16系列即将亮相
                  </p>
                  <p className="text-sm text-gray-500">
                    5小时前 · MacRumors · 产品发布
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    特斯拉全自动驾驶功能迎来重大更新
                  </p>
                  <p className="text-sm text-gray-500">
                    8小时前 · The Verge · 自动驾驶
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/sources')}
                className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors text-center"
              >
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">RSS源管理</p>
              </button>

              <button
                onClick={() => router.push('/content')}
                className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors text-center"
              >
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">内容管理</p>
              </button>

              {(user?.role === 'EDITOR' || user?.role === 'ADMIN') && (
                <button
                  onClick={() => router.push('/review')}
                  className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors text-center"
                >
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">内容审核</p>
                </button>
              )}

              <button
                onClick={() => router.push('/profile')}
                className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors text-center"
              >
                <Star className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">我的收藏</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

