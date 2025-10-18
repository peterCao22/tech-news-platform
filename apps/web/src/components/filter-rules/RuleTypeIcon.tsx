/**
 * Rule Type Icon Component
 * Story 3.2: Intelligent Filter Rules
 */

import React from 'react';
import { TrendingUp, TrendingDown, List, Ban, Tag, X, Settings } from 'lucide-react';
import type { RuleType } from '../../stores/filterRulesStore';

interface RuleTypeIconProps {
  type: RuleType;
  className?: string;
}

const typeConfig: Record<RuleType, { Icon: React.FC<any>; label: string; color: string }> = {
  KEYWORD_BOOST: {
    Icon: TrendingUp,
    label: '关键词加权',
    color: 'text-green-600',
  },
  KEYWORD_PENALTY: {
    Icon: TrendingDown,
    label: '关键词降权',
    color: 'text-red-600',
  },
  SOURCE_WHITELIST: {
    Icon: List,
    label: '来源白名单',
    color: 'text-blue-600',
  },
  SOURCE_BLACKLIST: {
    Icon: Ban,
    label: '来源黑名单',
    color: 'text-gray-600',
  },
  CATEGORY_BOOST: {
    Icon: Tag,
    label: '分类加权',
    color: 'text-purple-600',
  },
  CATEGORY_PENALTY: {
    Icon: X,
    label: '分类降权',
    color: 'text-orange-600',
  },
  CUSTOM: {
    Icon: Settings,
    label: '自定义规则',
    color: 'text-indigo-600',
  },
};

export const RuleTypeIcon: React.FC<RuleTypeIconProps> = ({ type, className = '' }) => {
  const config = typeConfig[type];
  const Icon = config.Icon;

  return (
    <div className={`inline-flex items-center ${className}`}>
      <Icon className={`h-5 w-5 ${config.color}`} />
    </div>
  );
};

export const getRuleTypeLabel = (type: RuleType): string => {
  return typeConfig[type].label;
};

export const getRuleTypeColor = (type: RuleType): string => {
  return typeConfig[type].color;
};

