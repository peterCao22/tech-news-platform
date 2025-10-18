/**
 * Story 4.5: 智能通知与提醒
 * 通知设置页面
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestEmail,
  sendDigest,
  NotificationPreference,
} from '@/services/notificationService';
import { Bell, Mail, AlertCircle, Send, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await getNotificationPreferences();
      setPreferences(data);
      setFormData(data);
    } catch (error: any) {
      console.error('加载通知偏好失败:', error);
      toast.error(error.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateNotificationPreferences(formData);
      toast.success('设置已保存');
      await loadPreferences();
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error(error.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      await sendTestEmail();
      toast.success('测试邮件已发送');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '发送失败');
    }
  };

  const handleSendDigest = async () => {
    try {
      await sendDigest();
      toast.success('TOP10摘要已发送');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '发送失败');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">通知设置</h1>
            <p className="text-gray-600 mt-2">管理您的通知偏好和提醒方式</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>

        {/* 通知类型 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">通知类型</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <div className="font-medium">股票异动提醒</div>
                <div className="text-sm text-gray-600">当关注股票涨跌超过阈值时提醒</div>
              </div>
              <input
                type="checkbox"
                checked={formData.stockAlertEnabled}
                onChange={(e) => setFormData({ ...formData, stockAlertEnabled: e.target.checked })}
                className="w-5 h-5"
              />
            </label>

            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <div className="font-medium">重要新闻推送</div>
                <div className="text-sm text-gray-600">基于AI评分推送重要新闻</div>
              </div>
              <input
                type="checkbox"
                checked={formData.importantNewsEnabled}
                onChange={(e) => setFormData({ ...formData, importantNewsEnabled: e.target.checked })}
                className="w-5 h-5"
              />
            </label>

            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <div className="font-medium">每日TOP10摘要</div>
                <div className="text-sm text-gray-600">每天定时发送TOP10内容摘要</div>
              </div>
              <input
                type="checkbox"
                checked={formData.top10DigestEnabled}
                onChange={(e) => setFormData({ ...formData, top10DigestEnabled: e.target.checked })}
                className="w-5 h-5"
              />
            </label>
          </div>
        </div>

        {/* 邮件设置 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">邮件设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">邮箱地址</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="your@email.com"
              />
            </div>
            <button
              onClick={handleTestEmail}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Send className="w-4 h-4" />
              发送测试邮件
            </button>
          </div>
        </div>

        {/* 阈值设置 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">阈值设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                股票异动阈值: {formData.stockAlertThreshold}%
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={formData.stockAlertThreshold}
                onChange={(e) => setFormData({ ...formData, stockAlertThreshold: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                最低新闻评分: {formData.minNewsScore}分
              </label>
              <input
                type="range"
                min="60"
                max="100"
                step="5"
                value={formData.minNewsScore}
                onChange={(e) => setFormData({ ...formData, minNewsScore: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 时间设置 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">时间设置</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">静默时间开始</label>
              <input
                type="time"
                value={formData.quietHoursStart || ''}
                onChange={(e) => setFormData({ ...formData, quietHoursStart: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">静默时间结束</label>
              <input
                type="time"
                value={formData.quietHoursEnd || ''}
                onChange={(e) => setFormData({ ...formData, quietHoursEnd: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">摘要发送时间</label>
              <input
                type="time"
                value={formData.digestTime || ''}
                onChange={(e) => setFormData({ ...formData, digestTime: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">快速操作</h2>
          <button
            onClick={handleSendDigest}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Mail className="w-4 h-4" />
            立即发送TOP10摘要
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

