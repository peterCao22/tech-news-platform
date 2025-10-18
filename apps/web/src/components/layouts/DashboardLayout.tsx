/**
 * Dashboard Layout Component
 * 统一的仪表板布局，包含侧边栏和主内容区域
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  X,
  Key,
  ClipboardCheck,
  Home,
  Shield,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 处理登出
  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      toast.success('已安全登出');
      router.push('/auth/login');
    } catch (error) {
      logout();
      router.push('/auth/login');
    }
  };

  // 检查当前路径是否激活
  const isActive = (path: string) => {
    return pathname === path;
  };

  // 菜单项配置
  const menuItems = [
    { href: '/dashboard', icon: Home, label: '仪表板', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/search', icon: Search, label: '高级搜索', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/personalized', icon: Star, label: '个性化推荐', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/personalized/top10', icon: TrendingUp, label: '每日TOP10', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/history', icon: BarChart3, label: '历史内容分析与趋势', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/behavior/history', icon: Clock, label: '阅读历史', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/sources', icon: Rss, label: 'RSS源管理', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/content', icon: FileText, label: '内容管理', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/review', icon: ClipboardCheck, label: '内容审核工作台', roles: ['EDITOR', 'ADMIN'] },
    { href: '/filter-rules', icon: Filter, label: '智能筛选规则', roles: ['ADMIN'] },
    { href: '/content-management/create', icon: FileText, label: '手工内容管理', roles: ['ADMIN'] },
    { href: '/settings/preferences', icon: Settings, label: '个性化偏好', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/settings/privacy', icon: Shield, label: '隐私与数据', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/settings/notifications', icon: Bell, label: '通知设置', roles: ['USER', 'EDITOR', 'ADMIN'] },
    { href: '/api-configs', icon: Key, label: 'API配置管理', roles: ['ADMIN'] },
    { href: '/profile', icon: User, label: '个人资料', roles: ['USER', 'EDITOR', 'ADMIN'] },
  ];

  // 过滤用户可见的菜单项
  const visibleMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧：Logo 和标题 */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 mr-2"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <Link href="/dashboard" className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">
                  科技新闻聚合平台
                </span>
              </Link>
            </div>

            {/* 右侧：用户信息 */}
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'ADMIN' ? '管理员' : user?.role === 'EDITOR' ? '编辑' : '用户'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
                  title="退出登录"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* 侧边栏 */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-30 w-64 h-screen lg:h-[calc(100vh-4rem)]
            bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            mt-16 lg:mt-0
          `}
        >
          <nav className="h-full overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="px-3 space-y-1">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md
                      transition-colors duration-150
                      ${active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        mr-3 flex-shrink-0 h-5 w-5
                        ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* 遮罩层（移动端） */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 主内容区域 */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

