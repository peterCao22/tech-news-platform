'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { contentApi, Content, ContentFilter } from '@/services/api/content';
import { sourcesApi, Source } from '@/services/api/sources';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tech-news-platform/ui';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  ExternalLink, 
  Calendar, 
  Tag, 
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// 状态图标映射
const statusIcons = {
  RAW: <FileText className="h-4 w-4 text-gray-500" />,
  PROCESSING: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
  PROCESSED: <CheckCircle className="h-4 w-4 text-green-500" />,
  REVIEWED: <Eye className="h-4 w-4 text-purple-500" />,
  PUBLISHED: <CheckCircle className="h-4 w-4 text-green-600" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
};

// 状态文本映射
const statusText = {
  RAW: '原始',
  PROCESSING: '处理中',
  PROCESSED: '已处理',
  REVIEWED: '已审核',
  PUBLISHED: '已发布',
  REJECTED: '已拒绝',
};

// 状态颜色映射
const statusColors = {
  RAW: 'bg-gray-100 text-gray-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  PROCESSED: 'bg-green-100 text-green-800',
  REVIEWED: 'bg-purple-100 text-purple-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function ContentPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // 状态管理
  const [contents, setContents] = useState<Content[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 过滤器状态
  const [filters, setFilters] = useState<ContentFilter>({
    page: 1,
    limit: 20,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 加载内容列表
  const loadContents = async (newFilters?: ContentFilter) => {
    try {
      setLoading(true);
      const currentFilters = newFilters || filters;
      const response = await contentApi.getContents(currentFilters);
      
      const contents = Array.isArray(response.data) ? response.data : [];
      setContents(contents);
      setPagination((response as any).pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (error: any) {
      console.error('加载内容失败:', error);
      toast.error(error.message || '加载内容失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载RSS源列表（用于过滤器）
  const loadSources = async () => {
    try {
      const response = await sourcesApi.getSources();
      setSources(response.data || []);
    } catch (error: any) {
      console.error('加载RSS源失败:', error);
    }
  };

  // 刷新内容
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadContents();
      toast.success('内容已刷新');
    } catch (error) {
      toast.error('刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 搜索内容
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    const newFilters = {
      ...filters,
      search: searchQuery.trim(),
      page: 1,
    };
    setFilters(newFilters);
    await loadContents(newFilters);
  };

  // 清除搜索
  const handleClearSearch = async () => {
    setSearchQuery('');
    const newFilters = {
      ...filters,
      search: undefined,
      page: 1,
    };
    setFilters(newFilters);
    await loadContents(newFilters);
  };

  // 应用过滤器
  const handleApplyFilters = async (newFilters: Partial<ContentFilter>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 1, // 重置到第一页
    };
    setFilters(updatedFilters);
    await loadContents(updatedFilters);
    setShowFilters(false);
  };

  // 分页处理
  const handlePageChange = async (newPage: number) => {
    const newFilters = {
      ...filters,
      page: newPage,
    };
    setFilters(newFilters);
    await loadContents(newFilters);
  };

  // 更新内容状态
  const handleUpdateStatus = async (contentId: string, newStatus: string) => {
    try {
      await contentApi.updateContentStatus(contentId, newStatus);
      toast.success('状态更新成功');
      await loadContents(); // 重新加载列表
    } catch (error: any) {
      console.error('更新状态失败:', error);
      toast.error(error.message || '更新状态失败');
    }
  };

  // 格式化时间
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 格式化相对时间
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return '未知';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return formatDate(dateString);
  };

  // 截取文本
  const truncateText = (text?: string, maxLength: number = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadContents();
      loadSources();
    }
  }, [isAuthenticated]);

  if (loading && contents.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">加载内容...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 页面标题和操作 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">内容管理</h1>
              <p className="text-gray-600 mt-1">查看和管理抓取到的新闻内容</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
              >
                <Filter className="h-4 w-4 mr-2" />
                过滤器
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </div>

          {/* 搜索栏 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="搜索标题、内容或标签..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                  搜索
                </Button>
                {filters.search && (
                  <Button onClick={handleClearSearch} variant="outline">
                    清除
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 过滤器面板 */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle>过滤选项</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 状态过滤 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      状态
                    </label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => handleApplyFilters({ status: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">全部状态</option>
                      <option value="RAW">原始</option>
                      <option value="PROCESSING">处理中</option>
                      <option value="PROCESSED">已处理</option>
                      <option value="REVIEWED">已审核</option>
                      <option value="PUBLISHED">已发布</option>
                      <option value="REJECTED">已拒绝</option>
                    </select>
                  </div>

                  {/* 来源过滤 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      来源
                    </label>
                    <select
                      value={filters.sourceId || ''}
                      onChange={(e) => handleApplyFilters({ sourceId: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">全部来源</option>
                      {sources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 分类过滤 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分类
                    </label>
                    <select
                      value={filters.category || ''}
                      onChange={(e) => handleApplyFilters({ category: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">全部分类</option>
                      <option value="tech">科技</option>
                      <option value="business">商业</option>
                      <option value="ai">人工智能</option>
                      <option value="startup">创业</option>
                      <option value="programming">编程</option>
                      <option value="design">设计</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 内容列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>内容列表</span>
                <span className="text-sm font-normal text-gray-500">
                  共 {pagination.total} 条内容
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无内容</h3>
                  <p className="text-gray-600 mb-4">
                    {filters.search || filters.status || filters.sourceId 
                      ? '没有找到符合条件的内容' 
                      : '还没有抓取到任何内容，请先添加RSS源并进行抓取'}
                  </p>
                  {!filters.search && !filters.status && !filters.sourceId && (
                    <Button onClick={() => router.push('/sources')}>
                      管理RSS源
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {contents.map((content) => (
                    <div key={content.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                              onClick={() => router.push(`/content/${content.id}`)}
                            >
                              {content.title}
                            </h3>
                            <div className="flex items-center gap-1">
                              {statusIcons[content.status]}
                              <span className={`px-2 py-1 text-xs rounded-full ${statusColors[content.status]}`}>
                                {statusText[content.status]}
                              </span>
                            </div>
                          </div>
                          
                          {content.description && (
                            <p className="text-gray-600 mb-3 leading-relaxed">
                              {truncateText(content.description)}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{content.source.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatRelativeTime(content.publishedAt || content.createdAt)}</span>
                            </div>
                            {content.category && (
                              <div className="flex items-center gap-1">
                                <Tag className="h-4 w-4" />
                                <span>{content.category}</span>
                              </div>
                            )}
                            {content.imageUrl && (
                              <div className="flex items-center gap-1">
                                <ImageIcon className="h-4 w-4" />
                                <span>有图片</span>
                              </div>
                            )}
                          </div>
                          
                          {content.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {content.tags.slice(0, 5).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {content.tags.length > 5 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{content.tags.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {content.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(content.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              查看原文
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/content/${content.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            详情
                          </Button>
                          
                          {/* 状态更新下拉菜单 */}
                          <select
                            value={content.status}
                            onChange={(e) => handleUpdateStatus(content.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="RAW">原始</option>
                            <option value="PROCESSING">处理中</option>
                            <option value="PROCESSED">已处理</option>
                            <option value="REVIEWED">已审核</option>
                            <option value="PUBLISHED">已发布</option>
                            <option value="REJECTED">已拒绝</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    显示第 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                    共 {pagination.total} 条
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            variant={pageNum === pagination.page ? "default" : "outline"}
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
