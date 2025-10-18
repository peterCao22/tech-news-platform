/**
 * Advanced Filters Component
 * Story 3.1: 内容审核工作台
 * 
 * 高级筛选组件 - 按分类、来源、日期、评分等筛选
 */

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  X,
  Calendar,
  TrendingUp,
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { FilterParams } from '../../stores/contentReviewStore';

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterParams;
  onApply: (filters: Partial<FilterParams>) => void;
  categories?: string[];
  sources?: Array<{ id: string; name: string }>;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  categories = [],
  sources = [],
}) => {
  const [localFilters, setLocalFilters] = useState<Partial<FilterParams>>({
    ...filters,
  });

  const [expandedSections, setExpandedSections] = useState({
    category: true,
    source: true,
    date: true,
    score: false,
  });

  // 同步外部filters
  useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (category: string) => {
    const currentCategory = localFilters.category;
    setLocalFilters({
      ...localFilters,
      category: currentCategory === category ? undefined : category,
    });
  };

  const handleSourceChange = (sourceId: string) => {
    const currentSource = localFilters.sourceId;
    setLocalFilters({
      ...localFilters,
      sourceId: currentSource === sourceId ? undefined : sourceId,
    });
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    setLocalFilters({
      ...localFilters,
      [field]: value ? new Date(value) : undefined,
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: Partial<FilterParams> = {
      category: undefined,
      sourceId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
  };

  const hasActiveFilters = () => {
    return !!(
      localFilters.category ||
      localFilters.sourceId ||
      localFilters.dateFrom ||
      localFilters.dateTo
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* 侧边栏 */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-hard z-50 flex flex-col animate-slide-left">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">高级筛选</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* 分类筛选 */}
          <div>
            <button
              onClick={() => toggleSection('category')}
              className="flex items-center justify-between w-full mb-3"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">按分类筛选</h3>
              </div>
              {expandedSections.category ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedSections.category && (
              <div className="space-y-2">
                {categories.length > 0 ? (
                  categories.map(category => (
                    <label
                      key={category}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        checked={localFilters.category === category}
                        onChange={() => handleCategoryChange(category)}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">暂无分类数据</p>
                )}
              </div>
            )}
          </div>

          {/* 来源筛选 */}
          <div>
            <button
              onClick={() => toggleSection('source')}
              className="flex items-center justify-between w-full mb-3"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">按来源筛选</h3>
              </div>
              {expandedSections.source ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedSections.source && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sources.length > 0 ? (
                  sources.map(source => (
                    <label
                      key={source.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        checked={localFilters.sourceId === source.id}
                        onChange={() => handleSourceChange(source.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{source.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">暂无来源数据</p>
                )}
              </div>
            )}
          </div>

          {/* 日期范围筛选 */}
          <div>
            <button
              onClick={() => toggleSection('date')}
              className="flex items-center justify-between w-full mb-3"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">按日期筛选</h3>
              </div>
              {expandedSections.date ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedSections.date && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={
                      localFilters.dateFrom
                        ? localFilters.dateFrom.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={e => handleDateChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={
                      localFilters.dateTo
                        ? localFilters.dateTo.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={e => handleDateChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 排序设置 */}
          <div>
            <button
              onClick={() => toggleSection('score')}
              className="flex items-center justify-between w-full mb-3"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">排序设置</h3>
              </div>
              {expandedSections.score ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedSections.score && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    排序字段
                  </label>
                  <select
                    value={localFilters.sortBy || 'createdAt'}
                    onChange={e =>
                      setLocalFilters({
                        ...localFilters,
                        sortBy: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="createdAt">创建时间</option>
                    <option value="score">内容评分</option>
                    <option value="title">标题</option>
                    <option value="reviewedAt">审核时间</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    排序方式
                  </label>
                  <select
                    value={localFilters.sortOrder || 'desc'}
                    onChange={e =>
                      setLocalFilters({
                        ...localFilters,
                        sortOrder: e.target.value as 'asc' | 'desc',
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="desc">降序（从大到小）</option>
                    <option value="asc">升序（从小到大）</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            disabled={!hasActiveFilters()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            重置筛选
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            应用筛选
          </button>
        </div>
      </div>
    </>
  );
};

