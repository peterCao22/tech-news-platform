'use client';

/**
 * Story 4.3: 每日阅读记录页面
 * /history/daily
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { getDailyReading, exportDailyReading } from '@/services/historyService';
import { Calendar, Filter, Download, BookOpen, Clock, Eye } from 'lucide-react';

export default function DailyReadingPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate, category]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDailyReading(selectedDate, category || undefined);
      setData(response.data);
    } catch (err: any) {
      console.error('加载每日阅读记录失败:', err);
      setError(err.response?.data?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'markdown') => {
    try {
      setExporting(true);
      await exportDailyReading(selectedDate, format);
    } catch (err: any) {
      console.error('导出失败:', err);
      alert('导出失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-600">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !data) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { totalCount, filteredCount, items, categoryDistribution } = data || {};

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">每日阅读记录</h1>
          <p className="text-gray-600 mt-1">查看您的历史阅读记录</p>
        </div>

        {/* 日期和筛选 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 日期选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                选择日期
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 分类筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                分类筛选
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部分类</option>
                {categoryDistribution &&
                  Object.keys(categoryDistribution).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({categoryDistribution[cat]})
                    </option>
                  ))}
              </select>
            </div>

            {/* 导出 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Download className="w-4 h-4 inline mr-1" />
                导出数据
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('markdown')}
                  disabled={exporting}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
                >
                  MD
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{filteredCount || 0}</div>
            </div>
            <div className="text-sm opacity-90">阅读内容数</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">
                {items?.reduce((sum: number, item: any) => sum + item.readCount, 0) || 0}
              </div>
            </div>
            <div className="text-sm opacity-90">总阅读次数</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">
                {Math.round(
                  (items?.reduce((sum: number, item: any) => sum + item.duration, 0) || 0) / 60
                )}
              </div>
            </div>
            <div className="text-sm opacity-90">阅读时长（分钟）</div>
          </div>
        </div>

        {/* 阅读列表 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            阅读列表 {category && `· ${category}`}
          </h2>

          {items && items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <a
                      href={item.content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {item.content.title}
                    </a>

                    {item.content.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.content.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {item.content.source?.name || '未知来源'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        阅读 {item.readCount} 次
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(item.duration / 60)} 分钟
                      </span>
                      {item.content.category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {item.content.category}
                        </span>
                      )}
                    </div>

                    {/* 阅读进度 */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>阅读进度</span>
                        <span>{Math.round(item.scrollDepth * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${item.scrollDepth * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 标签 */}
                    <div className="flex items-center gap-2 mt-3">
                      {item.isCompleted && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          已读完
                        </span>
                      )}
                      {item.isBookmarked && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                          已收藏
                        </span>
                      )}
                      {item.isLiked && (
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium">
                          已点赞
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {item.content.score}
                    </div>
                    <div className="text-xs text-gray-500">评分</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">当天没有阅读记录</p>
              <p className="text-sm mt-2">选择其他日期查看历史记录</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

