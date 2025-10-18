/**
 * Story 4.1: Source Weights Tab Component
 * 信息源权重Tab组件
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import PreferencesService from '@/services/preferencesService';
import { Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SourceWeightsTab() {
  const { sourceWeights, setSourceWeights } = usePreferencesStore();
  const [loading, setLoading] = useState(false);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // 初始化本地权重状态
  useEffect(() => {
    const weights: Record<string, number> = {};
    sourceWeights.forEach(sw => {
      weights[sw.sourceId] = sw.weight;
    });
    setLocalWeights(weights);
  }, [sourceWeights]);

  /**
   * 更新信息源权重（防抖处理）
   */
  const handleUpdateWeight = useCallback(async (
    sourceId: string,
    weight: number,
    sourceName: string
  ) => {
    try {
      await PreferencesService.setSourceWeight(sourceId, {
        weight,
        reason: `用户调整 - ${sourceName}`,
      });
      
      // 重新加载权重列表
      const updated = await PreferencesService.getSourceWeights();
      setSourceWeights(updated);
      
      toast.success('权重更新成功');
    } catch (error: any) {
      console.error('更新权重失败:', error);
      toast.error('更新权重失败');
    }
  }, [setSourceWeights]);

  /**
   * 处理滑块变化（立即更新本地状态，延迟发送API请求）
   */
  const handleSliderChange = (
    sourceId: string,
    weight: number,
    sourceName: string
  ) => {
    // 立即更新本地显示
    setLocalWeights(prev => ({
      ...prev,
      [sourceId]: weight,
    }));

    // 清除之前的定时器
    if (timeoutRef.current[sourceId]) {
      clearTimeout(timeoutRef.current[sourceId]);
    }

    // 设置新的定时器，800ms后发送API请求
    timeoutRef.current[sourceId] = setTimeout(() => {
      handleUpdateWeight(sourceId, weight, sourceName);
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

  return (
    <div className="space-y-6">
      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📰 调整不同信息源的权重，影响内容在您的个性化推荐中的排序。
        </p>
      </div>

      {/* 信息源列表 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">信息源权重配置</h3>
        
        {sourceWeights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            还没有配置任何信息源权重
          </div>
        ) : (
          <div className="space-y-4">
            {sourceWeights.map((sw) => (
              <div
                key={sw.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Newspaper className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{sw.source.name}</h4>
                      <p className="text-xs text-gray-500">{sw.source.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {(localWeights[sw.sourceId] ?? sw.weight).toFixed(1)}x
                    </span>
                  </div>
                </div>
                
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={localWeights[sw.sourceId] ?? sw.weight}
                  onChange={(e) =>
                    handleSliderChange(
                      sw.sourceId,
                      parseFloat(e.target.value),
                      sw.source.name
                    )
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.1x (降低)</span>
                  <span>1.0x (默认)</span>
                  <span>2.0x (提升)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

