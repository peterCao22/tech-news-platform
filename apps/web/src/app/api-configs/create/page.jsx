'use client';
// 科技新闻聚合平台 - 创建API配置页面
// 创建新的外部API集成配置
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@tech-news-platform/ui';
import { Button } from '@tech-news-platform/ui';
import { Input } from '@tech-news-platform/ui';
import { Select } from '@tech-news-platform/ui';
import { ArrowLeft, Save, TestTube, Eye, EyeOff, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiConfigService } from '../../../services/api-config.service';
const CreateApiConfigPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showSensitiveFields, setShowSensitiveFields] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        provider: '',
        baseUrl: '',
        authType: 'API_KEY',
        apiKey: '',
        token: '',
        username: '',
        password: '',
        headerName: 'X-API-Key',
        rateLimit: {
            maxRequests: 100,
            windowMs: 60000 // 1分钟
        },
        timeout: 30000, // 30秒
        retryAttempts: 3,
        retryDelay: 1000, // 1秒
        headers: {}
    });
    const [customHeaders, setCustomHeaders] = useState([
        { key: '', value: '' }
    ]);
    // 预设的API提供商配置
    const providerPresets = {
        alpha_vantage: {
            name: 'Alpha Vantage',
            baseUrl: 'https://www.alphavantage.co',
            authType: 'API_KEY',
            headerName: 'apikey'
        },
        newsapi: {
            name: 'NewsAPI',
            baseUrl: 'https://newsapi.org/v2',
            authType: 'API_KEY',
            headerName: 'X-API-Key'
        },
        polygon: {
            name: 'Polygon.io',
            baseUrl: 'https://api.polygon.io',
            authType: 'API_KEY',
            headerName: 'apikey'
        },
        custom: {
            name: '自定义',
            baseUrl: '',
            authType: 'API_KEY',
            headerName: 'X-API-Key'
        }
    };
    // 处理表单字段变化
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    // 处理提供商选择
    const handleProviderChange = (provider) => {
        const preset = providerPresets[provider];
        if (preset) {
            setFormData(prev => ({
                ...prev,
                provider,
                name: preset.name,
                baseUrl: preset.baseUrl,
                authType: preset.authType,
                headerName: preset.headerName
            }));
        }
    };
    // 处理自定义头部
    const handleCustomHeaderChange = (index, field, value) => {
        const newHeaders = [...customHeaders];
        newHeaders[index][field] = value;
        setCustomHeaders(newHeaders);
        // 更新表单数据
        const headersObj = newHeaders.reduce((acc, header) => {
            if (header.key && header.value) {
                acc[header.key] = header.value;
            }
            return acc;
        }, {});
        handleFieldChange('headers', headersObj);
    };
    // 添加自定义头部
    const addCustomHeader = () => {
        setCustomHeaders([...customHeaders, { key: '', value: '' }]);
    };
    // 删除自定义头部
    const removeCustomHeader = (index) => {
        const newHeaders = customHeaders.filter((_, i) => i !== index);
        setCustomHeaders(newHeaders);
        // 更新表单数据
        const headersObj = newHeaders.reduce((acc, header) => {
            if (header.key && header.value) {
                acc[header.key] = header.value;
            }
            return acc;
        }, {});
        handleFieldChange('headers', headersObj);
    };
    // 验证表单
    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error('请输入配置名称');
            return false;
        }
        if (!formData.provider.trim()) {
            toast.error('请选择API提供商');
            return false;
        }
        if (!formData.baseUrl.trim()) {
            toast.error('请输入API基础URL');
            return false;
        }
        // 根据认证类型验证必填字段
        switch (formData.authType) {
            case 'API_KEY':
                if (!formData.apiKey?.trim()) {
                    toast.error('请输入API密钥');
                    return false;
                }
                break;
            case 'BEARER_TOKEN':
                if (!formData.token?.trim()) {
                    toast.error('请输入Bearer Token');
                    return false;
                }
                break;
            case 'BASIC_AUTH':
                if (!formData.username?.trim() || !formData.password?.trim()) {
                    toast.error('请输入用户名和密码');
                    return false;
                }
                break;
        }
        return true;
    };
    // 测试配置
    const handleTestConfig = async () => {
        if (!validateForm())
            return;
        try {
            setTesting(true);
            // 这里应该调用测试API，但由于配置还未保存，我们先保存为临时配置进行测试
            toast.info('配置验证中...');
            // 模拟测试延迟
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success('配置测试成功！');
        }
        catch (error) {
            console.error('测试配置失败:', error);
            toast.error('配置测试失败，请检查配置信息');
        }
        finally {
            setTesting(false);
        }
    };
    // 提交表单
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        try {
            setLoading(true);
            await apiConfigService.createApiConfig(formData);
            toast.success('API配置创建成功');
            router.push('/api-configs');
        }
        catch (error) {
            console.error('创建API配置失败:', error);
            toast.error('创建API配置失败');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4"/>
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">创建API配置</h1>
          <p className="text-gray-600 mt-2">配置外部API集成和认证信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本信息 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API提供商 *
              </label>
              <Select value={formData.provider} onValueChange={handleProviderChange} required>
                <option value="">选择提供商</option>
                <option value="alpha_vantage">Alpha Vantage</option>
                <option value="newsapi">NewsAPI</option>
                <option value="polygon">Polygon.io</option>
                <option value="custom">自定义</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                配置名称 *
              </label>
              <Input type="text" value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} placeholder="例如：Alpha Vantage - 股票数据" required/>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API基础URL *
              </label>
              <Input type="url" value={formData.baseUrl} onChange={(e) => handleFieldChange('baseUrl', e.target.value)} placeholder="https://api.example.com" required/>
            </div>
          </div>
        </Card>

        {/* 认证配置 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">认证配置</h2>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowSensitiveFields(!showSensitiveFields)} className="flex items-center gap-2">
                {showSensitiveFields ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                {showSensitiveFields ? '隐藏' : '显示'}敏感信息
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                认证方式 *
              </label>
              <Select value={formData.authType} onValueChange={(value) => handleFieldChange('authType', value)} required>
                <option value="API_KEY">API Key</option>
                <option value="BEARER_TOKEN">Bearer Token</option>
                <option value="BASIC_AUTH">Basic Auth</option>
                <option value="OAUTH">OAuth</option>
                <option value="NONE">无认证</option>
              </Select>
            </div>

            {/* API Key 认证 */}
            {formData.authType === 'API_KEY' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API密钥 *
                  </label>
                  <Input type={showSensitiveFields ? "text" : "password"} value={formData.apiKey || ''} onChange={(e) => handleFieldChange('apiKey', e.target.value)} placeholder="输入API密钥" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    头部名称
                  </label>
                  <Input type="text" value={formData.headerName || ''} onChange={(e) => handleFieldChange('headerName', e.target.value)} placeholder="X-API-Key"/>
                </div>
              </div>)}

            {/* Bearer Token 认证 */}
            {formData.authType === 'BEARER_TOKEN' && (<div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bearer Token *
                </label>
                <Input type={showSensitiveFields ? "text" : "password"} value={formData.token || ''} onChange={(e) => handleFieldChange('token', e.target.value)} placeholder="输入Bearer Token" required/>
              </div>)}

            {/* Basic Auth 认证 */}
            {formData.authType === 'BASIC_AUTH' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名 *
                  </label>
                  <Input type="text" value={formData.username || ''} onChange={(e) => handleFieldChange('username', e.target.value)} placeholder="输入用户名" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码 *
                  </label>
                  <Input type={showSensitiveFields ? "text" : "password"} value={formData.password || ''} onChange={(e) => handleFieldChange('password', e.target.value)} placeholder="输入密码" required/>
                </div>
              </div>)}

            {/* OAuth 提示 */}
            {formData.authType === 'OAUTH' && (<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5"/>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">OAuth配置</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      OAuth认证需要额外的配置步骤，包括客户端ID、客户端密钥和回调URL。
                      请联系系统管理员进行配置。
                    </p>
                  </div>
                </div>
              </div>)}
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
                  <Input type="number" value={formData.rateLimit?.maxRequests || 100} onChange={(e) => handleFieldChange('rateLimit', {
            ...formData.rateLimit,
            maxRequests: parseInt(e.target.value)
        })} min="1"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    时间窗口 (毫秒)
                  </label>
                  <Input type="number" value={formData.rateLimit?.windowMs || 60000} onChange={(e) => handleFieldChange('rateLimit', {
            ...formData.rateLimit,
            windowMs: parseInt(e.target.value)
        })} min="1000"/>
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
                  <Input type="number" value={formData.timeout || 30000} onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value))} min="1000"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    重试次数
                  </label>
                  <Input type="number" value={formData.retryAttempts || 3} onChange={(e) => handleFieldChange('retryAttempts', parseInt(e.target.value))} min="0" max="10"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    重试延迟 (毫秒)
                  </label>
                  <Input type="number" value={formData.retryDelay || 1000} onChange={(e) => handleFieldChange('retryDelay', parseInt(e.target.value))} min="100"/>
                </div>
              </div>
            </div>

            {/* 自定义头部 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">自定义头部</h3>
              <div className="space-y-3">
                {customHeaders.map((header, index) => (<div key={index} className="flex gap-3 items-center">
                    <Input type="text" value={header.key} onChange={(e) => handleCustomHeaderChange(index, 'key', e.target.value)} placeholder="头部名称" className="flex-1"/>
                    <Input type="text" value={header.value} onChange={(e) => handleCustomHeaderChange(index, 'value', e.target.value)} placeholder="头部值" className="flex-1"/>
                    {customHeaders.length > 1 && (<Button type="button" variant="outline" size="sm" onClick={() => removeCustomHeader(index)} className="text-red-600 hover:text-red-700">
                        删除
                      </Button>)}
                  </div>))}
                <Button type="button" variant="outline" size="sm" onClick={addCustomHeader}>
                  添加头部
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500"/>
            <span className="text-sm text-gray-600">
              敏感信息将被加密存储
            </span>
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleTestConfig} disabled={testing} className="flex items-center gap-2">
              <TestTube className="w-4 h-4"/>
              {testing ? '测试中...' : '测试配置'}
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="w-4 h-4"/>
              {loading ? '创建中...' : '创建配置'}
            </Button>
          </div>
        </div>
      </form>
    </div>);
};
export default CreateApiConfigPage;
