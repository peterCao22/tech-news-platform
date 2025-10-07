// 科技新闻聚合平台 - API配置管理服务
// 处理API配置的CRUD操作和连接测试
import { ApiService } from '../lib/api';
class ApiConfigService {
    baseUrl = '/api/api-configs';
    /**
     * 获取API配置列表
     */
    async getApiConfigs() {
        const response = await ApiService.get(this.baseUrl);
        return response.data?.configs || [];
    }
    /**
     * 获取单个API配置
     */
    async getApiConfig(id) {
        const response = await ApiService.get(`${this.baseUrl}/${id}`);
        return response.data;
    }
    /**
     * 创建API配置
     */
    async createApiConfig(data) {
        const response = await ApiService.post(this.baseUrl, data);
        return response.data;
    }
    /**
     * 更新API配置
     */
    async updateApiConfig(id, data) {
        const response = await ApiService.put(`${this.baseUrl}/${id}`, data);
        return response.data;
    }
    /**
     * 删除API配置
     */
    async deleteApiConfig(id) {
        await ApiService.delete(`${this.baseUrl}/${id}`);
    }
    /**
     * 测试API配置连接
     */
    async testApiConfig(id) {
        const response = await ApiService.post(`${this.baseUrl}/${id}/test`, {});
        return response.data;
    }
    /**
     * 获取API配置统计信息
     */
    async getApiConfigStats() {
        const response = await ApiService.get(`${this.baseUrl}/stats`);
        return response.data;
    }
}
export const apiConfigService = new ApiConfigService();
