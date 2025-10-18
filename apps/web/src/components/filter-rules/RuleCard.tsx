/**
 * Rule Card Component
 * Story 3.2: Intelligent Filter Rules
 */

import React, { useState } from 'react';
import { Edit, Trash2, Play, Pause, Eye, MoreVertical, CheckCircle, History } from 'lucide-react';
import type { FilterRule } from '../../stores/filterRulesStore';
import { RuleStatusBadge } from './RuleStatusBadge';
import { RuleTypeIcon, getRuleTypeLabel } from './RuleTypeIcon';
import { RuleVersionControl } from './RuleVersionControl';
import { filterRulesService } from '../../services/filterRulesService';
import { useFilterRulesStore } from '../../stores/filterRulesStore';

interface RuleCardProps {
  rule: FilterRule;
  onEdit: (rule: FilterRule) => void;
  onView: (rule: FilterRule) => void;
  onTest: (rule: FilterRule) => void;
}

export const RuleCard: React.FC<RuleCardProps> = ({ rule, onEdit, onView, onTest }) => {
  const { updateRule, removeRule, setError } = useFilterRulesStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVersionControlOpen, setIsVersionControlOpen] = useState(false);

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const newStatus = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = await filterRulesService.updateRule(rule.id, {
        status: newStatus,
      });
      updateRule(rule.id, updated);
    } catch (error: any) {
      setError(error.message || '更新规则状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('确定要发布这个规则吗？发布后将创建新版本。')) {
      return;
    }

    setIsLoading(true);
    try {
      const updated = await filterRulesService.publishRule(rule.id, '发布规则');
      updateRule(rule.id, updated);
    } catch (error: any) {
      setError(error.message || '发布规则失败');
    } finally {
      setIsLoading(false);
      setIsMenuOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除规则"${rule.name}"吗？此操作不可恢复。`)) {
      return;
    }

    setIsLoading(true);
    try {
      await filterRulesService.deleteRule(rule.id);
      removeRule(rule.id);
    } catch (error: any) {
      setError(error.message || '删除规则失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <RuleTypeIcon type={rule.ruleType} className="mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {rule.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {rule.description || '暂无描述'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <RuleStatusBadge status={rule.status} />
      </div>

      {/* Metadata */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          类型: {getRuleTypeLabel(rule.ruleType)}
        </span>
        <span className="flex items-center gap-1">
          优先级: {rule.priority}
        </span>
        {rule.isPublished && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            v{rule.version}
          </span>
        )}
      </div>

      {/* Config Preview */}
      <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
        {rule.config.keywords && rule.config.keywords.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">关键词: </span>
            <span className="text-gray-600">
              {rule.config.keywords.slice(0, 3).join(', ')}
              {rule.config.keywords.length > 3 && ` +${rule.config.keywords.length - 3}...`}
            </span>
          </div>
        )}
        {rule.config.weight && (
          <div className="mt-1">
            <span className="font-medium text-gray-700">权重: </span>
            <span className="text-gray-600">{rule.config.weight}x</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="text-xs text-gray-500">
          {rule.creator?.name || '未知'} · {new Date(rule.createdAt).toLocaleDateString()}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <button
            onClick={() => onView(rule)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={() => onTest(rule)}
            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
            title="测试规则"
          >
            <Play className="h-4 w-4" />
          </button>

          <button
            onClick={() => onEdit(rule)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            title="编辑"
          >
            <Edit className="h-4 w-4" />
          </button>

          {rule.isPublished && (
            <button
              onClick={() => setIsVersionControlOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              title="版本历史"
            >
              <History className="h-4 w-4" />
            </button>
          )}

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
                  <button
                    onClick={handleToggleStatus}
                    disabled={isLoading}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {rule.status === 'ACTIVE' ? (
                      <>
                        <Pause className="h-4 w-4" />
                        停用规则
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        启用规则
                      </>
                    )}
                  </button>

                  {rule.status === 'DRAFT' && (
                    <button
                      onClick={handlePublish}
                      disabled={isLoading}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      发布规则
                    </button>
                  )}

                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除规则
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white bg-opacity-75">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Version Control Modal */}
      <RuleVersionControl
        rule={rule}
        isOpen={isVersionControlOpen}
        onClose={() => setIsVersionControlOpen(false)}
      />
    </div>
  );
};

