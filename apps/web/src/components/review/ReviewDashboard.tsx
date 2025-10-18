/**
 * Review Dashboard Component
 * Story 3.1: 内容审核工作台
 * 
 * 审核工作台主面板，整合所有审核功能
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  Filter,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  HelpCircle,
  Pause,
  Play,
} from 'lucide-react';
import { useContentReviewStore } from '../../stores/contentReviewStore';
import { contentReviewService } from '../../services/contentReviewService';
import { ContentCard } from './ContentCard';
import { ContentEditor } from './ContentEditor';
import { StatusBadge } from './StatusBadge';
import { AdvancedFilters } from './AdvancedFilters';
import { ShortcutHelp } from './ShortcutHelp';
import { useKeyboardShortcuts, type ShortcutConfig } from '../../hooks/useKeyboardShortcuts';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import type { ContentReviewStatus } from '../../stores/contentReviewStore';

interface ReviewDashboardProps {
  className?: string;
}

// 状态筛选选项
const statusOptions: { value: ContentReviewStatus; label: string }[] = [
  { value: 'PENDING_REVIEW', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'DRAFT', label: '草稿' },
];

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ className }) => {
  const {
    items,
    selectedIds,
    page,
    limit,
    total,
    totalPages,
    filters,
    stats,
    loading,
    error,
    isEditorOpen,
    editingItem,
    setItems,
    setLoading,
    setError,
    setPage,
    setFilters,
    setStats,
    toggleSelect,
    selectAll,
    clearSelection,
    openEditor,
    closeEditor,
    updateItemStatus,
    updateItemDetails,
    removeItem,
  } = useContentReviewStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);

  // 加载数据
  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const response = await contentReviewService.getList({
        page,
        limit,
        filters,
      });

      setItems(response.items);
      setStats({
        pendingCount: response.stats.pendingCount,
        approvedCount: response.stats.approvedCount,
        rejectedCount: response.stats.rejectedCount,
        publishedCount: response.stats.publishedCount,
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || '加载失败';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [page, limit, filters, setItems, setStats, setLoading, setError]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData(false);
      toast.success('数据已刷新');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 自动刷新
  const autoRefresh = useAutoRefresh({
    onRefresh: async () => {
      await loadData(false);
    },
    interval: 60000, // 60秒
    enabled: true,
  });

  // 翻页
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    clearSelection();
  };

  // 筛选状态切换
  const handleStatusFilterToggle = (status: ContentReviewStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    setFilters({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  // 高级筛选应用
  const handleApplyAdvancedFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  // 单个内容操作
  const handleApprove = async (id: string) => {
    try {
      await contentReviewService.updateStatus(id, 'APPROVE');
      updateItemStatus(id, 'APPROVED');
      toast.success('已通过审核');
      
      // 如果当前筛选不包括已通过状态，从列表中移除
      if (filters.status && !filters.status.includes('APPROVED')) {
        removeItem(id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async (id: string) => {
    const notes = window.prompt('请输入拒绝原因（可选）：');
    if (notes === null) return; // 用户取消

    try {
      await contentReviewService.updateStatus(id, 'REJECT', notes || undefined);
      updateItemStatus(id, 'REJECTED');
      toast.success('已拒绝该内容');
      
      // 如果当前筛选不包括已拒绝状态，从列表中移除
      if (filters.status && !filters.status.includes('REJECTED')) {
        removeItem(id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      openEditor(item);
    }
  };

  const handleView = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      openEditor(item);
    }
  };

  const handleSave = async (id: string, updates: any) => {
    await contentReviewService.updateDetails(id, updates);
    updateItemDetails(id, updates);
  };

  // 快捷键操作
  const handleApproveShortcut = () => {
    if (items.length === 0) return;
    const currentItem = items[currentFocusIndex];
    if (currentItem && currentItem.reviewStatus === 'PENDING_REVIEW') {
      handleApprove(currentItem.id);
    }
  };

  const handleRejectShortcut = () => {
    if (items.length === 0) return;
    const currentItem = items[currentFocusIndex];
    if (currentItem && currentItem.reviewStatus === 'PENDING_REVIEW') {
      handleReject(currentItem.id);
    }
  };

  const handleEditShortcut = () => {
    if (items.length === 0) return;
    const currentItem = items[currentFocusIndex];
    if (currentItem) {
      handleEdit(currentItem.id);
    }
  };

  const handleNextItem = () => {
    if (currentFocusIndex < items.length - 1) {
      setCurrentFocusIndex(currentFocusIndex + 1);
    }
  };

  const handlePrevItem = () => {
    if (currentFocusIndex > 0) {
      setCurrentFocusIndex(currentFocusIndex - 1);
    }
  };

  // 快捷键配置
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'a',
      description: '批准当前内容',
      action: handleApproveShortcut,
    },
    {
      key: 'r',
      description: '拒绝当前内容',
      action: handleRejectShortcut,
    },
    {
      key: 'e',
      description: '编辑当前内容',
      action: handleEditShortcut,
    },
    {
      key: 'ArrowDown',
      description: '下一项',
      action: handleNextItem,
    },
    {
      key: 'ArrowUp',
      description: '上一项',
      action: handlePrevItem,
    },
    {
      key: '?',
      description: '显示快捷键帮助',
      action: () => setShowShortcutHelp(!showShortcutHelp),
      shiftKey: true,
    },
    {
      key: 'f',
      description: '打开筛选面板',
      action: () => setShowFilters(!showFilters),
    },
  ];

  // 启用快捷键
  useKeyboardShortcuts({
    shortcuts,
    enabled: !isEditorOpen && !showAdvancedFilters,
  });

  // 批量操作
  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要操作的内容');
      return;
    }

    if (!window.confirm(`确定要通过 ${selectedIds.size} 个内容吗？`)) return;

    try {
      const result = await contentReviewService.batchUpdateStatus(
        Array.from(selectedIds),
        'APPROVE'
      );

      if (result.successCount > 0) {
        toast.success(`成功通过 ${result.successCount} 个内容`);
        await loadData(false);
        clearSelection();
      }

      if (result.failedCount > 0) {
        toast.error(`${result.failedCount} 个内容操作失败`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || '批量操作失败');
    }
  };

  const handleBatchReject = async () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要操作的内容');
      return;
    }

    const notes = window.prompt('请输入拒绝原因（可选）：');
    if (notes === null) return;

    if (!window.confirm(`确定要拒绝 ${selectedIds.size} 个内容吗？`)) return;

    try {
      const result = await contentReviewService.batchUpdateStatus(
        Array.from(selectedIds),
        'REJECT',
        notes || undefined
      );

      if (result.successCount > 0) {
        toast.success(`成功拒绝 ${result.successCount} 个内容`);
        await loadData(false);
        clearSelection();
      }

      if (result.failedCount > 0) {
        toast.error(`${result.failedCount} 个内容操作失败`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || '批量操作失败');
    }
  };

  return (
    <div className={clsx('flex flex-col h-full bg-gray-50', className)}>
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">内容审核工作台</h1>
          
          <div className="flex items-center gap-3">
            {/* 刷新按钮 */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="刷新数据"
            >
              <RefreshCw className={clsx('w-5 h-5', isRefreshing && 'animate-spin')} />
            </button>

            {/* 快速筛选按钮 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
                showFilters
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
              title="快速筛选"
            >
              <Filter className="w-5 h-5" />
              <span className="text-sm font-medium">快速筛选</span>
            </button>

            {/* 高级筛选按钮 */}
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              title="高级筛选"
            >
              <Filter className="w-5 h-5" />
              <span className="text-sm font-medium">高级筛选</span>
            </button>

            {/* 自动刷新控制 */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <button
                onClick={autoRefresh.isPaused ? autoRefresh.resume : autoRefresh.pause}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                title={autoRefresh.isPaused ? '恢复自动刷新' : '暂停自动刷新'}
              >
                {autoRefresh.isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </button>
              <span className="text-xs text-gray-600">
                {autoRefresh.isPaused ? '已暂停' : `${autoRefresh.nextRefreshIn}s`}
              </span>
            </div>

            {/* 快捷键帮助按钮 */}
            <button
              onClick={() => setShowShortcutHelp(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="快捷键帮助（Shift + ?）"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-xs text-warning-700 font-medium mb-1">待审核</p>
            <p className="text-2xl font-bold text-warning-900">{stats.pendingCount}</p>
          </div>
          <div className="bg-success-50 border border-success-200 rounded-lg p-3">
            <p className="text-xs text-success-700 font-medium mb-1">已通过</p>
            <p className="text-2xl font-bold text-success-900">{stats.approvedCount}</p>
          </div>
          <div className="bg-error-50 border border-error-200 rounded-lg p-3">
            <p className="text-xs text-error-700 font-medium mb-1">已拒绝</p>
            <p className="text-2xl font-bold text-error-900">{stats.rejectedCount}</p>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-xs text-primary-700 font-medium mb-1">已发布</p>
            <p className="text-2xl font-bold text-primary-900">{stats.publishedCount}</p>
          </div>
        </div>

        {/* 筛选面板 */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-slide-down">
            <h3 className="text-sm font-medium text-gray-700 mb-3">按状态筛选</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilterToggle(option.value)}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-lg border transition-all',
                    filters.status?.includes(option.value)
                      ? 'bg-primary-100 border-primary-300 text-primary-700 font-medium'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 批量操作栏 */}
        {selectedIds.size > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between mt-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="text-primary-700 hover:text-primary-900 transition-colors"
              >
                {selectedIds.size === items.length && items.length > 0 ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <span className="text-sm font-medium text-primary-900">
                已选择 {selectedIds.size} 项
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchApprove}
                className="px-4 py-2 text-sm font-medium text-white bg-success-600 hover:bg-success-700 rounded-lg transition-colors"
              >
                批量通过
              </button>
              <button
                onClick={handleBatchReject}
                className="px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-lg transition-colors"
              >
                批量拒绝
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                取消选择
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 内容列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && items.length === 0 ? (
          // 加载状态
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : error ? (
          // 错误状态
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-12 h-12 text-error-500 mb-3" />
            <p className="text-gray-900 font-medium mb-1">加载失败</p>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              重试
            </button>
          </div>
        ) : items.length === 0 ? (
          // 空状态
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-600 text-lg mb-2">暂无内容</p>
            <p className="text-gray-500 text-sm">尝试调整筛选条件或稍后再试</p>
          </div>
        ) : (
          // 内容列表
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={clsx(
                  'transition-all',
                  currentFocusIndex === index && 'ring-2 ring-primary-500 rounded-lg'
                )}
              >
                <ContentCard
                  content={item}
                  selected={selectedIds.has(item.id)}
                  onSelect={toggleSelect}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                  onView={handleView}
                  showActions={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              显示 <span className="font-medium">{(page - 1) * limit + 1}</span> 到{' '}
              <span className="font-medium">{Math.min(page * limit, total)}</span>，共{' '}
              <span className="font-medium">{total}</span> 条
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={clsx(
                        'w-10 h-10 text-sm font-medium rounded-lg transition-colors',
                        page === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑器 */}
      {editingItem && (
        <ContentEditor
          content={editingItem}
          isOpen={isEditorOpen}
          onClose={closeEditor}
          onSave={handleSave}
        />
      )}

      {/* 高级筛选面板 */}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onApply={handleApplyAdvancedFilters}
        categories={[]} // TODO: 从API获取分类列表
        sources={[]} // TODO: 从API获取来源列表
      />

      {/* 快捷键帮助 */}
      <ShortcutHelp
        shortcuts={shortcuts}
        isOpen={showShortcutHelp}
        onClose={() => setShowShortcutHelp(false)}
      />
    </div>
  );
};

