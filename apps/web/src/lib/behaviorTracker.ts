/**
 * Story 4.4: Behavior Tracking SDK
 * 前端行为追踪工具类
 * 
 * 功能：
 * - 批量追踪用户行为
 * - 自动flush机制
 * - 本地队列管理
 * - 防抖与节流
 */

import axios from 'axios';

// ============================================
// 类型定义
// ============================================

export type BehaviorEventType = 
  | 'VIEW'        // 浏览内容
  | 'CLICK'       // 点击内容
  | 'READ'        // 阅读内容（带停留时长）
  | 'SHARE'       // 分享内容
  | 'BOOKMARK'    // 收藏内容
  | 'LIKE'        // 点赞内容
  | 'SEARCH'      // 搜索
  | 'COMMENT';    // 评论

export interface BehaviorEvent {
  contentId: string;
  eventType: BehaviorEventType;
  duration?: number;      // 停留时长（秒）
  scrollDepth?: number;   // 滚动深度（0-1）
  deviceType?: string;    // 设备类型
  source?: string;        // 来源
  metadata?: Record<string, any>; // 其他元数据
  timestamp: string;      // ISO格式时间戳
  sessionId?: string;     // 会话ID
}

export interface TrackerConfig {
  apiBaseUrl?: string;
  batchSize?: number;       // 批量大小
  flushInterval?: number;   // flush间隔（毫秒）
  enabled?: boolean;        // 是否启用追踪
  debug?: boolean;          // 是否开启调试
}

// ============================================
// BehaviorTracker - 行为追踪器
// ============================================

class BehaviorTracker {
  private queue: BehaviorEvent[] = [];
  private config: Required<TrackerConfig>;
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private authToken: string | null = null;

  constructor(config: TrackerConfig = {}) {
    // 默认配置
    this.config = {
      apiBaseUrl: this.getApiBaseUrl(),
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000, // 5秒
      enabled: config.enabled !== false, // 默认启用
      debug: config.debug || false,
    };

    // 生成会话ID
    this.sessionId = this.generateSessionId();

    // 自动获取认证token
    this.loadAuthToken();

    // 页面卸载时自动flush
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true); // 同步flush
      });

      // 页面可见性变化时flush
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flush();
        }
      });
    }

    // 启动定时flush
    this.startFlushTimer();

    this.log('BehaviorTracker initialized', this.config);
  }

  /**
   * 获取API基础URL
   */
  private getApiBaseUrl(): string {
    if (typeof window === 'undefined') return 'http://localhost:3001/api';
    
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    return `http://${hostname}:3001/api`;
  }

  /**
   * 加载认证token
   */
  private loadAuthToken(): void {
    if (typeof window === 'undefined') return;

    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        this.authToken = parsed.state?.token || null;
      }
    } catch (error) {
      this.log('Failed to load auth token', error);
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动定时flush
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * 追踪行为事件
   */
  track(event: Omit<BehaviorEvent, 'timestamp' | 'sessionId'>): void {
    if (!this.config.enabled) {
      this.log('Tracking disabled, skipping event', event);
      return;
    }

    // 补充时间戳和会话ID
    const fullEvent: BehaviorEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      deviceType: event.deviceType || this.getDeviceType(),
    };

    this.queue.push(fullEvent);
    this.log('Event tracked', fullEvent);

    // 如果达到批量大小，立即flush
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * 追踪内容浏览
   */
  trackView(contentId: string, metadata?: Record<string, any>): void {
    this.track({
      contentId,
      eventType: 'VIEW',
      source: window.location.pathname,
      metadata,
    });
  }

  /**
   * 追踪内容点击
   */
  trackClick(contentId: string, metadata?: Record<string, any>): void {
    this.track({
      contentId,
      eventType: 'CLICK',
      source: window.location.pathname,
      metadata,
    });
  }

  /**
   * 追踪内容阅读（带停留时长和滚动深度）
   */
  trackRead(
    contentId: string,
    duration: number,
    scrollDepth: number,
    metadata?: Record<string, any>
  ): void {
    this.track({
      contentId,
      eventType: 'READ',
      duration,
      scrollDepth,
      source: window.location.pathname,
      metadata,
    });
  }

  /**
   * 追踪分享
   */
  trackShare(contentId: string, metadata?: Record<string, any>): void {
    this.track({
      contentId,
      eventType: 'SHARE',
      source: window.location.pathname,
      metadata,
    });
  }

  /**
   * 追踪收藏
   */
  trackBookmark(contentId: string, metadata?: Record<string, any>): void {
    this.track({
      contentId,
      eventType: 'BOOKMARK',
      source: window.location.pathname,
      metadata,
    });
  }

  /**
   * 追踪点赞
   */
  trackLike(contentId: string, metadata?: Record<string, any>): void {
    this.track({
      contentId,
      eventType: 'LIKE',
      source: window.location.pathname,
      metadata,
    });
  }

  /**
   * 追踪搜索
   */
  trackSearch(query: string, metadata?: Record<string, any>): void {
    // 搜索事件没有contentId，使用特殊处理
    this.track({
      contentId: 'search',
      eventType: 'SEARCH',
      source: window.location.pathname,
      metadata: { query, ...metadata },
    });
  }

  /**
   * Flush队列（提交到后端）
   */
  async flush(sync: boolean = false): Promise<void> {
    if (this.queue.length === 0) return;

    // 重新加载token（可能已更新）
    this.loadAuthToken();

    if (!this.authToken) {
      this.log('No auth token, skipping flush');
      return;
    }

    const eventsToSend = [...this.queue];
    this.queue = []; // 清空队列

    this.log(`Flushing ${eventsToSend.length} events`, eventsToSend);

    try {
      const url = `${this.config.apiBaseUrl}/behavior/track`;
      
      if (sync && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        // 使用sendBeacon进行同步发送（页面卸载时）
        const blob = new Blob(
          [JSON.stringify({ behaviors: eventsToSend })],
          { type: 'application/json' }
        );
        navigator.sendBeacon(url, blob);
        this.log('Events sent via sendBeacon');
      } else {
        // 使用axios异步发送
        await axios.post(
          url,
          { behaviors: eventsToSend },
          {
            headers: {
              Authorization: `Bearer ${this.authToken}`,
            },
          }
        );
        this.log('Events flushed successfully');
      }
    } catch (error: any) {
      this.log('Failed to flush events', error);
      
      // 如果是401错误，清除token
      if (error.response?.status === 401) {
        this.authToken = null;
      }
      
      // 失败的事件重新加入队列（最多保留100个）
      this.queue = [...eventsToSend.slice(-50), ...this.queue].slice(0, 100);
    }
  }

  /**
   * 获取设备类型
   */
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';

    const ua = navigator.userAgent;
    
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  /**
   * 启用追踪
   */
  enable(): void {
    this.config.enabled = true;
    this.log('Tracking enabled');
  }

  /**
   * 禁用追踪
   */
  disable(): void {
    this.config.enabled = false;
    this.flush(); // 禁用前先flush
    this.log('Tracking disabled');
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 获取队列长度
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.queue = [];
    this.log('Queue cleared');
  }

  /**
   * 调试日志
   */
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[BehaviorTracker] ${message}`, data || '');
    }
  }

  /**
   * 销毁追踪器
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    this.flush(); // 销毁前flush
    this.log('BehaviorTracker destroyed');
  }
}

// 导出单例实例
export const behaviorTracker = new BehaviorTracker({
  debug: process.env.NODE_ENV === 'development',
});

// 导出类（用于测试或自定义实例）
export { BehaviorTracker };

