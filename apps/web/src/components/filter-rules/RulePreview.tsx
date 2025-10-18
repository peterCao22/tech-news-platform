/**
 * Rule Preview Component
 * Story 3.2: Intelligent Filter Rules - Phase 3
 * 
 * 规则测试预览组件
 */

import React, { useState } from 'react';
import { Play, X, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import type { FilterRule, RuleTestResult } from '../../stores/filterRulesStore';
import { filterRulesService } from '../../services/filterRulesService';

interface RulePreviewProps {
  rule: FilterRule;
  isOpen: boolean;
  onClose: () => void;
}

export const RulePreview: React.FC<RulePreviewProps> = ({ rule, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<RuleTestResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testConfig, setTestConfig] = useState({
    limit: 20,
    startDate: '',
    endDate: '',
  });

  if (!isOpen) return null;

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await filterRulesService.testRule(rule.id, {
        limit: testConfig.limit,
        startDate: testConfig.startDate || undefined,
        endDate: testConfig.endDate || undefined,
      });
      
      setTestResults(result.results);
      setSummary(result.summary);
    } catch (error: any) {
      setError(error.message || '测试规则失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-5xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">规则测试预览</h2>
              <p className="mt-1 text-sm text-gray-600">{rule.name}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Test Configuration */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">测试配置</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    测试数量
                  </label>
                  <input
                    type="number"
                    value={testConfig.limit}
                    onChange={(e) => setTestConfig({ ...testConfig, limit: parseInt(e.target.value) })}
                    min={10}
                    max={100}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={testConfig.startDate}
                    onChange={(e) => setTestConfig({ ...testConfig, startDate: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={testConfig.endDate}
                    onChange={(e) => setTestConfig({ ...testConfig, endDate: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleTest}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {loading ? '测试中...' : '开始测试'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Summary Statistics */}
            {summary && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">测试摘要</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">{summary.totalTested}</div>
                    <div className="text-xs text-gray-600 mt-1">测试总数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-blue-600">{summary.affectedCount}</div>
                    <div className="text-xs text-gray-600 mt-1">受影响</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-green-600">{summary.boosted}</div>
                    <div className="text-xs text-gray-600 mt-1">提升</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-red-600">{summary.penalized}</div>
                    <div className="text-xs text-gray-600 mt-1">降低</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-700">
                      {summary.avgScoreChange > 0 ? '+' : ''}{summary.avgScoreChange.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">平均变化</div>
                  </div>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  测试结果 ({testResults.length}条)
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.map((result) => (
                    <div
                      key={result.contentId}
                      className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </h4>
                          
                          {/* Score Change */}
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">原始分:</span>
                              <span className="font-medium">{result.originalScore.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">新分:</span>
                              <span className="font-medium">{result.newScore.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {result.scoreChange > 0 ? (
                                <>
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-600">
                                    +{result.scoreChange.toFixed(2)}
                                  </span>
                                </>
                              ) : result.scoreChange < 0 ? (
                                <>
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                  <span className="font-medium text-red-600">
                                    {result.scoreChange.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500">无变化</span>
                              )}
                            </div>
                          </div>

                          {/* Adjustments */}
                          {result.adjustments && result.adjustments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {result.adjustments.map((adj, idx) => (
                                <div key={idx} className="text-xs text-gray-600">
                                  <span className="font-medium">{adj.ruleName}:</span>{' '}
                                  {adj.reason} ({adj.adjustment > 0 ? '+' : ''}{adj.adjustment.toFixed(2)})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Status Icon */}
                        <div>
                          {result.scoreChange !== 0 ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && testResults.length === 0 && !error && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无测试结果</h3>
                <p className="mt-1 text-sm text-gray-500">点击"开始测试"按钮查看规则效果</p>
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

