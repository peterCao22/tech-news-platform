'use client';

// 科技新闻聚合平台 - 编辑API配置页面
// 编辑现有的外部API集成配置

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@tech-news-platform/ui';
import { Button } from '@tech-news-platform/ui';
import { Input } from '@tech-news-platform/ui';
import { Select } from '@tech-news-platform/ui';
import { 
  ArrowLeft, 
  Save, 
  TestTube, 
  Eye, 
  EyeOff,
  Info,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  apiConfigService, 
  ApiConfiguration, 
  UpdateApiConfigData 
} from '../../../../services/api-config.service';

const EditApiConfigPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const configId = params.id as string;
  
  const [config, setConfig] = useState<ApiConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSensitiveFields, setShowSensitiveFields] = useState(false);
  
  const [formData, setFormData] = useState<UpdateApiConfigData>({});
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([]);

  // 加载配置数据
  useEffect(() => {
    if (configId) {
      loadConfig();
    }
  }, [configId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configData = await apiConfigService.getApiConfig(configId);
      setConfig(configData);
      
      // 初始化表单数据
      setFormData({
        name: configData.name,
        provider: configData.provider,
        baseUrl: configData.baseUrl,
        authType: configData.authType,
        status: configData.status,
        headerName: configData.headerName,
        rateLimit: configData.rateLimit,
        timeout: configData.timeout,
        retryAttempts: configData.retryAttempts,
        retryDelay: configData.retryDelay,
        headers: configData.headers
      });

      // 初始化自定义头部
      if (configData.headers) {
        const headerEntries = Object.entries(configData.headers).map(([key, value]) => ({
          key,
          value
        }));
        setCustomHeaders(headerEntries.length > 0 ? headerEntries : [{ key: '', value: '' }]);
      } else {
        setCustomHeaders([{ key: '', value: '' }]);
      }
    } catch (error) {
      console.error('加载API配置失败:', error);
      toast.error('加载API配置失败');
      router.push('/api-configs');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单字段变化
  const handleFieldChange = (field: keyof UpdateApiConfigData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理自定义头部
  const handleCustomHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...customHeaders];
    newHeaders[index][field] = value;
    setCustomHeaders(newHeaders);

    // 更新表单数据
    const headersObj = newHeaders.reduce((acc, header) => {
      if (header.key && header.value) {
        acc[header.key] = header.value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    handleFieldChange('headers', headersObj);
  };

  // 添加自定义头部
  const addCustomHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  // 删除自定义头部
  const removeCustomHeader = (index: number) => {
    const newHeaders = customHeaders.filter((_, i) => i !== index);
    setCustomHeaders(newHeaders);
    
    // 更新表单数据
    const headersObj = newHeaders.reduce((acc, header) => {
      if (header.key && header.value) {
        acc[header.key] = header.value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    handleFieldChange('headers', headersObj);
  };

  // 测试配置
  const handleTestConfig = async () => {
    try {
      setTesting(true);
      const result = await apiConfigService.testApiConfig(configId);
      if (result.success) {
        toast.success(`连接测试成功 (${result.responseTime}ms)`);
      } else {
        toast.error(`连接测试失败: ${result.message}`);
      }
    } catch (error) {
      console.error('测试API配置失败:', error);
      toast.error('测试API配置失败');
    } finally {
      setTesting(false);
    }
  };

  // 删除配置
  const handleDeleteConfig = async () => {
    if (!config) return;
    
    if (!confirm(`确定要删除API配置 "${config.name}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await apiConfigService.deleteApiConfig(configId);
      toast.success('API配置删除成功');
      router.push('/api-configs');
    } catch (error) {
      console.error('删除API配置失败:', error);
      toast.error('删除API配置失败');
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('请输入配置名称');
      return;
    }
    
    try {
      setSaving(true);
      await apiConfigService.updateApiConfig(configId, formData);
      toast.success('API配置更新成功');
      router.push('/api-configs');
    } catch (error) {
      console.error('更新API配置失败:', error);
      toast.error('更新API配置失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">配置不存在</h1>
          <Button onClick={() => router.push('/api-configs')}>
            返回配置列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">编辑API配置</h1>
          <p className="text-gray-600 mt-2">修改 {config.name} 的配置信息</p>
        </div>
        <Button
          variant="outline"
          onClick={handleDeleteConfig}
          className="flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          删除配置
        </Button>
      </div>

      {/* 配置统计 */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">配置统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{config.totalCalls}</div>
            <div className="text-sm text-gray-600">总调用次数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{config.successfulCalls}</div>
            <div className="text-sm text-gray-600">成功调用</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{config.failedCalls}</div>
            <div className="text-sm text-gray-600">失败调用</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {config.totalCalls > 0 
                ? Math.round((config.successfulCalls / config.totalCalls) * 100) 
                : 0}%
            </div>
            <div className="text-sm text-gray-600">成功率</div>
          </div>
        </div>
        {config.lastCallAt && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              最后调用时间: {new Date(config.lastCallAt).toLocaleString()}
            </p>
          </div>
        )}
        {config.lastError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              <strong>最后错误:</strong> {config.lastError}
            </p>
          </div>
        )}
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本信息 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                配置名称 *
              </label>
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="例如：Alpha Vantage - 股票数据"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <Select
                value={formData.status || config.status}
                onValueChange={(value) => handleFieldChange('status', value)}
              >
                <option value="ACTIVE">活跃</option>
                <option value="INACTIVE">禁用</option>
                <option value="ERROR">错误</option>
                <option value="RATE_LIMITED">限流</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API提供商
              </label>
              <Input
                type="text"
                value={formData.provider || config.provider}
                onChange={(e) => handleFieldChange('provider', e.target.value)}
                placeholder="API提供商"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                认证方式
              </label>
              <Select
                value={formData.authType || config.authType}
                onValueChange={(value) => handleFieldChange('authType', value)}
              >
                <option value="API_KEY">API Key</option>
                <option value="BEARER_TOKEN">Bearer Token</option>
                <option value="BASIC_AUTH">Basic Auth</option>
                <option value="OAUTH">OAuth</option>
                <option value="NONE">无认证</option>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API基础URL
              </label>
              <Input
                type="url"
                value={formData.baseUrl || config.baseUrl}
                onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
          </div>
        </Card>

        {/* 认证配置 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">认证配置</h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSensitiveFields(!showSensitiveFields)}
                className="flex items-center gap-2"
              >
                {showSensitiveFields ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showSensitiveFields ? '隐藏' : '显示'}敏感信息
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* API Key 认证 */}
            {(formData.authType || config.authType) === 'API_KEY' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API密钥
                  </label>
                  <Input
                    type={showSensitiveFields ? "text" : "password"}
                    value={formData.apiKey || ''}
                    onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                    placeholder="输入新的API密钥（留空保持不变）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    头部名称
                  </label>
                  <Input
                    type="text"
                    value={formData.headerName || config.headerName || ''}
                    onChange={(e) => handleFieldChange('headerName', e.target.value)}
                    placeholder="X-API-Key"
                  />
                </div>
              </div>
            )}

            {/* Bearer Token 认证 */}
            {(formData.authType || config.authType) === 'BEARER_TOKEN' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bearer Token
                </label>
                <Input
                  type={showSensitiveFields ? "text" : "password"}
                  value={formData.token || ''}
                  onChange={(e) => handleFieldChange('token', e.target.value)}
                  placeholder="输入新的Bearer Token（留空保持不变）"
                />
              </div>
            )}

            {/* Basic Auth 认证 */}
            {(formData.authType || config.authType) === 'BASIC_AUTH' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名
                  </label>
                  <Input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                    placeholder="输入新的用户名（留空保持不变）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <Input
                    type={showSensitiveFields ? "text" : "password"}
                    value={formData.password || ''}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    placeholder="输入新的密码（留空保持不变）"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 高级配置 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">高级配置</h2>
          
          <div className="space-y-6">
            {/* 速率限制 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">速率限制</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大请求数
                  </label>
                  <Input
                    type="number"
                    value={formData.rateLimit?.maxRequests || config.rateLimit?.maxRequests || 100}
                    onChange={(e) => handleFieldChange('rateLimit', {
                      ...formData.rateLimit,
                      maxRequests: parseInt(e.target.value)
                    })}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    时间窗口 (毫秒)
                  </label>
                  <Input
                    type="number"
                    value={formData.rateLimit?.windowMs || config.rateLimit?.windowMs || 60000}
                    onChange={(e) => handleFieldChange('rateLimit', {
                      ...formData.rateLimit,
                      windowMs: parseInt(e.target.value)
                    })}
                    min="1000"
                  />
                </div>
              </div>
            </div>

            {/* 重试配置 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">重试配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    超时时间 (毫秒)
                  </label>
                  <Input
                    type="number"
                    value={formData.timeout || config.timeout || 30000}
                    onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value))}
                    min="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    重试次数
                  </label>
                  <Input
                    type="number"
                    value={formData.retryAttempts || config.retryAttempts || 3}
                    onChange={(e) => handleFieldChange('retryAttempts', parseInt(e.target.value))}
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    重试延迟 (毫秒)
                  </label>
                  <Input
                    type="number"
                    value={formData.retryDelay || config.retryDelay || 1000}
                    onChange={(e) => handleFieldChange('retryDelay', parseInt(e.target.value))}
                    min="100"
                  />
                </div>
              </div>
            </div>

            {/* 自定义头部 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">自定义头部</h3>
              <div className="space-y-3">
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <Input
                      type="text"
                      value={header.key}
                      onChange={(e) => handleCustomHeaderChange(index, 'key', e.target.value)}
                      placeholder="头部名称"
                      className="flex-1"
                    />
                    <Input
                      type="text"
                      value={header.value}
                      onChange={(e) => handleCustomHeaderChange(index, 'value', e.target.value)}
                      placeholder="头部值"
                      className="flex-1"
                    />
                    {customHeaders.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomHeader(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        删除
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomHeader}
                >
                  添加头部
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-600">
              敏感信息留空将保持原有值不变
            </span>
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConfig}
              disabled={testing}
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              {testing ? '测试中...' : '测试配置'}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存更改'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditApiConfigPage;
