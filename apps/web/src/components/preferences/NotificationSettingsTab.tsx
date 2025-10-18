/**
 * Story 4.1: Notification Settings Tab Component
 * 通知设置Tab组件
 */

'use client';

import { useState, useEffect } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import PreferencesService from '@/services/preferencesService';
import { Save, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationSettingsTab() {
  const { preference, setPreference } = usePreferencesStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailNotifications: true,
    pushNotifications: false,
    notificationFrequency: 'daily',
  });

  useEffect(() => {
    if (preference) {
      setFormData({
        emailNotifications: preference.emailNotifications ?? true,
        pushNotifications: preference.pushNotifications ?? false,
        notificationFrequency: preference.notificationFrequency || 'daily',
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
      toast.success('通知设置已保存');
    } catch (error: any) {
      console.error('保存设置失败:', error);
      toast.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          🔔 管理您的通知偏好，及时获取感兴趣的内容更新。
        </p>
      </div>

      {/* 表单 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* 邮件通知 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <h4 className="text-sm font-medium text-gray-900">邮件通知</h4>
            <p className="text-xs text-gray-500 mt-1">
              接收个性化内容推荐和TOP10摘要
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.emailNotifications}
              onChange={(e) =>
                setFormData({ ...formData, emailNotifications: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* 推送通知 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <h4 className="text-sm font-medium text-gray-900">浏览器推送通知</h4>
            <p className="text-xs text-gray-500 mt-1">
              接收关注内容的即时更新提醒
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.pushNotifications}
              onChange={(e) =>
                setFormData({ ...formData, pushNotifications: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* 通知频率 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            通知频率
          </label>
          <div className="space-y-2">
            {[
              { value: 'realtime', label: '实时通知', desc: '有新内容时立即通知' },
              { value: 'daily', label: '每日摘要', desc: '每天发送一次汇总' },
              { value: 'weekly', label: '每周摘要', desc: '每周发送一次汇总' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={formData.notificationFrequency === option.value}
                  onChange={(e) =>
                    setFormData({ ...formData, notificationFrequency: e.target.value })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? '保存中...' : '保存通知设置'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

