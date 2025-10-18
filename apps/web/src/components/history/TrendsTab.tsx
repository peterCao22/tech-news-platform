'use client';

import React, { useState, useEffect } from 'react';
import { getTrendReport } from '@/services/historyService';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TrendsTab() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.response?.data?.message || '加载数据失败，请先执行趋势数据初始化');
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
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无趋势数据</h3>
            <p className="text-gray-700 mb-4">
              系统需要收集一段时间的内容数据后才能生成趋势分析。您可以：
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">📊 初始化趋势数据（管理员）</h4>
              <p className="text-sm text-gray-600 mb-2">
                如果您是管理员，可以运行以下命令回填历史趋势数据：
              </p>
              <code className="block bg-gray-900 text-green-400 px-4 py-2 rounded text-sm font-mono">
                cd apps/api<br />
                node init-trend-data.js
              </code>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">⏳ 等待系统自动聚合</h4>
              <p className="text-sm text-gray-600">
                系统会每天自动统计前一天的内容趋势，无需手动操作。请耐心等待数据积累。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { keywordTrends, categoryTrends, summary } = data;

  return (
    <div>
      {/* 时间选择 */}
      <div className="flex justify-end gap-2 mb-6">
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

      {/* 趋势摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-2xl font-bold text-gray-900">{summary.totalKeywords}</div>
          <div className="text-sm text-gray-600 mt-1">关键词总数</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-2xl font-bold text-green-600">{summary.risingKeywords}</div>
          <div className="text-sm text-gray-600 mt-1">上升关键词</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-2xl font-bold text-red-600">{summary.fallingKeywords}</div>
          <div className="text-sm text-gray-600 mt-1">下降关键词</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-2xl font-bold text-gray-900">{summary.totalCategories}</div>
          <div className="text-sm text-gray-600 mt-1">分类总数</div>
        </div>
      </div>

      {/* 关键词趋势 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">关键词趋势TOP10</h2>
        <div className="space-y-3">
          {keywordTrends.slice(0, 10).map((trend: any, index: number) => (
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
                  <div className="text-sm text-gray-600">
                    当前: {trend.currentCount} | {trend.changePercent > 0 ? '+' : ''}
                    {trend.changePercent.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{trend.avgScore.toFixed(1)}</div>
                <div className="text-xs text-gray-500">评分</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 分类趋势 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">分类趋势</h2>
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
                  <div className="text-sm text-gray-600">
                    当前: {trend.currentCount} | {trend.changePercent > 0 ? '+' : ''}
                    {trend.changePercent.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{trend.avgScore.toFixed(1)}</div>
                <div className="text-xs text-gray-500">评分</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

