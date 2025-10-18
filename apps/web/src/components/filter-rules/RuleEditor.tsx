/**
 * Rule Editor Component
 * Story 3.2: Intelligent Filter Rules
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useFilterRulesStore, type FilterRule, type RuleType } from '../../stores/filterRulesStore';
import { filterRulesService } from '../../services/filterRulesService';
import { KeywordManager } from './KeywordManager';
import { WeightAdjuster } from './WeightAdjuster';
import { getRuleTypeLabel } from './RuleTypeIcon';

interface RuleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  rule?: FilterRule | null;
  mode: 'create' | 'edit' | 'view';
}

interface RuleFormData {
  name: string;
  description: string;
  ruleType: RuleType;
  priority: number;
  config: {
    keywords?: string[];
    weight?: number;
    sources?: string[];
    sourceIds?: string[];
    categories?: string[];
    conditions?: {
      minScore?: number;
      maxScore?: number;
      requireAll?: boolean;
    };
  };
}

const RULE_TYPES: Array<{ value: RuleType; label: string; description: string }> = [
  {
    value: 'KEYWORD_BOOST',
    label: '关键词加权',
    description: '提升包含特定关键词的内容评分',
  },
  {
    value: 'KEYWORD_PENALTY',
    label: '关键词降权',
    description: '降低包含特定关键词的内容评分',
  },
  {
    value: 'SOURCE_WHITELIST',
    label: '来源白名单',
    description: '提升特定来源的内容评分',
  },
  {
    value: 'SOURCE_BLACKLIST',
    label: '来源黑名单',
    description: '屏蔽或降低特定来源的内容',
  },
  {
    value: 'CATEGORY_BOOST',
    label: '分类加权',
    description: '提升特定分类的内容评分',
  },
  {
    value: 'CATEGORY_PENALTY',
    label: '分类降权',
    description: '降低特定分类的内容评分',
  },
  {
    value: 'CUSTOM',
    label: '自定义规则',
    description: '高级自定义筛选规则',
  },
];

export const RuleEditor: React.FC<RuleEditorProps> = ({ isOpen, onClose, rule, mode }) => {
  const { addRule, updateRule, setError } = useFilterRulesStore();
  
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    ruleType: 'KEYWORD_BOOST',
    priority: 10,
    config: {
      keywords: [],
      weight: 1.5,
      conditions: {},
    },
  });

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize form data from rule
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || '',
        ruleType: rule.ruleType,
        priority: rule.priority,
        config: rule.config,
      });
    } else {
      // Reset for create mode
      setFormData({
        name: '',
        description: '',
        ruleType: 'KEYWORD_BOOST',
        priority: 10,
        config: {
          keywords: [],
          weight: 1.5,
          conditions: {},
        },
      });
    }
  }, [rule]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setValidationError('请输入规则名称');
      return;
    }

    if (
      (formData.ruleType === 'KEYWORD_BOOST' || formData.ruleType === 'KEYWORD_PENALTY') &&
      (!formData.config.keywords || formData.config.keywords.length === 0)
    ) {
      setValidationError('请至少添加一个关键词');
      return;
    }

    setLoading(true);
    setValidationError(null);

    try {
      if (mode === 'create') {
        const newRule = await filterRulesService.createRule({
          name: formData.name,
          description: formData.description,
          ruleType: formData.ruleType,
          priority: formData.priority,
          config: formData.config,
        });
        addRule(newRule);
      } else if (mode === 'edit' && rule) {
        const updatedRule = await filterRulesService.updateRule(rule.id, {
          name: formData.name,
          description: formData.description,
          priority: formData.priority,
          config: formData.config,
        });
        updateRule(rule.id, updatedRule);
      }
      
      onClose();
    } catch (error: any) {
      setError(error.message || '保存规则失败');
      setValidationError(error.message || '保存规则失败');
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? '创建新规则' : mode === 'edit' ? '编辑规则' : '查看规则'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Validation Error */}
            {validationError && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  规则名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="例如：AI关键词加权规则"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  规则描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="描述规则的作用和应用场景..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    规则类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) =>
                      setFormData({ ...formData, ruleType: e.target.value as RuleType })
                    }
                    disabled={isReadOnly || mode === 'edit'}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    {RULE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {RULE_TYPES.find((t) => t.value === formData.ruleType)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优先级
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) })
                    }
                    disabled={isReadOnly}
                    min={1}
                    max={100}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    数值越大优先级越高（1-100）
                  </p>
                </div>
              </div>
            </div>

            {/* Rule Configuration */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">规则配置</h3>

              {/* Keywords Configuration */}
              {(formData.ruleType === 'KEYWORD_BOOST' ||
                formData.ruleType === 'KEYWORD_PENALTY') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      关键词列表 <span className="text-red-500">*</span>
                    </label>
                    <KeywordManager
                      keywords={formData.config.keywords || []}
                      onChange={(keywords) =>
                        setFormData({
                          ...formData,
                          config: { ...formData.config, keywords },
                        })
                      }
                    />
                  </div>

                  <div>
                    <WeightAdjuster
                      value={formData.config.weight || 1.5}
                      onChange={(weight) =>
                        setFormData({
                          ...formData,
                          config: { ...formData.config, weight },
                        })
                      }
                      min={formData.ruleType === 'KEYWORD_BOOST' ? 1.1 : 0.1}
                      max={formData.ruleType === 'KEYWORD_BOOST' ? 5.0 : 0.9}
                      label="权重系数"
                      description={
                        formData.ruleType === 'KEYWORD_BOOST'
                          ? '匹配关键词时的评分提升倍数'
                          : '匹配关键词时的评分降低倍数'
                      }
                    />
                  </div>
                </>
              )}

              {/* Category Configuration */}
              {(formData.ruleType === 'CATEGORY_BOOST' ||
                formData.ruleType === 'CATEGORY_PENALTY') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分类列表 <span className="text-red-500">*</span>
                    </label>
                    <KeywordManager
                      keywords={formData.config.categories || []}
                      onChange={(categories) =>
                        setFormData({
                          ...formData,
                          config: { ...formData.config, categories },
                        })
                      }
                      placeholder="输入分类名称..."
                    />
                  </div>

                  <div>
                    <WeightAdjuster
                      value={formData.config.weight || 1.5}
                      onChange={(weight) =>
                        setFormData({
                          ...formData,
                          config: { ...formData.config, weight },
                        })
                      }
                      min={formData.ruleType === 'CATEGORY_BOOST' ? 1.1 : 0.1}
                      max={formData.ruleType === 'CATEGORY_BOOST' ? 5.0 : 0.9}
                      label="权重系数"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!isReadOnly && (
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? '保存中...' : '保存规则'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

