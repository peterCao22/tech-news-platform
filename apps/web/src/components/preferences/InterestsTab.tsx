/**
 * Story 4.1: Interests Tab Component
 * 兴趣领域Tab组件
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import PreferencesService from '@/services/preferencesService';
import { Plus, Trash2, TrendingUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InterestsTab() {
  const { interests, setInterests, addInterest, updateInterest, removeInterest } =
    usePreferencesStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newInterest, setNewInterest] = useState({
    category: 'technology_field',
    name: '',
    weight: 1.0,
  });
  const [loading, setLoading] = useState(false);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // 初始化本地权重状态
  useEffect(() => {
    const weights: Record<string, number> = {};
    interests.forEach(interest => {
      weights[interest.id] = interest.weight;
    });
    setLocalWeights(weights);
  }, [interests]);

  // 预设的兴趣选项
  const presetInterests = {
    technology_field: [
      'AI',
      'Machine Learning',
      'Blockchain',
      'Quantum Computing',
      'Cloud Computing',
      'Edge Computing',
      'Cybersecurity',
      'Data Science',
      'IoT',
      'Robotics',
      'AR/VR',
      'Web3',
    ],
    topic: [
      'Startup Funding',
      'Product Launch',
      'Mergers & Acquisitions',
      'Tech Policy',
      'Open Source',
      'Developer Tools',
    ],
  };

  /**
   * 添加兴趣
   */
  const handleAddInterest = async () => {
    if (!newInterest.name.trim()) {
      toast.error('请输入兴趣名称');
      return;
    }

    try {
      setLoading(true);
      const created = await PreferencesService.addInterest(newInterest);
      addInterest(created);
      setNewInterest({ category: 'technology_field', name: '', weight: 1.0 });
      setShowAddForm(false);
      toast.success('兴趣添加成功');
    } catch (error: any) {
      console.error('添加兴趣失败:', error);
      toast.error(error.response?.data?.message || '添加兴趣失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 快速添加预设兴趣
   */
  const handleQuickAdd = async (category: string, name: string) => {
    // 检查是否已存在
    if (interests.some((i) => i.category === category && i.name === name)) {
      toast.error('该兴趣已存在');
      return;
    }

    try {
      const created = await PreferencesService.addInterest({
        category,
        name,
        weight: 1.0,
      });
      addInterest(created);
      toast.success(`已添加 "${name}"`);
    } catch (error: any) {
      console.error('添加兴趣失败:', error);
      toast.error('添加兴趣失败');
    }
  };

  /**
   * 更新兴趣权重（防抖处理）
   */
  const handleUpdateWeight = useCallback(async (id: string, weight: number) => {
    try {
      const updated = await PreferencesService.updateInterest(id, { weight });
      updateInterest(id, updated);
      toast.success('权重更新成功');
    } catch (error: any) {
      console.error('更新权重失败:', error);
      toast.error('更新权重失败');
    }
  }, [updateInterest]);

  /**
   * 处理滑块变化（立即更新本地状态，延迟发送API请求）
   */
  const handleSliderChange = (id: string, weight: number) => {
    // 立即更新本地显示
    setLocalWeights(prev => ({
      ...prev,
      [id]: weight,
    }));

    // 清除之前的定时器
    if (timeoutRef.current[id]) {
      clearTimeout(timeoutRef.current[id]);
    }

    // 设置新的定时器，800ms后发送API请求
    timeoutRef.current[id] = setTimeout(() => {
      handleUpdateWeight(id, weight);
    }, 800);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      Object.values(timeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  /**
   * 删除兴趣
   */
  const handleDeleteInterest = async (id: string) => {
    if (!confirm('确定要删除这个兴趣吗？')) return;

    try {
      await PreferencesService.deleteInterest(id);
      removeInterest(id);
      toast.success('兴趣已删除');
    } catch (error: any) {
      console.error('删除兴趣失败:', error);
      toast.error('删除兴趣失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📌 选择您感兴趣的技术领域和话题，系统将为您推荐更多相关内容。权重越高，推荐优先级越高。
        </p>
      </div>

      {/* 当前兴趣列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">我的兴趣领域</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>添加自定义兴趣</span>
          </button>
        </div>

        {/* 添加表单 */}
        {showAddForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类别
                </label>
                <select
                  value={newInterest.category}
                  onChange={(e) =>
                    setNewInterest({ ...newInterest, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="technology_field">技术领域</option>
                  <option value="topic">话题</option>
                  <option value="keyword">关键词</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名称
                </label>
                <input
                  type="text"
                  value={newInterest.name}
                  onChange={(e) =>
                    setNewInterest({ ...newInterest, name: e.target.value })
                  }
                  placeholder="例如: Deep Learning"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  权重
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={newInterest.weight}
                  onChange={(e) =>
                    setNewInterest({
                      ...newInterest,
                      weight: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <button
                onClick={handleAddInterest}
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

        {/* 兴趣列表 */}
        {interests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            还没有添加任何兴趣，点击下方快速添加或使用上方按钮自定义添加
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interests.map((interest) => (
              <div
                key={interest.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{interest.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">
                      {interest.category.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteInterest(interest.id)}
                    className="text-red-600 hover:text-red-700 focus:outline-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">权重:</span>
                    <span className="font-medium text-gray-900">
                      {(localWeights[interest.id] ?? interest.weight).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={localWeights[interest.id] ?? interest.weight}
                    onChange={(e) =>
                      handleSliderChange(interest.id, parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.5x</span>
                    <span>2.0x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 快速添加 - 技术领域 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          热门技术领域
        </h3>
        <div className="flex flex-wrap gap-2">
          {presetInterests.technology_field.map((name) => (
            <button
              key={name}
              onClick={() => handleQuickAdd('technology_field', name)}
              disabled={interests.some(
                (i) => i.category === 'technology_field' && i.name === name
              )}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 快速添加 - 话题 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门话题</h3>
        <div className="flex flex-wrap gap-2">
          {presetInterests.topic.map((name) => (
            <button
              key={name}
              onClick={() => handleQuickAdd('topic', name)}
              disabled={interests.some((i) => i.category === 'topic' && i.name === name)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-green-50 hover:border-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

