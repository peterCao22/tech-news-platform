/**
 * Story 4.1: Personalized Content Page
 * 个性化内容列表页面
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import PreferencesService from '@/services/preferencesService';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PersonalizedContentCard from '@/components/content/PersonalizedContentCard';
import { 
  Sparkles, 
  RefreshCw, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PersonalizedContentPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 过滤器
  const [category, setCategory] = useState('');
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // 检查认证
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // 加载个性化内容
  useEffect(() => {
    if (isAuthenticated) {
      loadPersonalizedContent();
    }
  }, [isAuthenticated, pagination.page]);

  /**
   * 加载个性化内容
   */
  const loadPersonalizedContent = async () => {
    try {
      setLoading(true);
      const result = await PreferencesService.getPersonalizedContent({
        page: pagination.page,
        limit: pagination.limit,
        category: category || undefined,
        minScore: minScore || undefined,
      });

      setContents(result.items || []);
      setPagination(result.pagination);
    } catch (error: any) {
      console.error('加载个性化内容失败:', error);
      toast.error(error.response?.data?.message || '加载个性化内容失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 刷新内容
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPersonalizedContent();
    setRefreshing(false);
    toast.success('内容已刷新');
  };

  /**
   * 应用过滤器
   */
  const handleApplyFilters = async () => {
    setPagination({ ...pagination, page: 1 });
    await loadPersonalizedContent();
    toast.success('过滤器已应用');
  };

  /**
   * 清除过滤器
   */
  const handleClearFilters = async () => {
    setCategory('');
    setMinScore(undefined);
    setPagination({ ...pagination, page: 1 });
    await loadPersonalizedContent();
    toast.success('过滤器已清除');
  };

  /**
   * 分页处理
   */
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* 页面头部 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Sparkles className="w-10 h-10" />
                <div>
                  <h1 className="text-3xl font-bold">个性化推荐</h1>
                  <p className="text-purple-100 mt-1">
                    基于您的偏好智能推荐的内容
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center space-x-2">
                <Link
                  href="/settings/preferences"
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>偏好设置</span>
                </Link>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>过滤</span>
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  <span>刷新</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 过滤器面板 */}
        {showFilters && (
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分类
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">全部分类</option>
                    <option value="technology">科技</option>
                    <option value="business">商业</option>
                    <option value="finance">金融</option>
                    <option value="ai">人工智能</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最低评分
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={minScore || ''}
                    onChange={(e) =>
                      setMinScore(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="例如: 80"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <button
                    onClick={handleApplyFilters}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    应用过滤
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    清除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 内容列表 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">加载个性化内容中...</span>
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                暂无个性化推荐
              </h3>
              <p className="text-gray-500 mb-4">
                请先配置您的偏好设置，然后我们会为您推荐相关内容
              </p>
              <Link
                href="/settings/preferences"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                配置偏好
              </Link>
            </div>
          ) : (
            <>
              {/* 统计信息 */}
              <div className="mb-6 text-sm text-gray-600">
                共找到 <span className="font-semibold">{pagination.total}</span> 条个性化推荐内容
              </div>

              {/* 内容网格 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {contents.map((content) => (
                  <PersonalizedContentCard
                    key={content.id}
                    content={content}
                    onClick={() => router.push(`/content/${content.id}`)}
                  />
                ))}
              </div>

              {/* 分页 */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="px-4 py-2 text-sm text-gray-700">
                    第 {pagination.page} / {pagination.totalPages} 页
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

