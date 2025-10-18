/**
 * Audit Log Viewer Component
 * Story 3.1: 内容审核工作台
 * 
 * 审核日志查看器 - 显示内容的审核历史
 */

import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
  Clock,
  User,
  CheckCircle,
  XCircle,
  Edit,
  FileText,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { contentReviewService, type AuditLog } from '../../services/contentReviewService';

interface AuditLogViewerProps {
  contentId: string;
  className?: string;
}

// 操作类型图标映射
const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  STATUS_CHANGE: CheckCircle,
  CONTENT_UPDATE: Edit,
  CONTENT_CREATE: FileText,
  APPROVE: CheckCircle,
  REJECT: XCircle,
  PUBLISH: CheckCircle,
};

// 操作类型颜色映射
const actionColors: Record<string, string> = {
  APPROVE: 'text-success-600 bg-success-50',
  REJECT: 'text-error-600 bg-error-50',
  PUBLISH: 'text-primary-600 bg-primary-50',
  STATUS_CHANGE: 'text-warning-600 bg-warning-50',
  CONTENT_UPDATE: 'text-gray-600 bg-gray-50',
  CONTENT_CREATE: 'text-gray-600 bg-gray-50',
};

// 格式化时间
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// 格式化操作名称
const formatAction = (action: string): string => {
  const actionMap: Record<string, string> = {
    STATUS_CHANGE: '状态变更',
    CONTENT_UPDATE: '内容编辑',
    CONTENT_CREATE: '内容创建',
    APPROVE: '审核通过',
    REJECT: '审核拒绝',
    PUBLISH: '内容发布',
  };
  return actionMap[action] || action;
};

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  contentId,
  className,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLogs();
  }, [contentId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentReviewService.getAuditLog(contentId);
      setLogs(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className={clsx('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        <span className="ml-2 text-gray-600">加载审核日志...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-8', className)}>
        <AlertCircle className="w-8 h-8 text-error-500 mb-2" />
        <p className="text-gray-900 font-medium mb-1">加载失败</p>
        <p className="text-gray-600 text-sm mb-3">{error}</p>
        <button
          onClick={loadLogs}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-8', className)}>
        <FileText className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-gray-600 text-sm">暂无审核记录</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">审核历史</h3>
        <span className="text-sm text-gray-600">{logs.length} 条记录</span>
      </div>

      {/* 时间轴 */}
      <div className="relative">
        {/* 竖线 */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* 日志条目 */}
        <div className="space-y-4">
          {logs.map((log, index) => {
            const Icon = actionIcons[log.action] || FileText;
            const colorClass = actionColors[log.action] || 'text-gray-600 bg-gray-50';
            const isExpanded = expandedLogs.has(log.id);
            const hasDetails = log.changes || log.notes;

            return (
              <div key={log.id} className="relative pl-14">
                {/* 图标 */}
                <div
                  className={clsx(
                    'absolute left-0 w-12 h-12 rounded-full border-2 border-white flex items-center justify-center',
                    colorClass
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* 内容 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {formatAction(log.action)}
                        </span>
                        {log.oldStatus && log.newStatus && (
                          <span className="text-sm text-gray-600">
                            {log.oldStatus} → {log.newStatus}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{log.user?.name || '系统'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(log.createdAt)}</span>
                        </div>
                      </div>

                      {/* 备注 */}
                      {log.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          {log.notes}
                        </div>
                      )}

                      {/* 变更详情（可展开） */}
                      {log.changes && (
                        <div className="mt-2">
                          {hasDetails && (
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  <span>隐藏详情</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  <span>查看详情</span>
                                </>
                              )}
                            </button>
                          )}

                          {isExpanded && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

