/**
 * Content Card Component
 * Story 3.1: 内容审核工作台
 * 
 * 内容卡片组件，显示待审核内容的摘要信息
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  ExternalLink,
  Calendar,
  Tag,
  TrendingUp,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ActionButtons } from './ActionButtons';
import type { ContentItem } from '../../stores/contentReviewStore';

interface ContentCardProps {
  content: ContentItem;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

// 格式化时间
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 截断文本
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  selected = false,
  onSelect,
  onApprove,
  onReject,
  onEdit,
  onView,
  showActions = true,
  compact = false,
  className,
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleAction = async (action: 'approve' | 'reject' | 'edit' | 'view') => {
    setIsActionLoading(true);
    try {
      switch (action) {
        case 'approve':
          await onApprove?.(content.id);
          break;
        case 'reject':
          await onReject?.(content.id);
          break;
        case 'edit':
          await onEdit?.(content.id);
          break;
        case 'view':
          await onView?.(content.id);
          break;
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  // 计算分数颜色
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-success-600';
    if (score >= 60) return 'text-primary-600';
    if (score >= 40) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border transition-all duration-200',
        'hover:shadow-md',
        selected
          ? 'border-primary-500 ring-2 ring-primary-200'
          : 'border-gray-200 hover:border-gray-300',
        compact ? 'p-4' : 'p-5',
        className
      )}
    >
      {/* 顶部区域：选择框 + 状态 + 分数 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* 选择框 */}
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(content.id)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          )}
          
          {/* 状态标签 */}
          <StatusBadge status={content.reviewStatus} size={compact ? 'sm' : 'md'} />
        </div>

        {/* 评分 */}
        {content.contentScore && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className={clsx('w-4 h-4', getScoreColor(content.contentScore.totalScore))} />
            <span className={clsx('text-sm font-semibold', getScoreColor(content.contentScore.totalScore))}>
              {content.contentScore.totalScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* 标题 */}
      <h3 className={clsx(
        'font-semibold text-gray-900 mb-2 hover:text-primary-600 cursor-pointer transition-colors',
        compact ? 'text-base' : 'text-lg'
      )}>
        {content.title}
      </h3>

      {/* 描述 */}
      {content.description && !compact && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {truncateText(content.description, 150)}
        </p>
      )}

      {/* 元信息 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 mb-3">
        {/* 来源 */}
        {content.source && (
          <div className="flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{content.source.name}</span>
          </div>
        )}

        {/* 分类 */}
        {content.category && (
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            <span>{content.category}</span>
          </div>
        )}

        {/* 创建时间 */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(content.createdAt)}</span>
        </div>

        {/* 审核信息 */}
        {content.reviewedBy && content.reviewedAt && (
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>审核于 {formatDate(content.reviewedAt)}</span>
          </div>
        )}
      </div>

      {/* 原文链接 */}
      {content.url && (
        <div className="mb-3">
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 hover:underline transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="truncate max-w-md">{content.url}</span>
          </a>
        </div>
      )}

      {/* 标签 */}
      {content.tags && content.tags.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {content.tags.slice(0, 5).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {tag}
            </span>
          ))}
          {content.tags.length > 5 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{content.tags.length - 5}
            </span>
          )}
        </div>
      )}

      {/* 审核备注 */}
      {content.reviewNotes && (
        <div className="mb-3 p-3 bg-warning-50 border border-warning-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-warning-800 mb-1">审核备注</p>
              <p className="text-xs text-warning-700">{content.reviewNotes}</p>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {showActions && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <ActionButtons
            onApprove={onApprove ? () => handleAction('approve') : undefined}
            onReject={onReject ? () => handleAction('reject') : undefined}
            onEdit={onEdit ? () => handleAction('edit') : undefined}
            onView={onView ? () => handleAction('view') : undefined}
            showApprove={content.reviewStatus === 'PENDING_REVIEW'}
            showReject={content.reviewStatus === 'PENDING_REVIEW'}
            showPublish={false}
            isLoading={isActionLoading}
            size={compact ? 'sm' : 'md'}
            className="flex-1"
          />
        </div>
      )}

      {/* 最后编辑信息 */}
      {content.lastEditedBy && content.lastEditedAt && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>最后编辑于 {formatDate(content.lastEditedAt)}</span>
        </div>
      )}
    </div>
  );
};

