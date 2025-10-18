'use client';

/**
 * Story 4.3: 个人阅读分析与对比页面
 * /history/personal
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { getPersonalVsPlatform } from '@/services/historyService';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Award } from 'lucide-react';

export default function PersonalAnalysisPage() {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');
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
      const response = await getPersonalVsPlatform(period);
      setData(response.data);
    } catch (err: any) {
      console.error('加载个人分析数据失败:', err);
      setError(err.response?.data?.message || '加载数据失败');
    } finally {
      setLoading(false);
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

  const { myTop10, platformTop10, analysis, period: periodInfo } = data;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* 标题和时间选择 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">个人阅读分析</h1>
            <p className="text-gray-600 mt-1">
              对比分析：我的阅读习惯 vs 平台热门趋势
            </p>
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

        {/* 分析摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{analysis.matchScore}</div>
            </div>
            <div className="text-sm opacity-90">兴趣匹配度</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{analysis.overlap}</div>
            </div>
            <div className="text-sm opacity-90">重叠内容数</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{analysis.myUnique}</div>
            </div>
            <div className="text-sm opacity-90">我的独特关注</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{analysis.missedHot}</div>
            </div>
            <div className="text-sm opacity-90">错过的热门</div>
          </div>
        </div>

        {/* 重叠内容详情 */}
        {analysis.overlapItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              共同关注的内容
            </h2>
            <div className="space-y-3">
              {analysis.overlapItems.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.title}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-blue-600">
                      我的排名: <span className="font-bold">#{item.myRank}</span>
                    </div>
                    <div className="text-gray-600">
                      平台排名: <span className="font-bold">#{item.platformRank}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 我的阅读TOP10 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            我的阅读TOP10
          </h2>
          <div className="space-y-3">
            {myTop10.map((item: any) => (
              <div
                key={item.rank}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {item.rank}
                  </div>
                </div>
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
                    <span>{item.content.source?.name}</span>
                    <span>阅读 {item.readCount} 次</span>
                    <span>{Math.round(item.totalDuration / 60)} 分钟</span>
                    {item.platformRank && (
                      <span className="text-orange-600 font-medium">
                        平台排名 #{item.platformRank}
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
        </div>

        {/* 平台热门TOP10 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            同期平台热门TOP10
          </h2>
          <div className="space-y-3">
            {platformTop10.map((item: any) => (
              <div
                key={item.rank}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    {item.rank}
                  </div>
                </div>
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
                    <span>{item.content.source?.name}</span>
                    {item.myReadCount > 0 && (
                      <span className="text-blue-600 font-medium">
                        我读过 {item.myReadCount} 次
                      </span>
                    )}
                    {item.myRank && (
                      <span className="text-blue-600 font-medium">
                        我的排名 #{item.myRank}
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
        </div>
      </div>
    </DashboardLayout>
  );
}

