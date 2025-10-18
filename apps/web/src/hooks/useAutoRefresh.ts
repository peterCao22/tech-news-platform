/**
 * Auto Refresh Hook
 * Story 3.1: 内容审核工作台
 * 
 * 提供自动刷新功能的自定义Hook
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoRefreshOptions {
  onRefresh: () => Promise<void>;
  interval?: number; // 刷新间隔（毫秒）
  enabled?: boolean; // 是否启用自动刷新
  pauseOnError?: boolean; // 错误时是否暂停
}

interface UseAutoRefreshReturn {
  isRefreshing: boolean;
  lastRefreshTime: Date | null;
  nextRefreshIn: number; // 距离下次刷新的秒数
  error: Error | null;
  pause: () => void;
  resume: () => void;
  refresh: () => Promise<void>;
  isPaused: boolean;
}

export const useAutoRefresh = ({
  onRefresh,
  interval = 30000, // 默认30秒
  enabled = true,
  pauseOnError = true,
}: UseAutoRefreshOptions): UseAutoRefreshReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(Math.floor(interval / 1000));
  const [error, setError] = useState<Error | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // 清理定时器
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // 执行刷新
  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    try {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      setError(null);

      await onRefresh();

      setLastRefreshTime(new Date());
      setNextRefreshIn(Math.floor(interval / 1000));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('刷新失败');
      setError(error);

      if (pauseOnError) {
        setIsPaused(true);
      }
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [onRefresh, interval, pauseOnError]);

  // 暂停自动刷新
  const pause = useCallback(() => {
    setIsPaused(true);
    clearTimers();
  }, [clearTimers]);

  // 恢复自动刷新
  const resume = useCallback(() => {
    setIsPaused(false);
    setError(null);
    setNextRefreshIn(Math.floor(interval / 1000));
  }, [interval]);

  // 倒计时更新
  useEffect(() => {
    if (!enabled || isPaused || isRefreshing) return;

    countdownRef.current = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          return Math.floor(interval / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [enabled, isPaused, isRefreshing, interval]);

  // 自动刷新定时器
  useEffect(() => {
    if (!enabled || isPaused) {
      clearTimers();
      return;
    }

    const scheduleRefresh = () => {
      timerRef.current = setTimeout(() => {
        refresh().then(() => {
          scheduleRefresh();
        });
      }, interval);
    };

    scheduleRefresh();

    return () => {
      clearTimers();
    };
  }, [enabled, isPaused, interval, refresh, clearTimers]);

  return {
    isRefreshing,
    lastRefreshTime,
    nextRefreshIn,
    error,
    pause,
    resume,
    refresh,
    isPaused,
  };
};

