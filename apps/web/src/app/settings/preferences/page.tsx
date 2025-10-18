/**
 * Story 4.1: User Preferences Settings Page
 * 用户个性化偏好设置主页面
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { usePreferencesStore } from '@/stores/preferencesStore';
import PreferencesService from '@/services/preferencesService';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Settings, Download, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Tab 组件
import InterestsTab from '@/components/preferences/InterestsTab';
import FollowingsTab from '@/components/preferences/FollowingsTab';
import SourceWeightsTab from '@/components/preferences/SourceWeightsTab';
import DisplaySettingsTab from '@/components/preferences/DisplaySettingsTab';
import NotificationSettingsTab from '@/components/preferences/NotificationSettingsTab';

export default function PreferencesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const {
    activeTab,
    setActiveTab,
    setPreference,
    setInterests,
    setFollowings,
    setSourceWeights,
  } = usePreferencesStore();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // 检查认证
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // 加载偏好数据
  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    }
  }, [isAuthenticated]);

  /**
   * 加载所有偏好数据
   */
  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      // 并行加载所有数据
      const [preference, interests, followings, sourceWeights] = await Promise.all([
        PreferencesService.getPreference(),
        PreferencesService.getInterests(),
        PreferencesService.getFollowings(),
        PreferencesService.getSourceWeights(),
      ]);

      setPreference(preference);
      setInterests(interests);
      setFollowings(followings);
      setSourceWeights(sourceWeights);
    } catch (error: any) {
      console.error('加载偏好数据失败:', error);
      toast.error('加载偏好数据失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 导出偏好配置
   */
  const handleExport = async () => {
    try {
      setExporting(true);
      const exportData = await PreferencesService.exportPreferences();

      // 创建下载链接
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('偏好配置已导出');
    } catch (error: any) {
      console.error('导出偏好失败:', error);
      toast.error('导出偏好失败');
    } finally {
      setExporting(false);
    }
  };

  /**
   * 导入偏好配置
   */
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // 导入数据
        await PreferencesService.importPreferences(data, false);
        
        // 重新加载数据
        await loadPreferences();
        
        toast.success('偏好配置已导入');
      } catch (error: any) {
        console.error('导入偏好失败:', error);
        toast.error('导入偏好失败，请检查文件格式');
      }
    };
    input.click();
  };

  // Tabs 配置
  const tabs = [
    { id: 'interests', name: '兴趣领域', icon: '🎯' },
    { id: 'followings', name: '关注列表', icon: '⭐' },
    { id: 'sourceWeights', name: '信息源', icon: '📰' },
    { id: 'display', name: '显示设置', icon: '🎨' },
    { id: 'notifications', name: '通知设置', icon: '🔔' },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* 页面头部 */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    个性化偏好设置
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    自定义您的内容推荐和阅读体验
                  </p>
                </div>
              </div>

              {/* 导入导出按钮 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleImport}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>导入配置</span>
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{exporting ? '导出中...' : '导出配置'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab 内容 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          ) : (
            <>
              {activeTab === 'interests' && <InterestsTab />}
              {activeTab === 'followings' && <FollowingsTab />}
              {activeTab === 'sourceWeights' && <SourceWeightsTab />}
              {activeTab === 'display' && <DisplaySettingsTab />}
              {activeTab === 'notifications' && <NotificationSettingsTab />}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

