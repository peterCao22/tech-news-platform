// 科技新闻聚合平台 - 用户仪表板
// 登录后的主页面，显示个性化内容和功能

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  BookOpen,
  Rss,
  FileText, 
  TrendingUp, 
  Clock,
  Star,
  Filter,
  Search,
  Menu,
  X
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';
import { Button } from '@tech-news-platform/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tech-news-platform/ui';
import { Input } from '@tech-news-platform/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  // 处理登出
  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      toast.success('已安全登出');
      router.push('/auth/login');
    } catch (error) {
      // 即使API调用失败，也要清除本地状态
      logout();
      router.push('/auth/login');
    }
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧 - Logo和标题 */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex-shrink-0 ml-2 md:ml-0">
                <h1 className="text-xl font-bold text-gray-900">科技新闻聚合平台</h1>
              </div>
            </div>

            {/* 中间 - 搜索框 */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="搜索新闻..."
                  className="pl-10 pr-4"
                />
              </div>
            </div>

            {/* 右侧 - 用户菜单 */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out`}>
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                <Link
                  href="/dashboard"
                  className="bg-blue-100 text-blue-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <TrendingUp className="text-blue-500 mr-3 flex-shrink-0 h-5 w-5" />
                  仪表板
                </Link>
                
                <Link
                  href="/news"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <BookOpen className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                  新闻列表
                </Link>
                
                <Link
                  href="/favorites"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <Star className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                  我的收藏
                </Link>
                
                <Link
                  href="/sources"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <Rss className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                  RSS源管理
                </Link>
                
                <Link
                  href="/content"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <FileText className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                  内容管理
                </Link>
                
                <Link
                  href="/profile"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <Settings className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                  个人设置
                </Link>
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-gray-900"
              >
                <LogOut className="mr-3 h-4 w-4" />
                退出登录
              </Button>
            </div>
          </div>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 md:ml-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* 欢迎信息 */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  欢迎回来，{user.name || user.email.split('@')[0]}！
                </h1>
                <p className="mt-1 text-sm text-gray-600">
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
                    <CardTitle className="text-sm font-medium">收藏文章</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">
                      +1 本周新增
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">关注话题</CardTitle>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">5</div>
                    <p className="text-xs text-muted-foreground">
                      AI, 区块链, 云计算...
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">阅读时长</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2.5h</div>
                    <p className="text-xs text-muted-foreground">
                      本周总计
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 最新新闻 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>推荐阅读</CardTitle>
                    <CardDescription>
                      基于您的兴趣为您推荐的文章
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="flex space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              人工智能在医疗领域的最新突破和应用前景
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              2小时前 · AI科技
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Link href="/news">
                        <Button variant="outline" className="w-full">
                          查看更多新闻
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>快速操作</CardTitle>
                    <CardDescription>
                      常用功能和设置
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Link href="/profile">
                        <Button variant="outline" className="w-full h-20 flex flex-col">
                          <User className="h-6 w-6 mb-2" />
                          个人资料
                        </Button>
                      </Link>
                      
                      <Link href="/settings">
                        <Button variant="outline" className="w-full h-20 flex flex-col">
                          <Settings className="h-6 w-6 mb-2" />
                          偏好设置
                        </Button>
                      </Link>
                      
                      <Link href="/favorites">
                        <Button variant="outline" className="w-full h-20 flex flex-col">
                          <Star className="h-6 w-6 mb-2" />
                          我的收藏
                        </Button>
                      </Link>
                      
                      <Button variant="outline" className="w-full h-20 flex flex-col">
                        <Bell className="h-6 w-6 mb-2" />
                        通知设置
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 移动端侧边栏遮罩 */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
