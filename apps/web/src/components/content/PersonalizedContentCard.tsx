/**
 * Story 4.1: Personalized Content Card Component
 * 个性化内容卡片组件
 * 显示个性化评分和推荐原因
 */

'use client';

import { useState } from 'react';
import { 
  ExternalLink, 
  Calendar, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ArrowUp
} from 'lucide-react';

interface ScoreAdjustment {
  reason: string;
  adjustment: number;
  details?: string;
}

interface PersonalizedContent {
  id: string;
  title: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  category?: string;
  source?: {
    name: string;
  };
  baseScore?: number;
  aiScore?: number;
  personalizedScore?: number;
  scoreAdjustments?: ScoreAdjustment[];
}

interface Props {
  content: PersonalizedContent;
  onClick?: () => void;
}

export default function PersonalizedContentCard({ content, onClick }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const baseScore = content.baseScore || content.aiScore || 0;
  const personalizedScore = content.personalizedScore || baseScore;
  const hasPersonalization = content.scoreAdjustments && content.scoreAdjustments.length > 0;
  const scoreDiff = personalizedScore - baseScore;

  /**
   * 格式化日期
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 获取评分颜色
   */
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  /**
   * 获取评分背景色
   */
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* 标题和个性化标识 */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
          {content.title}
          {hasPersonalization && scoreDiff > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              个性化推荐
            </span>
          )}
        </h3>
      </div>

      {/* 描述 */}
      {content.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {content.description}
        </p>
      )}

      {/* 元信息 */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
        {content.source && (
          <span className="flex items-center">
            <span className="font-medium">{content.source.name}</span>
          </span>
        )}
        {content.category && (
          <span className="px-2 py-1 bg-gray-100 rounded-full">
            {content.category}
          </span>
        )}
        {content.publishedAt && (
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(content.publishedAt)}
          </span>
        )}
      </div>

      {/* 评分展示 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 基础评分 */}
            <div>
              <div className="text-xs text-gray-500 mb-1">基础评分</div>
              <div className={`text-lg font-bold ${getScoreColor(baseScore)}`}>
                {baseScore.toFixed(1)}
              </div>
            </div>

            {/* 箭头 */}
            {hasPersonalization && scoreDiff !== 0 && (
              <ArrowUp 
                className={`w-5 h-5 ${scoreDiff > 0 ? 'text-green-500' : 'text-red-500 transform rotate-180'}`} 
              />
            )}

            {/* 个性化评分 */}
            {hasPersonalization && (
              <div>
                <div className="text-xs text-gray-500 mb-1">个性化评分</div>
                <div className={`text-lg font-bold ${getScoreColor(personalizedScore)}`}>
                  {personalizedScore.toFixed(1)}
                  <span className="text-sm ml-1">
                    ({scoreDiff > 0 ? '+' : ''}{scoreDiff.toFixed(1)})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 查看详情按钮 */}
          {hasPersonalization && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>{showDetails ? '收起详情' : '查看详情'}</span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* 个性化详情 */}
        {showDetails && hasPersonalization && (
          <div className={`mt-3 p-3 rounded-lg border ${getScoreBg(personalizedScore)}`}>
            <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              个性化调整详情
            </div>
            <div className="space-y-1.5">
              {content.scoreAdjustments!.map((adj, index) => (
                <div key={index} className="flex items-start justify-between text-xs">
                  <div className="flex-1">
                    <div className="font-medium text-gray-700">{adj.reason}</div>
                    {adj.details && (
                      <div className="text-gray-500 mt-0.5">{adj.details}</div>
                    )}
                  </div>
                  <div
                    className={`ml-2 font-bold ${
                      adj.adjustment > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {adj.adjustment > 0 ? '+' : ''}{adj.adjustment.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="mt-4 flex items-center space-x-2">
        {content.url && (
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <span>查看原文</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {onClick && (
          <button
            onClick={onClick}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700"
          >
            <span>查看详情</span>
          </button>
        )}
      </div>
    </div>
  );
}

