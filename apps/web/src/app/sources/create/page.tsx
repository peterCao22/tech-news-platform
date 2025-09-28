'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sourcesApi, CreateSourceData, ValidationResult } from '@/services/api/sources';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@tech-news-platform/ui';
import { ArrowLeft, Check, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateSourcePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateSourceData>({
    name: '',
    type: 'RSS',
    url: '',
    config: {}
  });
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [creating, setCreating] = useState(false);

  // 处理表单输入
  const handleInputChange = (field: keyof CreateSourceData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除之前的验证结果
    if (field === 'url') {
      setValidation(null);
    }
  };

  // 验证RSS URL
  const handleValidateUrl = async () => {
    if (!formData.url || formData.type !== 'RSS') {
      return;
    }

    setValidating(true);
    try {
      const response = await sourcesApi.validateRSSUrl(formData.url);
      setValidation(response.data || null);
      
      if (response.data?.valid) {
        toast.success('RSS URL验证成功！');
        // 如果名称为空，使用RSS标题作为名称
        if (!formData.name && response.data.title) {
          setFormData(prev => ({
            ...prev,
            name: response.data.title || ''
          }));
        }
      } else {
        toast.error(`RSS URL验证失败: ${response.data?.error || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('验证RSS URL失败:', error);
      toast.error(error.message || '验证RSS URL失败');
      setValidation({ valid: false, error: error.message || '验证失败' });
    } finally {
      setValidating(false);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('请输入RSS源名称');
      return;
    }
    
    if (formData.type === 'RSS' && !formData.url?.trim()) {
      toast.error('请输入RSS URL');
      return;
    }

    setCreating(true);
    try {
      const response = await sourcesApi.createSource({
        ...formData,
        name: formData.name.trim(),
        url: formData.url?.trim(),
        config: {
          description: formData.config?.description || '',
          category: formData.config?.category || 'tech',
          ...formData.config
        }
      });
      
      toast.success('RSS源创建成功！');
      router.push('/sources');
    } catch (error: any) {
      console.error('创建RSS源失败:', error);
      toast.error(error.message || '创建RSS源失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 页面标题 */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">添加RSS源</h1>
              <p className="text-gray-600 mt-1">配置新的RSS源以获取最新内容</p>
            </div>
          </div>

          {/* 创建表单 */}
          <Card>
            <CardHeader>
              <CardTitle>RSS源信息</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 源类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    源类型
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="RSS">RSS</option>
                    <option value="API">API</option>
                    <option value="AI_QUERY">AI查询</option>
                    <option value="EMAIL">邮件</option>
                    <option value="MANUAL">手动</option>
                  </select>
                </div>

                {/* RSS URL */}
                {formData.type === 'RSS' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RSS URL *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={formData.url || ''}
                        onChange={(e) => handleInputChange('url', e.target.value)}
                        placeholder="https://example.com/rss.xml"
                        className="flex-1"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleValidateUrl}
                        disabled={validating || !formData.url}
                      >
                        {validating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          '验证'
                        )}
                      </Button>
                    </div>
                    
                    {/* 验证结果 */}
                    {validation && (
                      <div className={`mt-2 p-3 rounded-md ${
                        validation.valid 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          {validation.valid ? (
                            <Check className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            {validation.valid ? (
                              <div>
                                <p className="text-green-800 font-medium">RSS验证成功</p>
                                {validation.title && (
                                  <p className="text-green-700 text-sm mt-1">
                                    <strong>标题:</strong> {validation.title}
                                  </p>
                                )}
                                {validation.description && (
                                  <p className="text-green-700 text-sm mt-1">
                                    <strong>描述:</strong> {validation.description}
                                  </p>
                                )}
                                {validation.itemCount !== undefined && (
                                  <p className="text-green-700 text-sm mt-1">
                                    <strong>内容数量:</strong> {validation.itemCount} 条
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p className="text-red-800 font-medium">RSS验证失败</p>
                                <p className="text-red-700 text-sm mt-1">{validation.error}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 源名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    源名称 *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="例如: 科技新闻RSS"
                    required
                  />
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.config?.description || ''}
                    onChange={(e) => handleInputChange('config', { 
                      ...formData.config, 
                      description: e.target.value 
                    })}
                    placeholder="简要描述这个RSS源的内容..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* 分类 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类
                  </label>
                  <select
                    value={formData.config?.category || 'tech'}
                    onChange={(e) => handleInputChange('config', { 
                      ...formData.config, 
                      category: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tech">科技</option>
                    <option value="business">商业</option>
                    <option value="ai">人工智能</option>
                    <option value="startup">创业</option>
                    <option value="programming">编程</option>
                    <option value="design">设计</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating || (formData.type === 'RSS' && validation && !validation.valid)}
                    loading={creating}
                  >
                    {creating ? '创建中...' : '创建RSS源'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 帮助信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">使用提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-medium">RSS URL格式</p>
                  <p>请确保输入完整的RSS或Atom feed URL，例如：https://example.com/rss.xml</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-green-500" />
                <div>
                  <p className="font-medium">验证建议</p>
                  <p>建议在创建前先验证RSS URL，确保能够正常获取内容</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-500" />
                <div>
                  <p className="font-medium">注意事项</p>
                  <p>某些RSS源可能有访问限制或需要特殊配置，如遇问题请联系管理员</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
