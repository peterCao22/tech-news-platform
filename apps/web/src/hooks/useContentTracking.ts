/**
 * Story 4.4: Content Tracking Hook
 * 内容追踪React Hook
 * 
 * 自动追踪：
 * - 页面浏览（VIEW）
 * - 停留时长（READ）
 * - 滚动深度
 */

import { useEffect, useRef, useState } from 'react';
import { behaviorTracker } from '@/lib/behaviorTracker';

export interface ContentTrackingOptions {
  contentId: string;
  enabled?: boolean;
  trackView?: boolean;      // 是否追踪VIEW事件
  trackRead?: boolean;      // 是否追踪READ事件
  minReadTime?: number;     // 最小阅读时间（秒），低于此值不记录READ
  metadata?: Record<string, any>;
}

export function useContentTracking(options: ContentTrackingOptions) {
  const {
    contentId,
    enabled = true,
    trackView = true,
    trackRead = true,
    minReadTime = 5, // 默认5秒
    metadata,
  } = options;

  const startTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const hasTrackedViewRef = useRef<boolean>(false);
  const [readingTime, setReadingTime] = useState<number>(0);

  // 追踪VIEW事件
  useEffect(() => {
    if (!enabled || !trackView || !contentId || hasTrackedViewRef.current) {
      return;
    }

    behaviorTracker.trackView(contentId, metadata);
    hasTrackedViewRef.current = true;
  }, [contentId, enabled, trackView, metadata]);

  // 追踪阅读时长和滚动深度
  useEffect(() => {
    if (!enabled || !trackRead || !contentId) {
      return;
    }

    startTimeRef.current = Date.now();
    maxScrollDepthRef.current = 0;

    // 更新阅读时长（每秒）
    const readingInterval = setInterval(() => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setReadingTime(duration);
    }, 1000);

    // 追踪滚动深度
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollDepth = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

      if (scrollDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = scrollDepth;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 组件卸载时追踪READ事件
    return () => {
      clearInterval(readingInterval);
      window.removeEventListener('scroll', handleScroll);

      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // 只有停留时间超过最小值才记录
      if (duration >= minReadTime) {
        behaviorTracker.trackRead(
          contentId,
          duration,
          maxScrollDepthRef.current,
          metadata
        );
      }
    };
  }, [contentId, enabled, trackRead, minReadTime, metadata]);

  return {
    readingTime,
    scrollDepth: maxScrollDepthRef.current,
  };
}

