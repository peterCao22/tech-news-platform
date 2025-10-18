/**
 * Story 4.2: 高级搜索与筛选 - 搜索页面
 * 
 * 路径: /search
 * 提供全文搜索和高级筛选功能
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useSearchStore } from '@/stores/search.store';
import { searchService } from '@/services/searchService';
import SearchBar from '@/components/search/SearchBar';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    query,
    setQuery,
    results,
    setResults,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    filters,
    isLoading,
    setLoading,
    searchTime,
    setSearchTime,
    setFilterOptions,
    addToHistory,
  } = useSearchStore();

  // 从URL参数初始化搜索
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
  }, [searchParams]);

  // 加载筛选选项
  useEffect(() => {
    loadFilterOptions();
  }, []);

  /**
   * 加载可用的筛选选项
   */
  const loadFilterOptions = async () => {
    try {
      const response = await searchService.getFilterOptions();
      if (response.success) {
        setFilterOptions(
          response.data.sources,
          response.data.categories
        );
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  /**
   * 执行搜索
   */
  const performSearch = async (searchQuery?: string) => {
    const targetQuery = searchQuery || query;
    if (!targetQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await searchService.search({
        query: targetQuery,
        filters,
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
      });

      if (response.success) {
        setResults(response.data.results);
        setSearchTime(response.data.performance.searchTime);
        addToHistory(targetQuery);
        
        // 更新URL
        const params = new URLSearchParams();
        params.set('q', targetQuery);
        if (currentPage > 1) params.set('page', currentPage.toString());
        router.push(`/search?${params.toString()}`, { scroll: false });
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 搜索提交处理
   */
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    performSearch(newQuery);
  };

  /**
   * 筛选条件变化
   */
  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [filters, currentPage, pageSize, sortBy, sortOrder]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* 搜索栏 */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>

        {/* 主内容区 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* 左侧筛选器 */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-6">
                <SearchFilters onSearch={() => performSearch()} />
              </div>
            </aside>

            {/* 右侧搜索结果 */}
            <main className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">搜索中...</span>
                </div>
              ) : (
                <SearchResults onSearch={() => performSearch()} />
              )}
            </main>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

