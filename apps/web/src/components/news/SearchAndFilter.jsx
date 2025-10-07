import React, { useState } from 'react';
import { Button } from '@tech-news-platform/ui';
import { Search, Filter, X, Calendar, Tag, User, SortAsc, SortDesc } from 'lucide-react';
export const SearchAndFilter = ({ filters, sources, onFiltersChange, onSearch, onClearSearch, searchQuery, onSearchQueryChange, className = '' }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [tempFilters, setTempFilters] = useState(filters);
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            onSearch(searchQuery);
        }
    };
    const handleApplyFilters = () => {
        onFiltersChange(tempFilters);
        setShowFilters(false);
    };
    const handleResetFilters = () => {
        const resetFilters = {
            page: 1,
            limit: filters.limit || 20,
            status: 'PUBLISHED',
        };
        setTempFilters(resetFilters);
        onFiltersChange(resetFilters);
        setShowFilters(false);
    };
    const updateTempFilter = (key, value) => {
        setTempFilters(prev => ({
            ...prev,
            [key]: value || undefined,
        }));
    };
    const activeFiltersCount = Object.values(filters).filter(value => value !== undefined && value !== null && value !== '' &&
        value !== 'PUBLISHED' && value !== 1 && value !== 20).length;
    return (<div className={className}>
      {/* 搜索栏 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
            <input type="text" value={searchQuery} onChange={(e) => onSearchQueryChange(e.target.value)} onKeyPress={handleSearchKeyPress} placeholder="搜索新闻标题、内容或标签..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>
          <Button onClick={() => onSearch(searchQuery)} disabled={!searchQuery.trim()}>
            搜索
          </Button>
          {filters.search && (<Button onClick={onClearSearch} variant="outline">
              <X className="h-4 w-4 mr-1"/>
              清除
            </Button>)}
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="h-4 w-4 mr-1"/>
            筛选
            {activeFiltersCount > 0 && (<span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>)}
          </Button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilters && (<div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">筛选选项</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleResetFilters}>
                重置
              </Button>
              <Button size="sm" onClick={handleApplyFilters}>
                应用筛选
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 来源筛选 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 mr-1"/>
                来源
              </label>
              <select value={tempFilters.sourceId || ''} onChange={(e) => updateTempFilter('sourceId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">全部来源</option>
                {sources.map((source) => (<option key={source.id} value={source.id}>
                    {source.name}
                  </option>))}
              </select>
            </div>

            {/* 分类筛选 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 mr-1"/>
                分类
              </label>
              <select value={tempFilters.category || ''} onChange={(e) => updateTempFilter('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">全部分类</option>
                <option value="tech">科技</option>
                <option value="business">商业</option>
                <option value="ai">人工智能</option>
                <option value="startup">创业</option>
                <option value="programming">编程</option>
                <option value="design">设计</option>
                <option value="finance">金融</option>
                <option value="other">其他</option>
              </select>
            </div>

            {/* 时间范围筛选 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-1"/>
                时间范围
              </label>
              <select onChange={(e) => {
                const value = e.target.value;
                let dateFrom;
                if (value === 'today') {
                    dateFrom = new Date().toISOString().split('T')[0];
                }
                else if (value === 'week') {
                    const date = new Date();
                    date.setDate(date.getDate() - 7);
                    dateFrom = date.toISOString().split('T')[0];
                }
                else if (value === 'month') {
                    const date = new Date();
                    date.setMonth(date.getMonth() - 1);
                    dateFrom = date.toISOString().split('T')[0];
                }
                updateTempFilter('dateFrom', dateFrom);
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">全部时间</option>
                <option value="today">今天</option>
                <option value="week">最近一周</option>
                <option value="month">最近一月</option>
              </select>
            </div>

            {/* 排序方式 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                {tempFilters.sortOrder === 'desc' ? (<SortDesc className="h-4 w-4 mr-1"/>) : (<SortAsc className="h-4 w-4 mr-1"/>)}
                排序方式
              </label>
              <div className="flex gap-1">
                <select value={tempFilters.sortBy || 'publishedAt'} onChange={(e) => updateTempFilter('sortBy', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="publishedAt">发布时间</option>
                  <option value="createdAt">添加时间</option>
                  <option value="title">标题</option>
                  <option value="score">评分</option>
                </select>
                <button type="button" onClick={() => updateTempFilter('sortOrder', tempFilters.sortOrder === 'desc' ? 'asc' : 'desc')} className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {tempFilters.sortOrder === 'desc' ? (<SortDesc className="h-4 w-4"/>) : (<SortAsc className="h-4 w-4"/>)}
                </button>
              </div>
            </div>
          </div>

          {/* 自定义日期范围 */}
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自定义日期范围
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                <input type="date" value={tempFilters.dateFrom || ''} onChange={(e) => updateTempFilter('dateFrom', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                <input type="date" value={tempFilters.dateTo || ''} onChange={(e) => updateTempFilter('dateTo', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
            </div>
          </div>
        </div>)}

      {/* 活跃筛选器显示 */}
      {activeFiltersCount > 0 && (<div className="flex flex-wrap gap-2 mb-4">
          {filters.search && (<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              搜索: {filters.search}
              <button onClick={onClearSearch} className="ml-2 hover:text-blue-600">
                <X className="h-3 w-3"/>
              </button>
            </span>)}
          {filters.sourceId && (<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              来源: {sources.find(s => s.id === filters.sourceId)?.name || filters.sourceId}
              <button onClick={() => onFiltersChange({ ...filters, sourceId: undefined })} className="ml-2 hover:text-green-600">
                <X className="h-3 w-3"/>
              </button>
            </span>)}
          {filters.category && (<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              分类: {filters.category}
              <button onClick={() => onFiltersChange({ ...filters, category: undefined })} className="ml-2 hover:text-purple-600">
                <X className="h-3 w-3"/>
              </button>
            </span>)}
          {filters.dateFrom && (<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
              开始: {filters.dateFrom}
              <button onClick={() => onFiltersChange({ ...filters, dateFrom: undefined })} className="ml-2 hover:text-orange-600">
                <X className="h-3 w-3"/>
              </button>
            </span>)}
        </div>)}
    </div>);
};
export default SearchAndFilter;
