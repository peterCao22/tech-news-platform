/**
 * Action Buttons Component
 * Story 3.1: 内容审核工作台
 * 
 * 审核操作按钮组件（通过、拒绝、发布等）
 */

import React from 'react';
import { clsx } from 'clsx';
import { 
  CheckCircle, 
  XCircle, 
  Rocket, 
  Edit, 
  Eye,
  Loader2 
} from 'lucide-react';

interface ActionButtonsProps {
  onApprove?: () => void;
  onReject?: () => void;
  onPublish?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  
  // 控制按钮显示
  showApprove?: boolean;
  showReject?: boolean;
  showPublish?: boolean;
  showEdit?: boolean;
  showView?: boolean;
  
  // 加载状态
  isLoading?: boolean;
  
  // 禁用状态
  disabled?: boolean;
  
  // 布局
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  
  className?: string;
}

// 按钮尺寸样式
const sizeStyles = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

// 图标尺寸
const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onApprove,
  onReject,
  onPublish,
  onEdit,
  onView,
  
  showApprove = true,
  showReject = true,
  showPublish = false,
  showEdit = true,
  showView = true,
  
  isLoading = false,
  disabled = false,
  
  layout = 'horizontal',
  size = 'md',
  
  className,
}) => {
  const buttonBaseClass = clsx(
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
    'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    sizeStyles[size]
  );

  const buttons = [];

  // 查看按钮
  if (showView && onView) {
    buttons.push(
      <button
        key="view"
        onClick={onView}
        disabled={disabled || isLoading}
        className={clsx(
          buttonBaseClass,
          'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
        )}
      >
        <Eye className={iconSizes[size]} />
        <span>查看</span>
      </button>
    );
  }

  // 编辑按钮
  if (showEdit && onEdit) {
    buttons.push(
      <button
        key="edit"
        onClick={onEdit}
        disabled={disabled || isLoading}
        className={clsx(
          buttonBaseClass,
          'bg-primary-100 text-primary-700 hover:bg-primary-200 focus:ring-primary-500'
        )}
      >
        <Edit className={iconSizes[size]} />
        <span>编辑</span>
      </button>
    );
  }

  // 通过按钮
  if (showApprove && onApprove) {
    buttons.push(
      <button
        key="approve"
        onClick={onApprove}
        disabled={disabled || isLoading}
        className={clsx(
          buttonBaseClass,
          'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
          'shadow-sm hover:shadow'
        )}
      >
        {isLoading ? (
          <Loader2 className={clsx(iconSizes[size], 'animate-spin')} />
        ) : (
          <CheckCircle className={iconSizes[size]} />
        )}
        <span>通过</span>
      </button>
    );
  }

  // 拒绝按钮
  if (showReject && onReject) {
    buttons.push(
      <button
        key="reject"
        onClick={onReject}
        disabled={disabled || isLoading}
        className={clsx(
          buttonBaseClass,
          'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
          'shadow-sm hover:shadow'
        )}
      >
        {isLoading ? (
          <Loader2 className={clsx(iconSizes[size], 'animate-spin')} />
        ) : (
          <XCircle className={iconSizes[size]} />
        )}
        <span>拒绝</span>
      </button>
    );
  }

  // 发布按钮
  if (showPublish && onPublish) {
    buttons.push(
      <button
        key="publish"
        onClick={onPublish}
        disabled={disabled || isLoading}
        className={clsx(
          buttonBaseClass,
          'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
          'shadow-sm hover:shadow'
        )}
      >
        {isLoading ? (
          <Loader2 className={clsx(iconSizes[size], 'animate-spin')} />
        ) : (
          <Rocket className={iconSizes[size]} />
        )}
        <span>发布</span>
      </button>
    );
  }

  return (
    <div
      className={clsx(
        'flex',
        layout === 'horizontal' ? 'flex-row gap-2' : 'flex-col gap-2',
        className
      )}
    >
      {buttons}
    </div>
  );
};

