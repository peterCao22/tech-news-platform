'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { contentApi } from '@/services/api/content';
import { sourcesApi } from '@/services/api/sources';
import { Button } from '@tech-news-platform/ui';
import { Search, Filter, RefreshCw, TrendingUp, ChevronLeft, ChevronRight, Grid, List, ArrowUp } from 'lucide-react';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NewsCard from '@/components/news/NewsCard';
import SearchAndFilter from '@/components/news/SearchAndFilter';
import NewsSkeleton from '@/components/news/NewsSkeleton';
export default function NewsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    // 状态管理
    const [contents, setContents] = useState([]);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    // UI状态
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    // 过滤器状态
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        status: 'PUBLISHED', // 只显示已发布的内容
    });
    const [searchQuery, setSearchQuery] = useState('');
    // 加载内容列表
    const loadContents = async (newFilters) => {
        try {
            setLoading(true);
            const currentFilters = newFilters || filters;
            const response = await contentApi.getContents(currentFilters);
            const contents = Array.isArray(response.data) ? response.data : [];
            setContents(contents);
            setPagination(response.pagination || {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
            });
        }
        catch (error) {
            console.error('加载内容失败:', error);
            toast.error(error.message || '加载内容失败');
        }
        finally {
            setLoading(false);
        }
    };
    // 加载RSS源列表（用于过滤器）
    const loadSources = async () => {
        try {
            const response = await sourcesApi.getSources();
            setSources(response.data || []);
        }
        catch (error) {
            console.error('加载RSS源失败:', error);
        }
    };
    // 刷新内容
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadContents();
            toast.success('内容已刷新');
        }
        catch (error) {
            toast.error('刷新失败');
        }
        finally {
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
    const handleApplyFilters = async (newFilters) => {
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
    const handlePageChange = async (newPage) => {
        const newFilters = {
            ...filters,
            page: newPage,
        };
        setFilters(newFilters);
        await loadContents(newFilters);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // 分享新闻
    const handleShareNews = (content) => {
        if (navigator.share) {
            navigator.share({
                title: content.title,
                text: content.description,
                url: content.url || window.location.href,
            });
        }
        else {
            // 复制到剪贴板
            navigator.clipboard.writeText(content.url || window.location.href);
            toast.success('链接已复制到剪贴板');
        }
    };
    // 收藏新闻
    const handleBookmarkNews = (content) => {
        // TODO: 实现收藏功能
        toast.success('已添加到收藏');
    };
    // 滚动到顶部
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // 监听滚动事件
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    useEffect(() => {
        if (isAuthenticated) {
            loadContents();
            loadSources();
        }
    }, [isAuthenticated]);
    if (loading && contents.length === 0) {
        return (<ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          {/* 顶部导航栏 */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <h1 className="text-xl font-bold text-gray-900">科技新闻</h1>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </header>

          {/* 主内容区域 */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <NewsSkeleton viewMode={viewMode} count={12}/>
          </main>
        </div>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航栏 */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* 左侧 - 标题和导航 */}
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">科技新闻</h1>
                <div className="hidden md:flex ml-8 space-x-6">
                  <button className="text-blue-600 font-medium">全部</button>
                  <button className="text-gray-600 hover:text-gray-900">AI技术</button>
                  <button className="text-gray-600 hover:text-gray-900">创业公司</button>
                  <button className="text-gray-600 hover:text-gray-900">投资</button>
                  <button className="text-gray-600 hover:text-gray-900">产品发布</button>
                </div>
              </div>

              {/* 右侧 - 搜索和操作 */}
              <div className="flex items-center space-x-4">
                {/* 搜索框 */}
                <div className="hidden md:block relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder="搜索新闻..." className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="h-4 w-4 mr-1"/>
                    筛选
                  </Button>
                  
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} className="rounded-r-none border-r">
                      <Grid className="h-4 w-4"/>
                    </Button>
                    <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="rounded-l-none">
                      <List className="h-4 w-4"/>
                    </Button>
                  </div>
                  
                  <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}/>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 移动端搜索栏 */}
        <div className="md:hidden bg-white border-b px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder="搜索新闻..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>
        </div>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 搜索和筛选组件 */}
          <SearchAndFilter filters={filters} sources={sources} onFiltersChange={handleApplyFilters} onSearch={handleSearch} onClearSearch={handleClearSearch} searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} className="mb-6"/>

          {/* 统计信息 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到 {pagination.total} 条新闻
              </div>
              <div className="text-sm text-gray-500">
                第 {pagination.page} 页，共 {pagination.totalPages} 页
              </div>
            </div>
          </div>

          {/* 新闻列表 */}
          {loading ? (<NewsSkeleton viewMode={viewMode} count={6}/>) : contents.length === 0 ? (<div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无新闻</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.sourceId || filters.category
                ? '没有找到符合条件的新闻'
                : '还没有发布的新闻内容'}
              </p>
              {!filters.search && !filters.sourceId && !filters.category && (<Button onClick={() => router.push('/dashboard')}>
                  返回仪表板
                </Button>)}
            </div>) : (<div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'}>
              {contents.map((content) => (<NewsCard key={content.id} content={content} onBookmark={handleBookmarkNews} onShare={handleShareNews} viewMode={viewMode}/>))}
            </div>)}

          {/* 分页 */}
          {pagination.totalPages > 1 && (<div className="mt-8 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
                  <ChevronLeft className="h-4 w-4 mr-1"/>
                  上一页
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum > pagination.totalPages)
                    return null;
                return (<Button key={pageNum} variant={pageNum === pagination.page ? "default" : "outline"} onClick={() => handlePageChange(pageNum)} className="w-10 h-10 p-0">
                        {pageNum}
                      </Button>);
            })}
                </div>
                
                <Button variant="outline" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                  下一页
                  <ChevronRight className="h-4 w-4 ml-1"/>
                </Button>
              </div>
            </div>)}
        </main>

        {/* 回到顶部按钮 */}
        {showScrollTop && (<Button onClick={scrollToTop} className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0 shadow-lg">
            <ArrowUp className="h-5 w-5"/>
          </Button>)}
      </div>
    </ProtectedRoute>);
}
