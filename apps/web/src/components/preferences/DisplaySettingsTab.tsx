/**
 * Story 4.1: Display Settings Tab Component
 * 显示设置Tab组件
 */

'use client';

import { useState, useEffect } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import PreferencesService from '@/services/preferencesService';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DisplaySettingsTab() {
  const { preference, setPreference } = usePreferencesStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contentTypes: [] as string[],
    preferredLanguage: 'zh-CN',
    timezone: 'Asia/Shanghai',
    itemsPerPage: 20,
    defaultSortBy: 'score',
  });

  useEffect(() => {
    if (preference) {
      setFormData({
        contentTypes: preference.contentTypes || [],
        preferredLanguage: preference.preferredLanguage || 'zh-CN',
        timezone: preference.timezone || 'Asia/Shanghai',
        itemsPerPage: preference.itemsPerPage || 20,
        defaultSortBy: preference.defaultSortBy || 'score',
      });
    }
  }, [preference]);

  /**
   * 保存设置
   */
  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await PreferencesService.updatePreference(formData);
      setPreference(updated);
      toast.success('设置已保存');
    } catch (error: any) {
      console.error('保存设置失败:', error);
      toast.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleContentType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter((t) => t !== type)
        : [...prev.contentTypes, type],
    }));
  };

  return (
    <div className="space-y-6">
      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          🎨 自定义显示偏好，优化您的阅读体验。
        </p>
      </div>

      {/* 表单 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* 内容类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            内容类型偏好
          </label>
          <div className="space-y-2">
            {[
              { value: 'news', label: '📰 新闻资讯' },
              { value: 'analysis', label: '📊 分析报告' },
              { value: 'technical', label: '💻 技术文档' },
              { value: 'opinion', label: '💬 观点评论' },
            ].map((type) => (
              <label key={type.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.contentTypes.includes(type.value)}
                  onChange={() => toggleContentType(type.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 语言 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            首选语言
          </label>
          <select
            value={formData.preferredLanguage}
            onChange={(e) =>
              setFormData({ ...formData, preferredLanguage: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
            <option value="zh-TW">繁體中文</option>
          </select>
        </div>

        {/* 时区 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            时区
          </label>
          <select
            value={formData.timezone}
            onChange={(e) =>
              setFormData({ ...formData, timezone: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Asia/Shanghai">中国 (UTC+8)</option>
            <option value="America/New_York">美国东部 (UTC-5)</option>
            <option value="America/Los_Angeles">美国西部 (UTC-8)</option>
            <option value="Europe/London">伦敦 (UTC+0)</option>
          </select>
        </div>

        {/* 每页数量 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            每页显示数量
          </label>
          <select
            value={formData.itemsPerPage}
            onChange={(e) =>
              setFormData({ ...formData, itemsPerPage: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 条</option>
            <option value="20">20 条</option>
            <option value="30">30 条</option>
            <option value="50">50 条</option>
          </select>
        </div>

        {/* 默认排序 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            默认排序方式
          </label>
          <select
            value={formData.defaultSortBy}
            onChange={(e) =>
              setFormData({ ...formData, defaultSortBy: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">按评分排序</option>
            <option value="date">按日期排序</option>
            <option value="relevance">按相关度排序</option>
          </select>
        </div>

        {/* 保存按钮 */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? '保存中...' : '保存设置'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

