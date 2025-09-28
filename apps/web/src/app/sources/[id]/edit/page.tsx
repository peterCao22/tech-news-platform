'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { sourcesApi, Source, UpdateSourceData, ValidationResult } from '@/services/api/sources';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@tech-news-platform/ui';
import { ArrowLeft, Check, AlertCircle, ExternalLink, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function EditSourcePage() {
  const router = useRouter();
  const params = useParams();
  const sourceId = params.id as string;
  
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<UpdateSourceData>({
    name: '',
    url: '',
    config: {},
    status: 'ACTIVE'
  });
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [saving, setSaving] = useState(false);

  // 加载RSS源信息
  const loadSource = async () => {
    try {
      setLoading(true);
      const response = await sourcesApi.getSource(sourceId);
      const sourceData = response.data;
      setSource(sourceData);
      setFormData({
        name: sourceData.name,
        url: sourceData.url || '',
        config: sourceData.config || {},
        status: sourceData.status
      });
    } catch (error: any) {
      console.error('加载RSS源失败:', error);
      toast.error(error.message || '加载RSS源失败');
      router.push('/sources');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单输入
  const handleInputChange = (field: keyof UpdateSourceData, value: any) => {
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
    if (!formData.url || source?.type !== 'RSS') {
      return;
    }

    setValidating(true);
    try {
      const response = await sourcesApi.validateRSSUrl(formData.url);
      setValidation(response.data || null);
      
      if (response.data?.valid) {
        toast.success('RSS URL验证成功！');
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
    
    if (!formData.name?.trim()) {
      toast.error('请输入RSS源名称');
      return;
    }
    
    if (source?.type === 'RSS' && !formData.url?.trim()) {
      toast.error('请输入RSS URL');
      return;
    }

    setSaving(true);
    try {
      const updateData: UpdateSourceData = {
        name: formData.name.trim(),
        url: formData.url?.trim(),
        status: formData.status,
        config: {
          description: formData.config?.description || '',
          category: formData.config?.category || 'tech',
          ...formData.config
        }
      };
      
      await sourcesApi.updateSource(sourceId, updateData);
      toast.success('RSS源更新成功！');
      router.push('/sources');
    } catch (error: any) {
      console.error('更新RSS源失败:', error);
      toast.error(error.message || '更新RSS源失败');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (sourceId) {
      loadSource();
    }
  }, [sourceId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">加载RSS源信息...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!source) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">RSS源不存在</h2>
            <p className="text-gray-600 mb-4">找不到指定的RSS源</p>
            <Button onClick={() => router.push('/sources')}>
              返回RSS源列表
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">编辑RSS源</h1>
              <p className="text-gray-600 mt-1">修改RSS源的配置信息</p>
            </div>
          </div>

          {/* 编辑表单 */}
          <Card>
            <CardHeader>
              <CardTitle>RSS源信息</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 源类型（只读） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    源类型
                  </label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    {source.type}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">源类型创建后不可修改</p>
                </div>

                {/* RSS URL */}
                {source.type === 'RSS' && (
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
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="例如: 科技新闻RSS"
                    required
                  />
                </div>

                {/* 状态 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    状态
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ACTIVE">活跃</option>
                    <option value="INACTIVE">未激活</option>
                    <option value="ERROR">错误</option>
                    <option value="RATE_LIMITED">限流</option>
                  </select>
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
                    disabled={saving || (source.type === 'RSS' && validation && !validation.valid)}
                    loading={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? '保存中...' : '保存更改'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* RSS源信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">RSS源统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-700">抓取次数</p>
                  <p className="text-lg font-semibold text-blue-600">{source.fetchCount}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">错误次数</p>
                  <p className="text-lg font-semibold text-red-600">{source.errorCount}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">最后抓取</p>
                  <p className="text-gray-600">
                    {source.lastFetchAt ? new Date(source.lastFetchAt).toLocaleString('zh-CN') : '从未'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">创建时间</p>
                  <p className="text-gray-600">
                    {new Date(source.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              
              {source.lastError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="font-medium text-red-800">最后错误</p>
                  <p className="text-red-700 text-sm mt-1">{source.lastError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
