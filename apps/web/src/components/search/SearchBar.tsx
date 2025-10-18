/**
 * Story 4.2: 高级搜索与筛选 - 搜索栏组件
 * 
 * 功能：
 * - 搜索输入框
 * - 搜索历史下拉
 * - 语法验证提示
 * - 快捷键支持 (Enter搜索, Esc清空)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, HelpCircle } from 'lucide-react';
import { useSearchStore } from '@/stores/search.store';
import { searchService } from '@/services/searchService';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const {
    query,
    setQuery,
    searchHistory,
    clearHistory,
    isAdvancedOpen,
    toggleAdvanced,
  } = useSearchStore();

  const [localQuery, setLocalQuery] = useState(query);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // 点击外部关闭历史/帮助
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * 验证搜索语法
   */
  const validateQuery = async (q: string) => {
    if (!q.trim()) {
      setValidationError('');
      return;
    }

    try {
      const response = await searchService.validateQuery(q);
      if (!response.data.isValid) {
        setValidationError(response.data.error || '查询语法错误');
      } else {
        setValidationError('');
      }
    } catch (error) {
      // 验证失败不影响搜索
      setValidationError('');
    }
  };

  /**
   * 输入变化处理
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setQuery(value);
    
    // 防抖验证
    const timer = setTimeout(() => validateQuery(value), 500);
    return () => clearTimeout(timer);
  };

  /**
   * 提交搜索
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      onSearch(localQuery);
      setShowHistory(false);
      inputRef.current?.blur();
    }
  };

  /**
   * 选择历史记录
   */
  const selectHistory = (historyQuery: string) => {
    setLocalQuery(historyQuery);
    setQuery(historyQuery);
    onSearch(historyQuery);
    setShowHistory(false);
  };

  /**
   * 清空输入
   */
  const clearInput = () => {
    setLocalQuery('');
    setQuery('');
    setValidationError('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={historyRef}>
      {/* 主搜索框 */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
            placeholder='搜索内容... (支持: AND, OR, NOT, "精确匹配", *通配符)'
            className={`w-full pl-12 pr-24 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
            }`}
          />

          {/* 右侧操作按钮 */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {localQuery && (
              <button
                type="button"
                onClick={clearInput}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                title="清空"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="搜索帮助"
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>

            <button
              type="submit"
              disabled={!localQuery.trim() || !!validationError}
              className="ml-1 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              搜索
            </button>
          </div>
        </div>

        {/* 验证错误提示 */}
        {validationError && (
          <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            <span>{validationError}</span>
          </div>
        )}
      </form>

      {/* 搜索历史下拉 */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">搜索历史</span>
            <button
              onClick={clearHistory}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              清空历史
            </button>
          </div>
          
          <ul className="py-1">
            {searchHistory.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => selectHistory(item)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{item}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 搜索语法帮助 */}
      {showHelp && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">搜索语法帮助</h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <strong className="text-gray-700">AND:</strong>
              <span className="text-gray-600 ml-2">AI AND 芯片 (同时包含)</span>
            </div>
            <div>
              <strong className="text-gray-700">OR:</strong>
              <span className="text-gray-600 ml-2">苹果 OR 谷歌 (任一即可)</span>
            </div>
            <div>
              <strong className="text-gray-700">NOT:</strong>
              <span className="text-gray-600 ml-2">AI NOT 加密货币 (排除后者)</span>
            </div>
            <div>
              <strong className="text-gray-700">括号:</strong>
              <span className="text-gray-600 ml-2">(AI OR 人工智能) AND 芯片</span>
            </div>
            <div>
              <strong className="text-gray-700">精确匹配:</strong>
              <span className="text-gray-600 ml-2">"ChatGPT 4.0"</span>
            </div>
            <div>
              <strong className="text-gray-700">通配符:</strong>
              <span className="text-gray-600 ml-2">block* (blockchain, blockbuster)</span>
            </div>
          </div>
        </div>
      )}

      {/* 高级筛选切换 */}
      <button
        onClick={toggleAdvanced}
        className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        {isAdvancedOpen ? '收起' : '展开'}高级筛选
      </button>
    </div>
  );
}

