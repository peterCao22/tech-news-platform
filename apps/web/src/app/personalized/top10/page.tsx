/**
 * Story 4.1: Personalized TOP10 Page
 * 个性化每日TOP10页面
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import PreferencesService from '@/services/preferencesService';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PersonalizedContentCard from '@/components/content/PersonalizedContentCard';
import { 
  Trophy, 
  Calendar, 
  Loader2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PersonalizedTop10Page() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [top10, setTop10] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  // 检查认证
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // 加载个性化TOP10
  useEffect(() => {
    if (isAuthenticated) {
      loadPersonalizedTop10();
    }
  }, [isAuthenticated, selectedDate]);

  /**
   * 加载个性化TOP10
   */
  const loadPersonalizedTop10 = async () => {
    try {
      setLoading(true);
      const result = await PreferencesService.getPersonalizedTop10(selectedDate);

      setTop10(result.items || []);
      setGeneratedAt(result.generatedAt || new Date().toISOString());
    } catch (error: any) {
      console.error('加载个性化TOP10失败:', error);
      toast.error(error.response?.data?.message || '加载个性化TOP10失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 切换日期
   */
  const handleDateChange = (offset: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + offset);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  /**
   * 格式化日期显示
   */
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return '今天';
    if (diffDays === -1) return '昨天';
    if (diffDays === 1) return '明天';

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* 页面头部 */}
        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Trophy className="w-12 h-12" />
                <div>
                  <h1 className="text-3xl font-bold">个性化每日TOP10</h1>
                  <p className="text-yellow-100 mt-1">
                    为您精心挑选的今日热门内容
                  </p>
                </div>
              </div>

              {/* 设置按钮 */}
              <Link
                href="/settings/preferences"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>偏好设置</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 日期选择 */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDateChange(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center min-w-[150px]">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDateDisplay(selectedDate)}
                    </div>
                    <div className="text-xs text-gray-500">{selectedDate}</div>
                  </div>

                  <button
                    onClick={() => handleDateChange(1)}
                    disabled={
                      new Date(selectedDate).toDateString() ===
                      new Date().toDateString()
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  返回今天
                </button>
              </div>

              {generatedAt && (
                <div className="text-sm text-gray-500">
                  生成时间: {new Date(generatedAt).toLocaleString('zh-CN')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP10 列表 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              <span className="ml-3 text-gray-600">加载个性化TOP10中...</span>
            </div>
          ) : top10.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                暂无TOP10数据
              </h3>
              <p className="text-gray-500 mb-4">
                这一天还没有足够的高质量内容生成TOP10
              </p>
              <Link
                href="/personalized"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                浏览个性化内容
              </Link>
            </div>
          ) : (
            <>
              {/* TOP10 说明 */}
              <div className="mb-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Trophy className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      关于个性化TOP10
                    </h3>
                    <p className="text-sm text-gray-600">
                      基于您的兴趣偏好、关注的公司和信息源权重，我们为您精选了{' '}
                      {top10.length} 条最相关的高质量内容。评分调整详情展示了每条内容被推荐的原因。
                    </p>
                  </div>
                </div>
              </div>

              {/* TOP10 网格 */}
              <div className="space-y-6">
                {top10.map((item, index) => (
                  <div key={item.content.id} className="relative">
                    {/* 排名标识 */}
                    <div className="absolute -left-4 top-4 z-10">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg
                        ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : ''}
                        ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : ''}
                        ${index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : ''}
                        ${index > 2 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : ''}
                      `}
                      >
                        {item.rank || index + 1}
                      </div>
                    </div>

                    {/* 内容卡片 */}
                    <div className="ml-8">
                      <PersonalizedContentCard
                        content={item.content}
                        onClick={() => router.push(`/content/${item.content.id}`)}
                      />
                    </div>

                    {/* 推荐原因 */}
                    {item.personalizedReason && (
                      <div className="ml-8 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs font-medium text-blue-900">
                          💡 推荐原因: {item.personalizedReason}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 底部提示 */}
              <div className="mt-12 text-center">
                <p className="text-sm text-gray-500">
                  每天的TOP10会根据您的最新偏好自动更新
                </p>
                <Link
                  href="/settings/preferences"
                  className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center mt-2"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  调整偏好设置
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

