'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { sourcesApi, Source } from '@/services/api/sources';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tech-news-platform/ui';
import { Plus, RefreshCw, Settings, Trash2, ExternalLink, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// 状态图标映射
const statusIcons = {
  ACTIVE: <CheckCircle className="h-4 w-4 text-green-500" />,
  INACTIVE: <Clock className="h-4 w-4 text-gray-500" />,
  ERROR: <XCircle className="h-4 w-4 text-red-500" />,
  RATE_LIMITED: <AlertCircle className="h-4 w-4 text-yellow-500" />,
};

// 状态文本映射
const statusText = {
  ACTIVE: '活跃',
  INACTIVE: '未激活',
  ERROR: '错误',
  RATE_LIMITED: '限流',
};

export default function SourcesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // 加载RSS源列表
  const loadSources = async () => {
    try {
      setLoading(true);
      const response = await sourcesApi.getSources();
      setSources(response.data || []);
    } catch (error: any) {
      console.error('加载RSS源失败:', error);
      toast.error(error.message || '加载RSS源失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await sourcesApi.getSourceStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('加载统计信息失败:', error);
    }
  };

  // 刷新所有数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadSources(), loadStats()]);
      toast.success('数据已刷新');
    } catch (error) {
      toast.error('刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 删除RSS源
  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`确定要删除RSS源"${name}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await sourcesApi.deleteSource(id);
      toast.success('RSS源已删除');
      loadSources(); // 重新加载列表
    } catch (error: any) {
      console.error('删除RSS源失败:', error);
      toast.error(error.message || '删除RSS源失败');
    }
  };

  // 手动抓取RSS源
  const handleFetchSource = async (id: string, name: string) => {
    try {
      toast.loading(`正在抓取"${name}"...`, { id: 'fetch-' + id });
      const response = await sourcesApi.fetchSource(id);
      
      if (response.data?.success) {
        toast.success(`抓取成功！获得 ${response.data.newItemsCount} 条新内容`, { id: 'fetch-' + id });
      } else {
        toast.error(`抓取失败: ${response.data?.error || '未知错误'}`, { id: 'fetch-' + id });
      }
      
      loadSources(); // 重新加载以更新统计信息
    } catch (error: any) {
      console.error('抓取RSS源失败:', error);
      toast.error(error.message || '抓取RSS源失败', { id: 'fetch-' + id });
    }
  };

  // 批量抓取所有源
  const handleFetchAllSources = async () => {
    try {
      toast.loading('正在抓取所有活跃RSS源...', { id: 'fetch-all' });
      const response = await sourcesApi.fetchAllSources();
      
      if (response.data) {
        const { totalSources, successCount, totalNewItems, errors } = response.data;
        
        if (errors.length === 0) {
          toast.success(`批量抓取完成！处理了 ${totalSources} 个源，获得 ${totalNewItems} 条新内容`, { id: 'fetch-all' });
        } else {
          toast.error(`批量抓取完成，但有 ${errors.length} 个源出现错误`, { id: 'fetch-all' });
        }
      }
      
      loadSources(); // 重新加载以更新统计信息
    } catch (error: any) {
      console.error('批量抓取失败:', error);
      toast.error(error.message || '批量抓取失败', { id: 'fetch-all' });
    }
  };

  // 格式化时间
  const formatDate = (dateString?: string) => {
    if (!dateString) return '从未';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSources();
      loadStats();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">加载RSS源...</p>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RSS源管理</h1>
              <p className="text-gray-600 mt-1">管理您的新闻源和内容抓取</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button
                onClick={handleFetchAllSources}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                抓取所有
              </Button>
              <Button
                onClick={() => router.push('/sources/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加RSS源
              </Button>
            </div>
          </div>

          {/* 统计信息 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Settings className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">总源数</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.sources?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">活跃源</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.sources?.active || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">错误源</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.sources?.error || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <RefreshCw className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">总内容</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.content?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* RSS源列表 */}
          <Card>
            <CardHeader>
              <CardTitle>RSS源列表</CardTitle>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无RSS源</h3>
                  <p className="text-gray-600 mb-4">开始添加您的第一个RSS源来获取新闻内容</p>
                  <Button onClick={() => router.push('/sources/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加RSS源
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sources.map((source) => (
                    <div key={source.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{source.name}</h3>
                            <div className="flex items-center gap-1">
                              {statusIcons[source.status]}
                              <span className="text-sm text-gray-600">{statusText[source.status]}</span>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {source.type}
                            </span>
                          </div>
                          
                          {source.url && (
                            <div className="flex items-center gap-2 mb-2">
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                {source.url}
                              </a>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">抓取次数:</span> {source.fetchCount}
                            </div>
                            <div>
                              <span className="font-medium">错误次数:</span> {source.errorCount}
                            </div>
                            <div>
                              <span className="font-medium">最后抓取:</span> {formatDate(source.lastFetchAt)}
                            </div>
                            <div>
                              <span className="font-medium">创建时间:</span> {formatDate(source.createdAt)}
                            </div>
                          </div>
                          
                          {source.lastError && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <strong>最后错误:</strong> {source.lastError}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFetchSource(source.id, source.name)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            抓取
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/sources/${source.id}/edit`)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSource(source.id, source.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
