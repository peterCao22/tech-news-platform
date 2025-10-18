'use client';

/**
 * Story 4.3: 公司追踪页面
 * /history/company
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { trackCompanyNews, getFollowingCompanies } from '@/services/historyService';
import { Search, Building2, TrendingUp, Calendar, ExternalLink } from 'lucide-react';

export default function CompanyTrackingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');
  const [loading, setLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [followingData, setFollowingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFollowingCompanies();
  }, [period]);

  const loadFollowingCompanies = async () => {
    try {
      setFollowingLoading(true);
      const response = await getFollowingCompanies(period);
      setFollowingData(response.data);
    } catch (err: any) {
      console.error('加载关注公司失败:', err);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('请输入公司名称或股票代码');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await trackCompanyNews(searchQuery, period);
      setSearchResults(response.data);
    } catch (err: any) {
      console.error('搜索公司新闻失败:', err);
      setError(err.response?.data?.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">公司追踪</h1>
          <p className="text-gray-600 mt-1">搜索并追踪特定公司或股票的新闻历史</p>
        </div>

        {/* 搜索框 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入公司名称或股票代码，如 Tesla, AAPL, 特斯拉..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('7d')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  period === '7d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                近7天
              </button>
              <button
                onClick={() => setPeriod('30d')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  period === '30d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                近30天
              </button>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>

        {/* 搜索结果 */}
        {searchResults && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              {searchResults.company.name} 的新闻历史
            </h2>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {searchResults.stats.totalCount}
                </div>
                <div className="text-sm text-gray-600">新闻总数</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {searchResults.stats.avgScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">平均评分</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(searchResults.stats.categories).length}
                </div>
                <div className="text-sm text-gray-600">涉及分类</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(searchResults.stats.sources).length}
                </div>
                <div className="text-sm text-gray-600">来源数量</div>
              </div>
            </div>

            {/* 新闻列表 */}
            <div className="space-y-3">
              {searchResults.news.length > 0 ? (
                searchResults.news.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {item.title}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.publishedAt).toLocaleDateString('zh-CN')}
                        </span>
                        <span>{item.source?.name}</span>
                        {item.category && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {item.category}
                          </span>
                        )}
                        {item.isRead && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            已读 {item.readCount} 次
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{item.score}</div>
                      <div className="text-xs text-gray-500">评分</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>未找到相关新闻</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 关注的公司 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            我关注的公司
          </h2>

          {followingLoading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : followingData && followingData.companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followingData.companies.map((company: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setSearchQuery(company.company.name);
                    handleSearch();
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {company.company.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {company.company.identifier}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {company.newsCount}
                      </div>
                      <div className="text-xs text-gray-500">条新闻</div>
                    </div>
                  </div>

                  {company.unreadCount > 0 && (
                    <div className="mb-3">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                        {company.unreadCount} 条未读
                      </span>
                    </div>
                  )}

                  {/* 最新新闻预览 */}
                  {company.latestNews.length > 0 && (
                    <div className="space-y-2">
                      {company.latestNews.slice(0, 2).map((news: any) => (
                        <div
                          key={news.id}
                          className="text-sm text-gray-600 truncate hover:text-blue-600"
                        >
                          • {news.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>暂无关注的公司</p>
              <p className="text-sm mt-2">
                前往{' '}
                <a href="/settings/preferences" className="text-blue-600 hover:underline">
                  个性化偏好
                </a>{' '}
                添加关注的公司
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

