/**
 * Rule Status Badge Component
 * Story 3.2: Intelligent Filter Rules
 */

import React from 'react';
import type { RuleStatus } from '../../stores/filterRulesStore';

interface RuleStatusBadgeProps {
  status: RuleStatus;
  className?: string;
}

const statusConfig: Record<RuleStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: {
    label: '草稿',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  ACTIVE: {
    label: '生效中',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  INACTIVE: {
    label: '已停用',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  ARCHIVED: {
    label: '已归档',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
};

export const RuleStatusBadge: React.FC<RuleStatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
};

