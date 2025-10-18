/**
 * Story 4.4: Scroll Tracking Hook
 * 滚动深度追踪React Hook
 * 
 * 功能：
 * - 实时追踪滚动深度
 * - 返回滚动百分比
 * - 提供滚动里程碑（25%, 50%, 75%, 100%）
 */

import { useEffect, useState, useRef } from 'react';

export interface ScrollMilestone {
  depth: number;    // 滚动深度百分比（0-1）
  reached: boolean; // 是否已达到
  timestamp?: number; // 达到时的时间戳
}

export interface UseScrollTrackingOptions {
  enabled?: boolean;
  throttle?: number; // 节流时间（毫秒）
  onMilestone?: (milestone: number) => void; // 达到里程碑时的回调
}

export function useScrollTracking(options: UseScrollTrackingOptions = {}) {
  const {
    enabled = true,
    throttle = 100,
    onMilestone,
  } = options;

  const [scrollDepth, setScrollDepth] = useState<number>(0);
  const [milestones, setMilestones] = useState<Record<number, ScrollMilestone>>({
    0.25: { depth: 0.25, reached: false },
    0.5: { depth: 0.5, reached: false },
    0.75: { depth: 0.75, reached: false },
    1.0: { depth: 1.0, reached: false },
  });

  const lastScrollTimeRef = useRef<number>(0);
  const maxScrollDepthRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const now = Date.now();
      
      // 节流
      if (now - lastScrollTimeRef.current < throttle) {
        return;
      }
      
      lastScrollTimeRef.current = now;

      // 计算滚动深度
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const depth = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;

      setScrollDepth(depth);

      // 更新最大滚动深度
      if (depth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = depth;

        // 检查里程碑
        setMilestones((prev) => {
          const updated = { ...prev };
          let hasUpdate = false;

          for (const [key, milestone] of Object.entries(updated)) {
            const milestoneDepth = parseFloat(key);
            
            if (!milestone.reached && depth >= milestoneDepth) {
              updated[milestoneDepth] = {
                ...milestone,
                reached: true,
                timestamp: now,
              };
              
              hasUpdate = true;

              // 触发回调
              if (onMilestone) {
                onMilestone(milestoneDepth);
              }
            }
          }

          return hasUpdate ? updated : prev;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 初始化时也执行一次
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, throttle, onMilestone]);

  return {
    scrollDepth,           // 当前滚动深度（0-1）
    scrollPercentage: Math.round(scrollDepth * 100), // 百分比（0-100）
    maxScrollDepth: maxScrollDepthRef.current,       // 最大滚动深度
    milestones,            // 里程碑状态
    hasReachedBottom: milestones[1.0].reached,       // 是否已滚动到底部
  };
}

