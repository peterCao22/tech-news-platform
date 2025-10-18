'use client';

import React, { useState, useEffect } from 'react';
import { getPersonalVsPlatform } from '@/services/historyService';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';

export default function PersonalAnalysisTab() {
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
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { myTop10, platformTop10, analysis } = data;

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
            <TrendingUp className="w-8 h-8 opacity-80" />
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

      {/* 我的阅读TOP10 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">我的阅读TOP10</h2>
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
        <h2 className="text-xl font-bold text-gray-900 mb-4">同期平台热门TOP10</h2>
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
  );
}

