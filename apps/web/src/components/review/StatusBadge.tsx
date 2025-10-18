/**
 * Status Badge Component
 * Story 3.1: 内容审核工作台
 * 
 * 显示内容审核状态的徽章组件
 */

import React from 'react';
import { clsx } from 'clsx';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Rocket 
} from 'lucide-react';
import type { ContentReviewStatus } from '../../stores/contentReviewStore';

interface StatusBadgeProps {
  status: ContentReviewStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

// 状态配置映射
const statusConfig: Record<
  ContentReviewStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  DRAFT: {
    label: '草稿',
    icon: FileText,
    colorClass: 'text-gray-600',
    bgClass: 'bg-gray-100',
    borderClass: 'border-gray-300',
  },
  PENDING_REVIEW: {
    label: '待审核',
    icon: Clock,
    colorClass: 'text-warning-700',
    bgClass: 'bg-warning-100',
    borderClass: 'border-warning-300',
  },
  APPROVED: {
    label: '已通过',
    icon: CheckCircle,
    colorClass: 'text-success-700',
    bgClass: 'bg-success-100',
    borderClass: 'border-success-300',
  },
  REJECTED: {
    label: '已拒绝',
    icon: XCircle,
    colorClass: 'text-error-700',
    bgClass: 'bg-error-100',
    borderClass: 'border-error-300',
  },
  PUBLISHED: {
    label: '已发布',
    icon: Rocket,
    colorClass: 'text-primary-700',
    bgClass: 'bg-primary-100',
    borderClass: 'border-primary-300',
  },
};

// 尺寸样式映射
const sizeStyles = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    iconSize: 'w-3 h-3',
    gap: 'gap-1',
  },
  md: {
    padding: 'px-3 py-1',
    text: 'text-sm',
    iconSize: 'w-4 h-4',
    gap: 'gap-1.5',
  },
  lg: {
    padding: 'px-4 py-1.5',
    text: 'text-base',
    iconSize: 'w-5 h-5',
    gap: 'gap-2',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const config = statusConfig[status];
  const sizeStyle = sizeStyles[size];
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border transition-all duration-200',
        config.colorClass,
        config.bgClass,
        config.borderClass,
        sizeStyle.padding,
        sizeStyle.text,
        sizeStyle.gap,
        'hover:shadow-sm',
        className
      )}
    >
      {showIcon && <Icon className={sizeStyle.iconSize} />}
      <span>{config.label}</span>
    </span>
  );
};

// 导出状态配置供其他组件使用
export { statusConfig };

