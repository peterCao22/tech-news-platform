/**
 * Rule Version Control Component
 * Story 3.2: Intelligent Filter Rules - Phase 4
 * 
 * 规则版本管理与回滚
 */

import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Clock, User, AlertCircle } from 'lucide-react';
import type { FilterRule, RuleVersion } from '../../stores/filterRulesStore';
import { filterRulesService } from '../../services/filterRulesService';
import { useFilterRulesStore } from '../../stores/filterRulesStore';

interface RuleVersionControlProps {
  rule: FilterRule;
  isOpen: boolean;
  onClose: () => void;
}

export const RuleVersionControl: React.FC<RuleVersionControlProps> = ({ rule, isOpen, onClose }) => {
  const { updateRule, setError } = useFilterRulesStore();
  const [versions, setVersions] = useState<RuleVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<RuleVersion | null>(null);

  useEffect(() => {
    if (isOpen && rule.id) {
      loadVersions();
    }
  }, [isOpen, rule.id]);

  if (!isOpen) return null;

  const loadVersions = async () => {
    setLoading(true);
    try {
      const versionsList = await filterRulesService.getRuleVersions(rule.id);
      setVersions(versionsList);
    } catch (error: any) {
      setError(error.message || '加载版本历史失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (version: RuleVersion) => {
    const changeLog = prompt('请输入回滚原因：');
    if (!changeLog) return;

    setRollbackLoading(version.id);
    try {
      const updatedRule = await filterRulesService.rollbackRule(
        rule.id,
        version.version,
        changeLog
      );
      updateRule(rule.id, updatedRule);
      await loadVersions();
      alert(`成功回滚到版本 ${version.version}`);
    } catch (error: any) {
      setError(error.message || '回滚失败');
    } finally {
      setRollbackLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">版本管理</h2>
              <p className="mt-1 text-sm text-gray-600">
                {rule.name} · 当前版本 v{rule.version}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无版本历史</h3>
                <p className="mt-1 text-sm text-gray-500">发布规则后将生成版本记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => {
                  const isCurrentVersion = version.version === rule.version;
                  const isRollingBack = rollbackLoading === version.id;

                  return (
                    <div
                      key={version.id}
                      className={`rounded-lg border p-4 transition-all ${
                        isCurrentVersion
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Version Header */}
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-gray-900">
                              v{version.version}
                            </span>
                            {isCurrentVersion && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                当前版本
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              {new Date(version.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Change Log */}
                          {version.changeLog && (
                            <div className="mt-2 text-sm text-gray-700">
                              <span className="font-medium">变更说明：</span>
                              {version.changeLog}
                            </div>
                          )}

                          {/* Creator Info */}
                          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                            <User className="h-4 w-4" />
                            <span>创建者: {version.createdBy || '未知'}</span>
                          </div>

                          {/* Config Preview */}
                          <div className="mt-3 rounded-md bg-gray-50 p-3">
                            <div className="text-xs font-medium text-gray-700 mb-1">配置预览</div>
                            <pre className="text-xs text-gray-600 overflow-x-auto">
                              {JSON.stringify(version.config, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {/* Actions */}
                        {!isCurrentVersion && (
                          <div className="ml-4">
                            <button
                              onClick={() => handleRollback(version)}
                              disabled={isRollingBack}
                              className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                              {isRollingBack ? '回滚中...' : '回滚'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Warning */}
            {versions.length > 0 && (
              <div className="mt-6 flex items-start gap-2 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <div className="font-medium">回滚注意事项</div>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>回滚将创建新版本，不会删除历史记录</li>
                    <li>回滚后需要重新发布规则才能生效</li>
                    <li>建议在测试环境验证后再在生产环境回滚</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

