/**
 * Story 4.2: 高级搜索与筛选 - 搜索结果组件
 * 
 * 功能：
 * - 结果列表展示
 * - 高亮显示匹配文本
 * - 分页控制
 * - 排序选项
 * - 结果统计
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchStore } from '@/stores/search.store';
import type { SearchResult as SearchResultType } from '@/services/searchService';

interface SearchResultsProps {
  onSearch: () => void;
}

export default function SearchResults({ onSearch }: SearchResultsProps) {
  const {
    query,
    results,
    currentPage,
    totalPages,
    totalResults,
    pageSize,
    sortBy,
    sortOrder,
    setPage,
    setPageSize,
    setSorting,
    searchTime,
  } = useSearchStore();

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  };

  /**
   * 渲染高亮文本
   */
  const renderHighlight = (text: string | undefined, fallback: string) => {
    if (!text) return fallback;
    
    // 高亮标记由后端返回，格式为 <em>...</em>
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: text.replace(/<em>/g, '<mark class="bg-yellow-200 px-0.5">').replace(/<\/em>/g, '</mark>')
        }}
      />
    );
  };

  /**
   * 分页变化
   */
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setPage(page);
    onSearch();
  };

  /**
   * 排序变化
   */
  const handleSortChange = (newSortBy: string) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    setSorting(newSortBy, newSortOrder);
    onSearch();
  };

  // 没有搜索或结果为空
  if (!query) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">🔍</div>
        <p className="text-gray-600">输入关键词开始搜索</p>
        <p className="text-sm text-gray-500 mt-2">支持布尔语法、精确匹配和通配符</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 text-lg mb-2">😕</div>
        <p className="text-gray-700 font-medium">未找到匹配结果</p>
        <p className="text-sm text-gray-500 mt-2">
          尝试使用不同的关键词或调整筛选条件
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 结果统计和排序 */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600">
          找到 <strong className="text-gray-900">{totalResults}</strong> 条结果
          <span className="text-gray-400 ml-2">({searchTime}ms)</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">排序：</span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSorting(newSortBy, newSortOrder);
              onSearch();
            }}
            className="px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance-desc">相关性</option>
            <option value="date-desc">最新发布</option>
            <option value="date-asc">最早发布</option>
            <option value="score-desc">评分最高</option>
            <option value="score-asc">评分最低</option>
          </select>
        </div>
      </div>

      {/* 结果列表 */}
      <div className="space-y-3">
        {results.map((result) => (
          <article
            key={result.id}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            {/* 标题 */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
              <Link href={`/content/${result.id}`}>
                {renderHighlight(result.highlights?.title, result.title)}
              </Link>
            </h3>

            {/* 描述 */}
            <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">
              {renderHighlight(result.highlights?.description, result.description)}
            </p>

            {/* 元数据 */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* 来源 */}
              {result.source && (
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {result.source.name}
                </span>
              )}

              {/* 分类 */}
              {result.category && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                  {result.category}
                </span>
              )}

              {/* 评分 */}
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {result.score.toFixed(1)}
              </span>

              {/* 日期 */}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(result.publishedAt || result.createdAt)}
              </span>
            </div>

            {/* 原文链接 */}
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                查看原文
              </a>
            )}
          </article>
        ))}
      </div>

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">每页显示：</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                onSearch();
              }}
              className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-600">
              第 {currentPage} / {totalPages} 页
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* 页码按钮 */}
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1.5 border rounded-md transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

