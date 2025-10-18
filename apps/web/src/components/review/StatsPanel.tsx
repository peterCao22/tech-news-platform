/**
 * Stats Panel Component
 * Story 3.1: 内容审核工作台
 * 
 * 统计面板组件 - 显示审核统计数据
 */

import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  BarChart2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { contentReviewService, type StatsResponse } from '../../services/contentReviewService';

interface StatsPanelProps {
  dateFrom?: Date;
  dateTo?: Date;
  className?: string;
}

// 格式化时间（毫秒转为可读形式）
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天`;
  if (hours > 0) return `${hours}小时`;
  if (minutes > 0) return `${minutes}分钟`;
  return `${seconds}秒`;
};

export const StatsPanel: React.FC<StatsPanelProps> = ({
  dateFrom,
  dateTo,
  className,
}) => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [dateFrom, dateTo]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentReviewService.getStats({ dateFrom, dateTo });
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={clsx('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-2 text-gray-600">加载统计数据...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-12', className)}>
        <AlertCircle className="w-10 h-10 text-error-500 mb-3" />
        <p className="text-gray-900 font-medium mb-1">加载失败</p>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <button
          onClick={loadStats}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* 总体统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 总审核数 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">总审核数</span>
            <BarChart2 className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalReviewed}</p>
        </div>

        {/* 通过率 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">审核通过率</span>
            <TrendingUp className="w-5 h-5 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.approvalRate.toFixed(1)}%
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-success-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.approvalRate}%` }}
            />
          </div>
        </div>

        {/* 平均审核时间 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">平均审核时间</span>
            <Clock className="w-5 h-5 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatDuration(stats.avgReviewTime)}
          </p>
        </div>

        {/* 待审核数量 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">待审核</span>
            <Clock className="w-5 h-5 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-warning-700">
            {stats.byStatus.pending}
          </p>
        </div>
      </div>

      {/* 状态分布 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5" />
          状态分布
        </h3>

        <div className="space-y-4">
          {/* 已通过 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-600" />
                <span className="text-sm text-gray-700">已通过</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.byStatus.approved}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-success-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(stats.byStatus.approved / stats.totalReviewed) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* 已拒绝 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-error-600" />
                <span className="text-sm text-gray-700">已拒绝</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.byStatus.rejected}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-error-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(stats.byStatus.rejected / stats.totalReviewed) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* 已发布 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-gray-700">已发布</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.byStatus.published}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(stats.byStatus.published / stats.totalReviewed) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 审核员统计 */}
      {stats.byReviewer && stats.byReviewer.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            审核员统计
          </h3>

          <div className="space-y-3">
            {stats.byReviewer.map((reviewer, index) => (
              <div
                key={reviewer.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {reviewer.userName}
                    </p>
                    <p className="text-xs text-gray-600">
                      平均时间: {formatDuration(reviewer.avgTime)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {reviewer.reviewCount}
                  </p>
                  <p className="text-xs text-gray-600">审核数</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分类统计 */}
      {stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            分类统计
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div
                key={category}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <p className="text-xs text-gray-600 mb-1">{category}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

