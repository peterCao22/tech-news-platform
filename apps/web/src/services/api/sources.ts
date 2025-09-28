import { ApiService } from '@/lib/api';

// RSS源类型定义
export interface Source {
  id: string;
  name: string;
  type: 'RSS' | 'API' | 'AI_QUERY' | 'EMAIL' | 'MANUAL';
  url?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'RATE_LIMITED';
  config?: any;
  lastFetchAt?: string;
  fetchCount: number;
  errorCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSourceData {
  name: string;
  type: 'RSS' | 'API' | 'AI_QUERY' | 'EMAIL' | 'MANUAL';
  url?: string;
  config?: any;
}

export interface UpdateSourceData {
  name?: string;
  url?: string;
  config?: any;
  status?: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'RATE_LIMITED';
}

export interface SourceStats {
  total: number;
  active: number;
  error: number;
  byType: Record<string, number>;
}

export interface ValidationResult {
  valid: boolean;
  title?: string;
  description?: string;
  itemCount?: number;
  error?: string;
}

// RSS源API服务
export const sourcesApi = {
  // 获取所有RSS源
  async getSources(params?: { type?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.status) searchParams.append('status', params.status);
    
    const url = `/api/sources${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await ApiService.get<Source[]>(url);
    return response;
  },

  // 根据ID获取RSS源
  async getSource(id: string) {
    return await ApiService.get<Source>(`/api/sources/${id}`);
  },

  // 创建RSS源
  async createSource(data: CreateSourceData) {
    return await ApiService.post<Source>('/api/sources', data);
  },

  // 更新RSS源
  async updateSource(id: string, data: UpdateSourceData) {
    return await ApiService.put<Source>(`/api/sources/${id}`, data);
  },

  // 删除RSS源
  async deleteSource(id: string) {
    return await ApiService.delete<{ message: string }>(`/api/sources/${id}`);
  },

  // 验证RSS URL
  async validateRSSUrl(url: string) {
    return await ApiService.post<ValidationResult>('/api/sources/validate-url', { url });
  },

  // 手动触发RSS抓取
  async fetchSource(id: string) {
    return await ApiService.post<{ 
      sourceId: string; 
      sourceName: string; 
      success: boolean; 
      newItemsCount: number; 
      error?: string; 
    }>(`/api/sources/${id}/fetch`);
  },

  // 批量抓取所有活跃RSS源
  async fetchAllSources() {
    return await ApiService.post<{ 
      totalSources: number; 
      successCount: number; 
      totalNewItems: number; 
      errors: Array<{ sourceId: string; error: string }>; 
    }>('/api/sources/fetch-all');
  },

  // 获取RSS源统计信息
  async getSourceStats() {
    const response = await ApiService.get<{ 
      sources: SourceStats; 
      content: any; 
    }>('/api/sources/stats');
    return response;
  },

  // 获取源的内容列表
  async getSourceContent(id: string, params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    
    const url = `/api/sources/${id}/content${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return await ApiService.get<{ 
      data: any[]; 
      pagination: { 
        page: number; 
        limit: number; 
        total: number; 
        totalPages: number; 
      } 
    }>(url);
  },
};
