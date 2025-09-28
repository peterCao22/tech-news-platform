import { ApiService } from '@/lib/api';

// 内容类型定义
export interface Content {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  imageUrl?: string;
  category?: string;
  tags: string[];
  status: 'RAW' | 'PROCESSING' | 'PROCESSED' | 'REVIEWED' | 'PUBLISHED' | 'REJECTED';
  score?: number;
  priority: number;
  sourceId: string;
  sourceUrl?: string;
  publishedAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  source: {
    id: string;
    name: string;
    type: string;
  };
}

export interface ContentFilter {
  status?: string;
  sourceId?: string;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ContentStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Array<{
    sourceId: string;
    sourceName: string;
    count: number;
  }>;
  recentCount: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 内容API服务
export const contentApi = {
  // 获取内容列表
  async getContents(filters: ContentFilter = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    const url = `/api/content${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return await ApiService.get<Content[]>(url);
  },

  // 根据ID获取内容
  async getContent(id: string) {
    return await ApiService.get<Content>(`/api/content/${id}`);
  },

  // 获取最近内容
  async getRecentContent(sourceId?: string, hours: number = 24) {
    const searchParams = new URLSearchParams();
    if (sourceId) searchParams.append('sourceId', sourceId);
    searchParams.append('hours', hours.toString());
    
    const url = `/api/content/recent${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return await ApiService.get<Content[]>(url);
  },

  // 搜索内容
  async searchContent(query: string, page: number = 1, limit: number = 10) {
    const searchParams = new URLSearchParams({
      query,
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return await ApiService.get<{
      data: Content[];
      pagination: PaginationInfo;
    }>(`/api/content/search?${searchParams.toString()}`);
  },

  // 更新内容状态
  async updateContentStatus(id: string, status: string) {
    return await ApiService.patch<Content>(`/api/content/${id}/status`, { status });
  },

  // 批量更新内容状态
  async batchUpdateContentStatus(ids: string[], status: string) {
    return await ApiService.patch<{ data: Content[]; message: string }>('/api/content/batch-status', {
      ids,
      status,
    });
  },

  // 更新内容
  async updateContent(id: string, data: Partial<Content>) {
    return await ApiService.put<Content>(`/api/content/${id}`, data);
  },

  // 删除内容
  async deleteContent(id: string) {
    return await ApiService.delete<{ message: string }>(`/api/content/${id}`);
  },

  // 获取内容统计
  async getContentStats() {
    return await ApiService.get<ContentStats>('/api/content/stats');
  },
};
