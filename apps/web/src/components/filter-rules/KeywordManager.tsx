/**
 * Keyword Manager Component
 * Story 3.2: Intelligent Filter Rules
 */

import React, { useState } from 'react';
import { Plus, X, Upload, Download } from 'lucide-react';

interface KeywordManagerProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  maxKeywords?: number;
}

export const KeywordManager: React.FC<KeywordManagerProps> = ({
  keywords,
  onChange,
  placeholder = '输入关键词...',
  maxKeywords = 50,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddKeyword = () => {
    const trimmed = inputValue.trim();
    
    if (!trimmed) {
      return;
    }

    if (keywords.includes(trimmed)) {
      setError('关键词已存在');
      return;
    }

    if (keywords.length >= maxKeywords) {
      setError(`最多只能添加 ${maxKeywords} 个关键词`);
      return;
    }

    onChange([...keywords, trimmed]);
    setInputValue('');
    setError(null);
  };

  const handleRemoveKeyword = (keyword: string) => {
    onChange(keywords.filter((k) => k !== keyword));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleBatchImport = () => {
    const input = prompt('请输入关键词，用逗号、分号或换行分隔：');
    if (!input) return;

    const newKeywords = input
      .split(/[,;\n]/)
      .map((k) => k.trim())
      .filter((k) => k && !keywords.includes(k));

    if (keywords.length + newKeywords.length > maxKeywords) {
      alert(`导入后将超过最大限制（${maxKeywords}个）`);
      return;
    }

    onChange([...keywords, ...newKeywords]);
  };

  const handleExport = () => {
    const text = keywords.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keywords.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleAddKeyword}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          添加
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* Batch Operations */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-600">
          已添加 {keywords.length} / {maxKeywords} 个关键词
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBatchImport}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            <Upload className="h-4 w-4" />
            批量导入
          </button>
          {keywords.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <Download className="h-4 w-4" />
              导出
            </button>
          )}
        </div>
      </div>

      {/* Keywords List */}
      {keywords.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 p-3">
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="inline-flex items-center rounded-full hover:bg-blue-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

