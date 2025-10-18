/**
 * Rules Management Component
 * Story 3.2: Intelligent Filter Rules - Main Dashboard
 */

import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { useFilterRulesStore, type RuleType, type RuleStatus } from '../../stores/filterRulesStore';
import { filterRulesService } from '../../services/filterRulesService';
import { RuleCard } from './RuleCard';
import { RuleEditor } from './RuleEditor';
import { RulePreview } from './RulePreview';
import { getRuleTypeLabel } from './RuleTypeIcon';

export const RulesManagement: React.FC = () => {
  const {
    rules,
    loading,
    error,
    filters,
    pagination,
    isEditorOpen,
    editorMode,
    currentRule,
    setRules,
    setLoading,
    setError,
    setFilters,
    setPagination,
    openEditor,
    closeEditor,
  } = useFilterRulesStore();

  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [previewRule, setPreviewRule] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load rules on mount and when filters/pagination change
  useEffect(() => {
    loadRules();
  }, [filters, pagination.page, pagination.limit]);

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await filterRulesService.getRules({
        type: filters.type,
        status: filters.status,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'priority',
        sortOrder: 'desc',
      });
      
      setRules(result.items, result.pagination.total);
    } catch (error: any) {
      setError(error.message || '加载规则列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ search: searchInput });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ page: newPage });
  };

  const handleCreateRule = () => {
    openEditor('create');
  };

  const handleEditRule = (rule: any) => {
    openEditor('edit', rule);
  };

  const handleViewRule = (rule: any) => {
    openEditor('view', rule);
  };

  const handleTestRule = async (rule: any) => {
    setPreviewRule(rule);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewRule(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">智能筛选规则</h1>
          <p className="mt-2 text-gray-600">
            配置和管理内容筛选规则，优化内容推荐质量
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="搜索规则名称..."
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                搜索
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                筛选
              </button>
              <button
                onClick={loadRules}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                刷新
              </button>
              <button
                onClick={handleCreateRule}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                创建规则
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    规则类型
                  </label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) =>
                      setFilters({ type: (e.target.value as RuleType) || undefined })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">全部类型</option>
                    <option value="KEYWORD_BOOST">关键词加权</option>
                    <option value="KEYWORD_PENALTY">关键词降权</option>
                    <option value="SOURCE_WHITELIST">来源白名单</option>
                    <option value="SOURCE_BLACKLIST">来源黑名单</option>
                    <option value="CATEGORY_BOOST">分类加权</option>
                    <option value="CATEGORY_PENALTY">分类降权</option>
                    <option value="CUSTOM">自定义</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    规则状态
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) =>
                      setFilters({ status: (e.target.value as RuleStatus) || undefined })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">全部状态</option>
                    <option value="DRAFT">草稿</option>
                    <option value="ACTIVE">生效中</option>
                    <option value="INACTIVE">已停用</option>
                    <option value="ARCHIVED">已归档</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({ type: undefined, status: undefined, search: undefined });
                      setSearchInput('');
                    }}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    重置筛选
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rules Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无规则</h3>
            <p className="mt-1 text-sm text-gray-500">开始创建你的第一个筛选规则</p>
            <div className="mt-6">
              <button
                onClick={handleCreateRule}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                创建规则
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={handleEditRule}
                  onView={handleViewRule}
                  onTest={handleTestRule}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      显示第 <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> 到{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      条，共 <span className="font-medium">{pagination.total}</span> 条结果
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">上一页</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            page === pagination.page
                              ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">下一页</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rule Editor Modal */}
      <RuleEditor
        isOpen={isEditorOpen}
        onClose={closeEditor}
        rule={currentRule}
        mode={editorMode}
      />

      {/* Rule Preview Modal */}
      {previewRule && (
        <RulePreview
          rule={previewRule}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
};

