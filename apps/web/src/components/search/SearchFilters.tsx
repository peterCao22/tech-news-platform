/**
 * Story 4.2: 高级搜索与筛选 - 筛选器组件
 * 
 * 功能：
 * - 日期范围选择
 * - 来源多选
 * - 分类多选
 * - 评分范围滑块
 * - 清除筛选
 */

'use client';

import React, { useState } from 'react';
import { Filter, X, Calendar, Building2, FolderOpen, Star } from 'lucide-react';
import { useSearchStore } from '@/stores/search.store';

interface SearchFiltersProps {
  onSearch: () => void;
}

export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const {
    filters,
    setFilters,
    clearFilters,
    availableSources,
    availableCategories,
    isAdvancedOpen,
  } = useSearchStore();

  const [scoreRange, setScoreRange] = useState<[number, number]>([
    filters.scoreMin || 0,
    filters.scoreMax || 100,
  ]);

  /**
   * 更新日期筛选
   */
  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    setFilters({ [field]: value || undefined });
    onSearch();
  };

  /**
   * 更新来源筛选
   */
  const toggleSource = (sourceId: string) => {
    const currentSources = filters.sources || [];
    const newSources = currentSources.includes(sourceId)
      ? currentSources.filter(id => id !== sourceId)
      : [...currentSources, sourceId];
    
    setFilters({ sources: newSources.length > 0 ? newSources : undefined });
    onSearch();
  };

  /**
   * 更新分类筛选
   */
  const toggleCategory = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    setFilters({ categories: newCategories.length > 0 ? newCategories : undefined });
    onSearch();
  };

  /**
   * 更新评分筛选 (防抖)
   */
  const handleScoreChange = (index: 0 | 1, value: number) => {
    const newRange: [number, number] = [...scoreRange] as [number, number];
    newRange[index] = value;
    
    // 确保最小值 <= 最大值
    if (index === 0 && value > newRange[1]) {
      newRange[1] = value;
    } else if (index === 1 && value < newRange[0]) {
      newRange[0] = value;
    }
    
    setScoreRange(newRange);
  };

  /**
   * 应用评分筛选
   */
  const applyScoreFilter = () => {
    setFilters({
      scoreMin: scoreRange[0] > 0 ? scoreRange[0] : undefined,
      scoreMax: scoreRange[1] < 100 ? scoreRange[1] : undefined,
    });
    onSearch();
  };

  /**
   * 清除所有筛选
   */
  const handleClearFilters = () => {
    clearFilters();
    setScoreRange([0, 100]);
    onSearch();
  };

  // 统计已应用的筛选数量
  const activeFiltersCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.sources?.length,
    filters.categories?.length,
    filters.scoreMin !== undefined && filters.scoreMin > 0,
    filters.scoreMax !== undefined && filters.scoreMax < 100,
  ].filter(Boolean).length;

  if (!isAdvancedOpen) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">高级筛选</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            清除
          </button>
        )}
      </div>

      {/* 日期范围 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>日期范围</span>
        </div>
        
        <div className="space-y-2">
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="开始日期"
          />
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="结束日期"
          />
        </div>
      </div>

      {/* 来源筛选 */}
      {availableSources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Building2 className="w-4 h-4" />
            <span>来源</span>
            {filters.sources && filters.sources.length > 0 && (
              <span className="text-xs text-gray-500">({filters.sources.length})</span>
            )}
          </div>
          
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {availableSources.map((source) => (
              <label
                key={source.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.sources?.includes(source.id) || false}
                  onChange={() => toggleSource(source.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {source.name}
                </span>
                <span className="text-xs text-gray-500">({source.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 分类筛选 */}
      {availableCategories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FolderOpen className="w-4 h-4" />
            <span>分类</span>
            {filters.categories && filters.categories.length > 0 && (
              <span className="text-xs text-gray-500">({filters.categories.length})</span>
            )}
          </div>
          
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {availableCategories.map((category) => (
              <label
                key={category.name}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category.name) || false}
                  onChange={() => toggleCategory(category.name)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {category.name}
                </span>
                <span className="text-xs text-gray-500">({category.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 评分范围 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Star className="w-4 h-4" />
          <span>评分范围</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={scoreRange[0]}
              onChange={(e) => handleScoreChange(0, parseInt(e.target.value))}
              onMouseUp={applyScoreFilter}
              onTouchEnd={applyScoreFilter}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-8 text-right">{scoreRange[0]}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={scoreRange[1]}
              onChange={(e) => handleScoreChange(1, parseInt(e.target.value))}
              onMouseUp={applyScoreFilter}
              onTouchEnd={applyScoreFilter}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-8 text-right">{scoreRange[1]}</span>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            {scoreRange[0]} - {scoreRange[1]} 分
          </div>
        </div>
      </div>
    </div>
  );
}

