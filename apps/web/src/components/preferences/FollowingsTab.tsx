/**
 * Story 4.1: Followings Tab Component
 * 关注列表Tab组件
 */

'use client';

import { useState } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import PreferencesService from '@/services/preferencesService';
import { Plus, Trash2, Building2, TrendingUp, User, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FollowingsTab() {
  const { followings, addFollowing, removeFollowing } = usePreferencesStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFollowing, setNewFollowing] = useState({
    followType: 'COMPANY' as 'COMPANY' | 'STOCK' | 'PERSON' | 'ORGANIZATION',
    name: '',
    identifier: '',
    weight: 1.5,
    notifyOnNews: true,
    notifyOnPrice: false,
  });
  const [loading, setLoading] = useState(false);

  // 预设的公司/股票
  const popularFollowings = [
    { type: 'COMPANY', name: 'NVIDIA', identifier: 'NVDA' },
    { type: 'COMPANY', name: 'OpenAI', identifier: 'openai' },
    { type: 'COMPANY', name: 'Microsoft', identifier: 'MSFT' },
    { type: 'COMPANY', name: 'Google', identifier: 'GOOGL' },
    { type: 'COMPANY', name: 'Apple', identifier: 'AAPL' },
    { type: 'COMPANY', name: 'Tesla', identifier: 'TSLA' },
    { type: 'COMPANY', name: 'Meta', identifier: 'META' },
    { type: 'COMPANY', name: 'Amazon', identifier: 'AMZN' },
  ];

  /**
   * 添加关注
   */
  const handleAddFollowing = async () => {
    if (!newFollowing.name.trim()) {
      toast.error('请输入名称');
      return;
    }

    try {
      setLoading(true);
      const created = await PreferencesService.addFollowing(newFollowing);
      addFollowing(created);
      setNewFollowing({
        followType: 'COMPANY',
        name: '',
        identifier: '',
        weight: 1.5,
        notifyOnNews: true,
        notifyOnPrice: false,
      });
      setShowAddForm(false);
      toast.success('关注添加成功');
    } catch (error: any) {
      console.error('添加关注失败:', error);
      toast.error(error.response?.data?.message || '添加关注失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 快速添加
   */
  const handleQuickAdd = async (type: string, name: string, identifier: string) => {
    if (followings.some((f) => f.identifier === identifier)) {
      toast.error('已经关注了该对象');
      return;
    }

    try {
      const created = await PreferencesService.addFollowing({
        followType: type as any,
        name,
        identifier,
        weight: 1.5,
        notifyOnNews: true,
        notifyOnPrice: false,
      });
      addFollowing(created);
      toast.success(`已关注 "${name}"`);
    } catch (error: any) {
      console.error('添加关注失败:', error);
      toast.error('添加关注失败');
    }
  };

  /**
   * 删除关注
   */
  const handleDeleteFollowing = async (id: string) => {
    if (!confirm('确定要取消关注吗？')) return;

    try {
      await PreferencesService.deleteFollowing(id);
      removeFollowing(id);
      toast.success('已取消关注');
    } catch (error: any) {
      console.error('删除关注失败:', error);
      toast.error('删除关注失败');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPANY':
      case 'STOCK':
        return <Building2 className="w-5 h-5" />;
      case 'PERSON':
        return <User className="w-5 h-5" />;
      case 'ORGANIZATION':
        return <Globe className="w-5 h-5" />;
      default:
        return <Building2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ⭐ 关注您感兴趣的公司、股票或人物，我们会优先推荐相关新闻。
        </p>
      </div>

      {/* 当前关注列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">我的关注</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>添加关注</span>
          </button>
        </div>

        {/* 添加表单 */}
        {showAddForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类型
                </label>
                <select
                  value={newFollowing.followType}
                  onChange={(e) =>
                    setNewFollowing({
                      ...newFollowing,
                      followType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="COMPANY">公司</option>
                  <option value="STOCK">股票</option>
                  <option value="PERSON">人物</option>
                  <option value="ORGANIZATION">组织</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名称
                </label>
                <input
                  type="text"
                  value={newFollowing.name}
                  onChange={(e) =>
                    setNewFollowing({ ...newFollowing, name: e.target.value })
                  }
                  placeholder="例如: NVIDIA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  识别码 (股票代码/ID)
                </label>
                <input
                  type="text"
                  value={newFollowing.identifier}
                  onChange={(e) =>
                    setNewFollowing({
                      ...newFollowing,
                      identifier: e.target.value,
                    })
                  }
                  placeholder="例如: NVDA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  权重
                </label>
                <input
                  type="number"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={newFollowing.weight}
                  onChange={(e) =>
                    setNewFollowing({
                      ...newFollowing,
                      weight: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <button
                onClick={handleAddFollowing}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? '添加中...' : '确认添加'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 关注列表 */}
        {followings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            还没有添加任何关注，点击下方快速添加
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followings.map((following) => (
              <div
                key={following.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(following.followType)}
                    <div>
                      <h4 className="font-semibold text-gray-900">{following.name}</h4>
                      <p className="text-xs text-gray-500">{following.identifier}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFollowing(following.id)}
                    className="text-red-600 hover:text-red-700 focus:outline-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  权重: <span className="font-medium">{following.weight.toFixed(1)}x</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 快速添加 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          热门公司
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {popularFollowings.map((item) => (
            <button
              key={item.identifier}
              onClick={() => handleQuickAdd(item.type, item.name, item.identifier)}
              disabled={followings.some((f) => f.identifier === item.identifier)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

