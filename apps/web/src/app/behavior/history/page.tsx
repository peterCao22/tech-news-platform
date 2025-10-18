'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { 
  getReadingHistory, 
  bookmarkContent, 
  unbookmarkContent,
  clearReadingHistory,
  type ReadingHistoryItem 
} from '@/services/behaviorService';
import { 
  Clock, 
  Bookmark, 
  BookmarkCheck,
  Eye, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReadingHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<{
    isBookmarked?: boolean;
    isCompleted?: boolean;
  }>({});

  // 加载阅读历史
  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await getReadingHistory({
        page,
        limit: 10,
        ...filter,
      });
      
      setHistory(response.items || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Failed to load reading history:', error);
      toast.error('加载阅读历史失败');
      setHistory([]); // 确保出错时也设置为空数组
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // 切换收藏
  const toggleBookmark = async (item: ReadingHistoryItem) => {
    try {
      if (item.isBookmarked) {
        await unbookmarkContent(item.contentId);
        toast.success('已取消收藏');
      } else {
        await bookmarkContent(item.contentId);
        toast.success('已收藏');
      }
      
      // 重新加载
      loadHistory();
    } catch (error: any) {
      console.error('Toggle bookmark failed:', error);
      toast.error('操作失败');
    }
  };

  // 清除历史
  const handleClearHistory = async () => {
    if (!confirm('确定要清除所有阅读历史吗？此操作不可撤销。')) {
      return;
    }

    try {
      const result = await clearReadingHistory();
      toast.success(`已清除 ${result.deleted} 条阅读历史`);
      loadHistory();
    } catch (error: any) {
      console.error('Clear history failed:', error);
      toast.error('清除历史失败');
    }
  };

  // 格式化时长
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  useEffect(() => {
    loadHistory();
  }, [page, filter]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">阅读历史</h1>
            <p className="text-sm text-gray-600 mt-1">
              查看和管理您的阅读记录
            </p>
          </div>
          
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            清除历史
          </button>
        </div>

        {/* 筛选器 */}
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <Filter className="h-5 w-5 text-gray-500" />
          
          <button
            onClick={() => setFilter({})}
            className={`px-4 py-2 text-sm rounded-lg border ${
              !filter.isBookmarked && !filter.isCompleted
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          
          <button
            onClick={() => setFilter({ isBookmarked: true })}
            className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg border ${
              filter.isBookmarked
                ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <BookmarkCheck className="h-4 w-4" />
            已收藏
          </button>
          
          <button
            onClick={() => setFilter({ isCompleted: true })}
            className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg border ${
              filter.isCompleted
                ? 'bg-green-50 text-green-600 border-green-200'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Star className="h-4 w-4" />
            已读完
          </button>
        </div>

        {/* 阅读历史列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">暂无阅读历史</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* 缩略图 */}
                  {item.content.imageUrl && (
                    <img
                      src={item.content.imageUrl}
                      alt={item.content.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  
                  {/* 内容信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 
                          className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer"
                          onClick={() => router.push(`/content/${item.contentId}`)}
                        >
                          {item.content.title}
                        </h3>
                        
                        {item.content.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {item.content.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(item.totalDuration)}
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            阅读{item.readCount}次
                          </span>
                          
                          <span>
                            滚动深度: {Math.round(item.maxScrollDepth * 100)}%
                          </span>
                          
                          {item.isCompleted && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                              已读完
                            </span>
                          )}
                          
                          <span className="text-gray-400">
                            {formatDate(item.lastReadAt)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleBookmark(item)}
                          className={`p-2 rounded-lg border ${
                            item.isBookmarked
                              ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
                              : 'text-gray-400 border-gray-200 hover:bg-gray-50'
                          }`}
                          title={item.isBookmarked ? '取消收藏' : '收藏'}
                        >
                          {item.isBookmarked ? (
                            <BookmarkCheck className="h-5 w-5" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </button>
                        
                        {item.content.url && (
                          <button
                            onClick={() => window.open(item.content.url, '_blank')}
                            className="p-2 text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50"
                            title="查看原文"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </button>
            
            <span className="text-sm text-gray-600">
              第 {page} / {totalPages} 页
            </span>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

