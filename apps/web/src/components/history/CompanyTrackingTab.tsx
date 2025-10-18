'use client';

import React, { useState, useEffect } from 'react';
import { trackCompanyNews, getFollowingCompanies } from '@/services/historyService';
import { Search, Building2 } from 'lucide-react';

export default function CompanyTrackingTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [followingData, setFollowingData] = useState<any>(null);

  useEffect(() => {
    loadFollowingCompanies();
  }, [period]);

  const loadFollowingCompanies = async () => {
    try {
      const response = await getFollowingCompanies(period);
      setFollowingData(response.data);
    } catch (err: any) {
      console.error('加载关注公司失败:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('请输入公司名称或股票代码');
      return;
    }

    try {
      setLoading(true);
      const response = await trackCompanyNews(searchQuery, period);
      setSearchResults(response.data);
    } catch (err: any) {
      console.error('搜索公司新闻失败:', err);
      alert('搜索失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 搜索框 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入公司名称或股票代码，如 Tesla, AAPL..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-4 py-3 rounded-lg font-medium ${
                period === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              近7天
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-4 py-3 rounded-lg font-medium ${
                period === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              近30天
            </button>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </div>

      {/* 搜索结果 */}
      {searchResults && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {searchResults.company.name} 的新闻历史
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{searchResults.stats.totalCount}</div>
              <div className="text-sm text-gray-600">新闻总数</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{searchResults.stats.avgScore.toFixed(1)}</div>
              <div className="text-sm text-gray-600">平均评分</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {Object.keys(searchResults.stats.categories).length}
              </div>
              <div className="text-sm text-gray-600">涉及分类</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {Object.keys(searchResults.stats.sources).length}
              </div>
              <div className="text-sm text-gray-600">来源数量</div>
            </div>
          </div>

          <div className="space-y-3">
            {searchResults.news.slice(0, 10).map((item: any) => (
              <div key={item.id} className="p-4 border rounded-lg hover:border-blue-300">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  {item.title}
                </a>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                  <span>{item.source?.name}</span>
                  <span className="font-bold">{item.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 关注的公司 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">我关注的公司</h2>

        {followingData && followingData.companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followingData.companies.map((company: any, index: number) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:border-blue-300 cursor-pointer"
                onClick={() => {
                  setSearchQuery(company.company.name);
                  handleSearch();
                }}
              >
                <div className="flex justify-between mb-3">
                  <div>
                    <div className="font-medium">{company.company.name}</div>
                    <div className="text-xs text-gray-500">{company.company.identifier}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{company.newsCount}</div>
                    <div className="text-xs text-gray-500">条新闻</div>
                  </div>
                </div>
                {company.unreadCount > 0 && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                    {company.unreadCount} 条未读
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>暂无关注的公司</p>
          </div>
        )}
      </div>
    </div>
  );
}

