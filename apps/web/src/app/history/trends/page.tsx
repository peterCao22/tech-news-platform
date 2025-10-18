'use client';

/**
 * Story 4.3: 趋势分析页面
 * /history/trends
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { getTrendReport } from '@/services/historyService';
import { TrendingUp, TrendingDown, Minus, Tag, Folder } from 'lucide-react';

export default function TrendsPage() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'keywords' | 'categories'>('keywords');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTrendReport(period);
      setData(response.data);
    } catch (err: any) {
      console.error('加载趋势数据失败:', err);
      setError(err.response?.data?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'falling':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'falling':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-600">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
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

  if (!data) return null;

  const { keywordTrends, categoryTrends, summary } = data;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* 标题和时间选择 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">趋势分析</h1>
            <p className="text-gray-600 mt-1">追踪热门话题和关键词的变化趋势</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              近7天
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              近30天
            </button>
          </div>
        </div>

        {/* 趋势摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-gray-900">{summary.totalKeywords}</div>
            <div className="text-sm text-gray-600 mt-1">关键词总数</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{summary.risingKeywords}</div>
            <div className="text-sm text-gray-600 mt-1">上升关键词</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{summary.fallingKeywords}</div>
            <div className="text-sm text-gray-600 mt-1">下降关键词</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-gray-900">{summary.totalCategories}</div>
            <div className="text-sm text-gray-600 mt-1">分类总数</div>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('keywords')}
              className={`pb-3 px-4 font-medium transition-colors border-b-2 ${
                activeTab === 'keywords'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              关键词趋势
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-3 px-4 font-medium transition-colors border-b-2 ${
                activeTab === 'categories'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Folder className="w-4 h-4 inline mr-2" />
              分类趋势
            </button>
          </div>

          {/* 关键词趋势列表 */}
          {activeTab === 'keywords' && (
            <div className="space-y-3">
              {keywordTrends.map((trend: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border ${getTrendColor(
                    trend.trend
                  )}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{getTrendIcon(trend.trend)}</div>
                    <div>
                      <div className="font-medium text-gray-900">{trend.keyword}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        当前: {trend.currentCount} | 之前: {trend.previousCount} |{' '}
                        {trend.changePercent > 0 ? '+' : ''}
                        {trend.changePercent.toFixed(1)}%
                      </div>
                      {trend.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {trend.categories.slice(0, 3).map((cat: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{trend.avgScore.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">平均评分</div>
                  </div>
                </div>
              ))}

              {keywordTrends.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Tag className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>暂无关键词趋势数据</p>
                </div>
              )}
            </div>
          )}

          {/* 分类趋势列表 */}
          {activeTab === 'categories' && (
            <div className="space-y-3">
              {categoryTrends.map((trend: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border ${getTrendColor(
                    trend.trend
                  )}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{getTrendIcon(trend.trend)}</div>
                    <div>
                      <div className="font-medium text-gray-900">{trend.category}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        当前: {trend.currentCount} | 之前: {trend.previousCount} |{' '}
                        {trend.changePercent > 0 ? '+' : ''}
                        {trend.changePercent.toFixed(1)}%
                      </div>
                      {trend.topKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs text-gray-500">热门关键词:</span>
                          {trend.topKeywords.slice(0, 5).map((keyword: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{trend.avgScore.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">平均评分</div>
                  </div>
                </div>
              ))}

              {categoryTrends.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Folder className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>暂无分类趋势数据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

