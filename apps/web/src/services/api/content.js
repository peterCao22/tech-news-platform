import { ApiService } from '@/lib/api';
// 内容API服务
export const contentApi = {
    // 获取内容列表
    async getContents(filters = {}) {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });
        const url = `/api/content${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return await ApiService.get(url);
    },
    // 根据ID获取内容
    async getContent(id) {
        return await ApiService.get(`/api/content/${id}`);
    },
    // 获取最近内容
    async getRecentContent(sourceId, hours = 24) {
        const searchParams = new URLSearchParams();
        if (sourceId)
            searchParams.append('sourceId', sourceId);
        searchParams.append('hours', hours.toString());
        const url = `/api/content/recent${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return await ApiService.get(url);
    },
    // 搜索内容
    async searchContent(query, page = 1, limit = 10) {
        const searchParams = new URLSearchParams({
            query,
            page: page.toString(),
            limit: limit.toString(),
        });
        return await ApiService.get(`/api/content/search?${searchParams.toString()}`);
    },
    // 更新内容状态
    async updateContentStatus(id, status) {
        return await ApiService.patch(`/api/content/${id}/status`, { status });
    },
    // 批量更新内容状态
    async batchUpdateContentStatus(ids, status) {
        return await ApiService.patch('/api/content/batch-status', {
            ids,
            status,
        });
    },
    // 更新内容
    async updateContent(id, data) {
        return await ApiService.put(`/api/content/${id}`, data);
    },
    // 删除内容
    async deleteContent(id) {
        return await ApiService.delete(`/api/content/${id}`);
    },
    // 获取内容统计
    async getContentStats() {
        return await ApiService.get('/api/content/stats');
    },
    // 增加浏览次数
    async incrementViewCount(id) {
        return await ApiService.post(`/api/content/${id}/view`, {});
    },
    // 增加分享次数
    async incrementShareCount(id) {
        return await ApiService.post(`/api/content/${id}/share`, {});
    },
    // 获取热门内容
    async getTrendingContent(limit = 10) {
        return await ApiService.get(`/api/content/trending?limit=${limit}`);
    },
    // 获取相关内容
    async getRelatedContent(id, limit = 4) {
        return await ApiService.get(`/api/content/${id}/related?limit=${limit}`);
    },
};
