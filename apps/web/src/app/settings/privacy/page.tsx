'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { 
  clearReadingHistory, 
  clearImplicitPreferences,
  learnImplicitPreferences
} from '@/services/behaviorService';
import { behaviorTracker } from '@/lib/behaviorTracker';
import { 
  Shield, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrivacySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(behaviorTracker.isEnabled());

  // 切换行为追踪
  const toggleTracking = () => {
    if (trackingEnabled) {
      behaviorTracker.disable();
      setTrackingEnabled(false);
      toast.success('行为追踪已禁用');
    } else {
      behaviorTracker.enable();
      setTrackingEnabled(true);
      toast.success('行为追踪已启用');
    }
  };

  // 清除阅读历史
  const handleClearHistory = async () => {
    if (!confirm('确定要清除所有阅读历史吗？此操作不可撤销。')) {
      return;
    }

    try {
      setLoading(true);
      const result = await clearReadingHistory();
      toast.success(`已清除 ${result.deleted} 条阅读历史`);
    } catch (error: any) {
      console.error('Clear history failed:', error);
      toast.error('清除历史失败');
    } finally {
      setLoading(false);
    }
  };

  // 清除隐式偏好
  const handleClearPreferences = async () => {
    if (!confirm('确定要清除所有从行为学习的偏好吗？此操作不可撤销。')) {
      return;
    }

    try {
      setLoading(true);
      const result = await clearImplicitPreferences();
      toast.success(`已清除 ${result.deleted} 条隐式偏好`);
    } catch (error: any) {
      console.error('Clear preferences failed:', error);
      toast.error('清除偏好失败');
    } finally {
      setLoading(false);
    }
  };

  // 重新学习偏好
  const handleRelearn = async () => {
    try {
      setLoading(true);
      await learnImplicitPreferences();
      toast.success('偏好重新学习完成');
    } catch (error: any) {
      console.error('Relearn failed:', error);
      toast.error('学习失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">隐私与数据</h1>
          <p className="text-sm text-gray-600 mt-1">
            管理您的隐私设置和数据
          </p>
        </div>

        {/* 行为追踪开关 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {trackingEnabled ? (
                  <Eye className="h-5 w-5 text-blue-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  行为追踪
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                启用行为追踪以获得个性化推荐和内容优化。
                我们会追踪您的阅读时间、滚动深度和内容互动，用于改善您的体验。
              </p>
            </div>
            
            <button
              onClick={toggleTracking}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                trackingEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  trackingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              数据管理
            </h3>
          </div>
          
          <div className="space-y-4">
            {/* 清除阅读历史 */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  清除阅读历史
                </h4>
                <p className="text-sm text-gray-600">
                  删除所有阅读记录，包括阅读时长、滚动深度等数据。
                </p>
              </div>
              
              <button
                onClick={handleClearHistory}
                disabled={loading}
                className="ml-4 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                清除历史
              </button>
            </div>

            {/* 清除隐式偏好 */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  清除学习的偏好
                </h4>
                <p className="text-sm text-gray-600">
                  删除所有从您的行为中自动学习的偏好数据。
                </p>
              </div>
              
              <button
                onClick={handleClearPreferences}
                disabled={loading}
                className="ml-4 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                清除偏好
              </button>
            </div>

            {/* 重新学习偏好 */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  重新学习偏好
                </h4>
                <p className="text-sm text-gray-600">
                  基于当前的阅读历史重新分析和学习您的偏好。
                </p>
              </div>
              
              <button
                onClick={handleRelearn}
                disabled={loading}
                className="ml-4 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                重新学习
              </button>
            </div>
          </div>
        </div>

        {/* 隐私说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                我们如何使用您的数据
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 您的数据仅用于改善个性化推荐体验</li>
                <li>• 我们不会将您的数据分享给第三方</li>
                <li>• 您可以随时查看、导出或删除您的数据</li>
                <li>• 禁用行为追踪不影响基本功能使用</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

