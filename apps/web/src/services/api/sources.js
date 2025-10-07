import { ApiService } from '@/lib/api';
// RSS源API服务
export const sourcesApi = {
    // 获取所有RSS源
    async getSources(params) {
        const searchParams = new URLSearchParams();
        if (params?.type)
            searchParams.append('type', params.type);
        if (params?.status)
            searchParams.append('status', params.status);
        const url = `/api/sources${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        const response = await ApiService.get(url);
        return response;
    },
    // 根据ID获取RSS源
    async getSource(id) {
        return await ApiService.get(`/api/sources/${id}`);
    },
    // 创建RSS源
    async createSource(data) {
        return await ApiService.post('/api/sources', data);
    },
    // 更新RSS源
    async updateSource(id, data) {
        return await ApiService.put(`/api/sources/${id}`, data);
    },
    // 删除RSS源
    async deleteSource(id) {
        return await ApiService.delete(`/api/sources/${id}`);
    },
    // 验证RSS URL
    async validateRSSUrl(url) {
        return await ApiService.post('/api/sources/validate-url', { url });
    },
    // 手动触发RSS抓取
    async fetchSource(id) {
        return await ApiService.post(`/api/sources/${id}/fetch`);
    },
    // 批量抓取所有活跃RSS源
    async fetchAllSources() {
        return await ApiService.post('/api/sources/fetch-all');
    },
    // 获取RSS源统计信息
    async getSourceStats() {
        const response = await ApiService.get('/api/sources/stats');
        return response;
    },
    // 获取源的内容列表
    async getSourceContent(id, params) {
        const searchParams = new URLSearchParams();
        if (params?.page)
            searchParams.append('page', params.page.toString());
        if (params?.limit)
            searchParams.append('limit', params.limit.toString());
        if (params?.status)
            searchParams.append('status', params.status);
        const url = `/api/sources/${id}/content${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return await ApiService.get(url);
    },
};
