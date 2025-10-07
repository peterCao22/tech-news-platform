'use client';

// 科技新闻聚合平台 - API配置管理页面
// 管理外部API集成配置

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@tech-news-platform/ui';
import { Button } from '@tech-news-platform/ui';
import { Input } from '@tech-news-platform/ui';
import { Select } from '@tech-news-platform/ui';
import { 
  Plus, 
  Settings, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiConfigService, ApiConfiguration, ApiConfigStats } from '../../services/api-config.service';

const ApiConfigsPage: React.FC = () => {
  const router = useRouter();
  const [configs, setConfigs] = useState<ApiConfiguration[]>([]);
  const [stats, setStats] = useState<ApiConfigStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configsData, statsData] = await Promise.all([
        apiConfigService.getApiConfigs(),
        apiConfigService.getApiConfigStats()
      ]);
      
      // 确保configsData是数组
      setConfigs(Array.isArray(configsData) ? configsData : []);
      setStats(statsData);
    } catch (error) {
      console.error('加载API配置失败:', error);
      toast.error('加载API配置失败');
      // 设置空数组作为默认值
      setConfigs([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // 测试API配置
  const handleTestConfig = async (id: string) => {
    try {
      const result = await apiConfigService.testApiConfig(id);
      if (result.success) {
        toast.success(`连接测试成功 (${result.responseTime}ms)`);
      } else {
        toast.error(`连接测试失败: ${result.message}`);
      }
    } catch (error) {
      console.error('测试API配置失败:', error);
      toast.error('测试API配置失败');
    }
  };

  // 删除API配置
  const handleDeleteConfig = async (id: string, name: string) => {
    if (!confirm(`确定要删除API配置 "${name}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await apiConfigService.deleteApiConfig(id);
      toast.success('API配置删除成功');
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('删除API配置失败:', error);
      toast.error('删除API配置失败');
    }
  };

  // 切换配置状态
  const handleToggleStatus = async (config: ApiConfiguration) => {
    try {
      const newStatus = config.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await apiConfigService.updateApiConfig(config.id, { status: newStatus });
      toast.success(`配置已${newStatus === 'ACTIVE' ? '启用' : '禁用'}`);
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('更新配置状态失败:', error);
      toast.error('更新配置状态失败');
    }
  };

  // 获取状态图标和颜色
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'INACTIVE':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'RATE_LIMITED':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // 过滤配置
  const filteredConfigs = Array.isArray(configs) ? configs.filter(config => {
    const matchesSearch = config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || config.status === statusFilter;
    const matchesProvider = providerFilter === 'all' || config.provider === providerFilter;
    
    return matchesSearch && matchesStatus && matchesProvider;
  }) : [];

  // 获取唯一的提供商列表
  const uniqueProviders = Array.isArray(configs) ? 
    Array.from(new Set(configs.map(config => config.provider))) : [];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API配置管理</h1>
          <p className="text-gray-600 mt-2">管理外部API集成配置和密钥</p>
        </div>
        <Button
          onClick={() => router.push('/api-configs/create')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建配置
        </Button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总配置数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.总配置数}</p>
              </div>
              <Settings className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃配置</p>
                <p className="text-2xl font-bold text-green-600">{stats.活跃配置}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总调用次数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.总调用次数}</p>
              </div>
              <TestTube className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">成功率</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.总调用次数 > 0 
                    ? Math.round((stats.成功调用 / stats.总调用次数) * 100) 
                    : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>
      )}

      {/* 搜索和过滤 */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="搜索配置名称或提供商..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <option value="all">所有状态</option>
              <option value="ACTIVE">活跃</option>
              <option value="INACTIVE">禁用</option>
              <option value="ERROR">错误</option>
              <option value="RATE_LIMITED">限流</option>
            </Select>
            <Select
              value={providerFilter}
              onValueChange={setProviderFilter}
            >
              <option value="all">所有提供商</option>
              {uniqueProviders.map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* 配置列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredConfigs.map((config) => (
          <Card key={config.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                <p className="text-sm text-gray-600">{config.provider}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(config.status)}
                <span className="text-sm font-medium">{config.status}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">认证方式:</span>
                <span className="font-medium">{config.authType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">总调用:</span>
                <span className="font-medium">{config.totalCalls}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">成功率:</span>
                <span className="font-medium text-green-600">
                  {config.totalCalls > 0 
                    ? Math.round((config.successfulCalls / config.totalCalls) * 100) 
                    : 0}%
                </span>
              </div>
              {config.lastCallAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">最后调用:</span>
                  <span className="font-medium">
                    {new Date(config.lastCallAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {config.lastError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  <strong>最后错误:</strong> {config.lastError}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConfig(config.id)}
                  className="flex items-center gap-1"
                >
                  <TestTube className="w-3 h-3" />
                  测试
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/api-configs/${config.id}/edit`)}
                  className="flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  编辑
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(config)}
                  className={`${
                    config.status === 'ACTIVE' 
                      ? 'text-red-600 hover:text-red-700' 
                      : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  {config.status === 'ACTIVE' ? '禁用' : '启用'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteConfig(config.id, config.name)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredConfigs.length === 0 && (
        <Card className="p-12 text-center">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无API配置</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || providerFilter !== 'all'
              ? '没有找到匹配的配置，请尝试调整搜索条件'
              : '开始创建您的第一个API配置来集成外部服务'
            }
          </p>
          {(!searchTerm && statusFilter === 'all' && providerFilter === 'all') && (
            <Button
              onClick={() => router.push('/api-configs/create')}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              创建API配置
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default ApiConfigsPage;
