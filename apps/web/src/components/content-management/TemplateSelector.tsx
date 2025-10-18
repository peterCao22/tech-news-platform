/**
 * Template Selector Component
 * 模板选择器组件
 * Story 3.3: Manual Content Management
 */

'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Check, Loader } from 'lucide-react';
import { contentManagementService, ContentTemplate } from '@/services/contentManagementService';
import { useContentManagementStore } from '@/stores/contentManagementStore';

interface TemplateSelectorProps {
  onTemplateSelect?: (template: ContentTemplate | any) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [builtInTemplates, setBuiltInTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedTemplateId, applyTemplate } = useContentManagementStore();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 加载自定义模板和内置模板
      const [customResponse, builtInResponse] = await Promise.all([
        contentManagementService.getTemplates({ isActive: true }),
        contentManagementService.getBuiltInTemplates(),
      ]);

      if (customResponse.success) {
        setTemplates(customResponse.data.items);
      }

      if (builtInResponse.success) {
        setBuiltInTemplates(builtInResponse.data.items);
      }
    } catch (err: any) {
      setError('加载模板失败');
      console.error('加载模板错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: ContentTemplate | any) => {
    applyTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">加载模板...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={loadTemplates}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
        >
          重试
        </button>
      </div>
    );
  }

  const allTemplates = [...builtInTemplates, ...templates];

  if (allTemplates.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">暂无可用模板</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">选择模板（可选）</h4>
        <button
          onClick={loadTemplates}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 内置模板 */}
        {builtInTemplates.map((template, index) => {
          const isSelected = selectedTemplateId === template.name;

          return (
            <button
              key={`builtin-${index}`}
              onClick={() => handleSelectTemplate(template)}
              className={`relative p-4 border-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
              )}

              <div className="flex items-start">
                <FileText className={`h-5 w-5 mr-2 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {template.name}
                  </div>
                  {template.description && (
                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  )}
                  {template.category && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {template.category}
                      </span>
                    </div>
                  )}
                  {template.template?.tags && template.template.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {template.template.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* 自定义模板 */}
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id;

          return (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className={`relative p-4 border-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
              )}

              <div className="flex items-start">
                <FileText className={`h-5 w-5 mr-2 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {template.name}
                    </div>
                    <span className="ml-2 text-xs text-purple-600 font-medium">自定义</span>
                  </div>
                  {template.description && (
                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  )}
                  {template.category && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        {template.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;

