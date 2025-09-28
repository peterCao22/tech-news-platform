'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { contentApi, Content } from '@/services/api/content';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tech-news-platform/ui';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  Tag, 
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Edit,
  Trash2,
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// 状态图标映射
const statusIcons = {
  RAW: <FileText className="h-5 w-5 text-gray-500" />,
  PROCESSING: <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />,
  PROCESSED: <CheckCircle className="h-5 w-5 text-green-500" />,
  REVIEWED: <AlertCircle className="h-5 w-5 text-purple-500" />,
  PUBLISHED: <CheckCircle className="h-5 w-5 text-green-600" />,
  REJECTED: <XCircle className="h-5 w-5 text-red-500" />,
};

// 状态文本映射
const statusText = {
  RAW: '原始',
  PROCESSING: '处理中',
  PROCESSED: '已处理',
  REVIEWED: '已审核',
  PUBLISHED: '已发布',
  REJECTED: '已拒绝',
};

// 状态颜色映射
const statusColors = {
  RAW: 'bg-gray-100 text-gray-800 border-gray-200',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSED: 'bg-green-100 text-green-800 border-green-200',
  REVIEWED: 'bg-purple-100 text-purple-800 border-purple-200',
  PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

export default function ContentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  const { user, isAuthenticated } = useAuthStore();
  
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 加载内容详情
  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await contentApi.getContent(contentId);
      setContent(response.data);
    } catch (error: any) {
      console.error('加载内容失败:', error);
      toast.error(error.message || '加载内容失败');
      router.push('/content');
    } finally {
      setLoading(false);
    }
  };

  // 更新内容状态
  const handleUpdateStatus = async (newStatus: string) => {
    if (!content) return;
    
    try {
      setUpdating(true);
      await contentApi.updateContentStatus(content.id, newStatus);
      setContent({ ...content, status: newStatus as any });
      toast.success('状态更新成功');
    } catch (error: any) {
      console.error('更新状态失败:', error);
      toast.error(error.message || '更新状态失败');
    } finally {
      setUpdating(false);
    }
  };

  // 删除内容
  const handleDelete = async () => {
    if (!content) return;
    
    if (!confirm(`确定要删除内容"${content.title}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await contentApi.deleteContent(content.id);
      toast.success('内容已删除');
      router.push('/content');
    } catch (error: any) {
      console.error('删除内容失败:', error);
      toast.error(error.message || '删除内容失败');
    }
  };

  // 分享内容
  const handleShare = async () => {
    if (!content) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description,
          url: content.url || window.location.href,
        });
      } catch (error) {
        // 用户取消分享或其他错误
      }
    } else {
      // 复制到剪贴板
      const shareText = `${content.title}\n${content.description || ''}\n${content.url || window.location.href}`;
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('内容已复制到剪贴板');
      } catch (error) {
        toast.error('复制失败');
      }
    }
  };

  // 格式化时间
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 格式化相对时间
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return '未知';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return formatDate(dateString);
  };

  // 渲染HTML内容
  const renderContent = (htmlContent?: string) => {
    if (!htmlContent) return null;
    
    // 简单的HTML清理（生产环境应使用专业的HTML清理库）
    const cleanHtml = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    
    return (
      <div 
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  };

  useEffect(() => {
    if (isAuthenticated && contentId) {
      loadContent();
    }
  }, [isAuthenticated, contentId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">加载内容详情...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!content) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">内容不存在</h2>
            <p className="text-gray-600 mb-4">找不到指定的内容</p>
            <Button onClick={() => router.push('/content')}>
              返回内容列表
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 页面标题和操作 */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-1" />
                分享
              </Button>
              
              {content.url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(content.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  查看原文
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </Button>
            </div>
          </div>

          {/* 内容主体 */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-4">{content.title}</CardTitle>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{content.source.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatRelativeTime(content.publishedAt || content.createdAt)}</span>
                    </div>
                    {content.category && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        <span>{content.category}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {statusIcons[content.status]}
                  <span className={`px-3 py-1 text-sm rounded-full border ${statusColors[content.status]}`}>
                    {statusText[content.status]}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 图片 */}
              {content.imageUrl && (
                <div className="relative">
                  <img
                    src={content.imageUrl}
                    alt={content.title}
                    className="w-full max-h-96 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* 描述 */}
              {content.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">摘要</h3>
                  <p className="text-gray-700 leading-relaxed">{content.description}</p>
                </div>
              )}
              
              {/* 内容 */}
              {content.content && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">内容</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {renderContent(content.content)}
                  </div>
                </div>
              )}
              
              {/* 标签 */}
              {content.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 状态管理 */}
          <Card>
            <CardHeader>
              <CardTitle>状态管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  更新状态:
                </label>
                <select
                  value={content.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  disabled={updating}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="RAW">原始</option>
                  <option value="PROCESSING">处理中</option>
                  <option value="PROCESSED">已处理</option>
                  <option value="REVIEWED">已审核</option>
                  <option value="PUBLISHED">已发布</option>
                  <option value="REJECTED">已拒绝</option>
                </select>
                {updating && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* 元数据 */}
          <Card>
            <CardHeader>
              <CardTitle>详细信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">内容ID:</span>
                  <span className="ml-2 text-gray-600 font-mono">{content.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">优先级:</span>
                  <span className="ml-2 text-gray-600">{content.priority}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">评分:</span>
                  <span className="ml-2 text-gray-600">{content.score || '未评分'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">来源类型:</span>
                  <span className="ml-2 text-gray-600">{content.source.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">发布时间:</span>
                  <span className="ml-2 text-gray-600">{formatDate(content.publishedAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">创建时间:</span>
                  <span className="ml-2 text-gray-600">{formatDate(content.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">更新时间:</span>
                  <span className="ml-2 text-gray-600">{formatDate(content.updatedAt)}</span>
                </div>
                {content.sourceUrl && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">原文链接:</span>
                    <a 
                      href={content.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline break-all"
                    >
                      {content.sourceUrl}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
