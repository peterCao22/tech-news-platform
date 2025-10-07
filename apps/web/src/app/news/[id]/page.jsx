'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { contentApi } from '@/services/api/content';
import { Card, CardContent, Button } from '@tech-news-platform/ui';
import { ArrowLeft, ExternalLink, Calendar, Tag, User, Clock, Share2, Bookmark, Eye, RefreshCw, AlertCircle, ThumbsUp, Copy, Twitter, Facebook, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
export default function NewsDetailPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const params = useParams();
    const contentId = params.id;
    // 状态管理
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedNews, setRelatedNews] = useState([]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    // 加载新闻详情
    const loadContent = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await contentApi.getContent(contentId);
            setContent(response.data);
            // 增加浏览次数
            await contentApi.incrementViewCount(contentId);
            // 加载相关新闻
            if (response.data.category || response.data.tags?.length > 0) {
                loadRelatedNews(response.data);
            }
        }
        catch (error) {
            console.error('加载新闻详情失败:', error);
            setError(error.message || '加载新闻详情失败');
        }
        finally {
            setLoading(false);
        }
    };
    // 加载相关新闻
    const loadRelatedNews = async (currentContent) => {
        try {
            const response = await contentApi.getContents({
                category: currentContent.category,
                limit: 4,
                status: 'PUBLISHED',
                excludeId: currentContent.id,
            });
            setRelatedNews(Array.isArray(response.data) ? response.data : []);
        }
        catch (error) {
            console.error('加载相关新闻失败:', error);
        }
    };
    // 格式化时间
    const formatDate = (dateString) => {
        if (!dateString)
            return '未知';
        return new Date(dateString).toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    // 格式化相对时间
    const formatRelativeTime = (dateString) => {
        if (!dateString)
            return '未知';
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffInHours < 1)
            return '刚刚';
        if (diffInHours < 24)
            return `${diffInHours}小时前`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7)
            return `${diffInDays}天前`;
        return formatDate(dateString);
    };
    // 分享新闻
    const handleShare = (platform) => {
        if (!content)
            return;
        const url = content.url || window.location.href;
        const title = content.title;
        const text = content.description || '';
        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                toast.success('链接已复制到剪贴板');
                break;
            default:
                if (navigator.share) {
                    navigator.share({
                        title,
                        text,
                        url,
                    });
                }
                else {
                    setShowShareMenu(true);
                }
        }
    };
    // 收藏新闻
    const handleBookmark = () => {
        // TODO: 实现收藏功能
        setIsBookmarked(!isBookmarked);
        toast.success(isBookmarked ? '已取消收藏' : '已添加到收藏');
    };
    // 点赞新闻
    const handleLike = () => {
        // TODO: 实现点赞功能
        toast.success('感谢您的点赞！');
    };
    useEffect(() => {
        if (isAuthenticated && contentId) {
            loadContent();
        }
    }, [isAuthenticated, contentId]);
    if (loading) {
        return (<ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600"/>
            <p className="text-gray-600">加载新闻详情...</p>
          </div>
        </div>
      </ProtectedRoute>);
    }
    if (error || !content) {
        return (<ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{error || '新闻不存在或已被删除'}</p>
            <div className="space-x-3">
              <Button onClick={() => router.back()} variant="outline">
                返回上页
              </Button>
              <Button onClick={() => router.push('/news')}>
                浏览新闻
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button variant="ghost" onClick={() => router.back()} className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2"/>
                返回
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleBookmark()} className={isBookmarked ? 'text-yellow-600 border-yellow-600' : ''}>
                  <Bookmark className={`h-4 w-4 mr-1 ${isBookmarked ? 'fill-current' : ''}`}/>
                  {isBookmarked ? '已收藏' : '收藏'}
                </Button>
                
                <div className="relative">
                  <Button size="sm" variant="outline" onClick={() => handleShare()}>
                    <Share2 className="h-4 w-4 mr-1"/>
                    分享
                  </Button>
                  
                  {showShareMenu && (<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                      <div className="py-1">
                        <button onClick={() => handleShare('copy')} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Copy className="h-4 w-4 mr-2"/>
                          复制链接
                        </button>
                        <button onClick={() => handleShare('twitter')} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Twitter className="h-4 w-4 mr-2"/>
                          分享到 Twitter
                        </button>
                        <button onClick={() => handleShare('facebook')} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Facebook className="h-4 w-4 mr-2"/>
                          分享到 Facebook
                        </button>
                        <button onClick={() => handleShare('linkedin')} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Linkedin className="h-4 w-4 mr-2"/>
                          分享到 LinkedIn
                        </button>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <article className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* 文章头部 */}
            <div className="p-8">
              {/* 标题 */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {content.title}
              </h1>
              
              {/* 元信息 */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4"/>
                  <span className="font-medium">{content.source.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4"/>
                  <span>{formatRelativeTime(content.publishedAt || content.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4"/>
                  <span>{formatDate(content.publishedAt || content.createdAt)}</span>
                </div>
                {content.category && (<div className="flex items-center gap-1">
                    <Tag className="h-4 w-4"/>
                    <span className="capitalize">{content.category}</span>
                  </div>)}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4"/>
                  <span>{content.viewCount || 0} 次浏览</span>
                </div>
              </div>

              {/* 摘要 */}
              {content.description && (<div className="mb-6">
                  <p className="text-lg text-gray-700 leading-relaxed font-medium bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                    {content.description}
                  </p>
                </div>)}

              {/* 特色图片 */}
              {content.imageUrl && (<div className="mb-6">
                  <img src={content.imageUrl} alt={content.title} className="w-full h-auto rounded-lg shadow-sm" onError={(e) => {
                e.target.style.display = 'none';
            }}/>
                </div>)}

              {/* 正文内容 */}
              {content.content && (<div className="prose prose-lg max-w-none mb-8">
                  <div className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: content.content }}/>
                </div>)}

              {/* 标签 */}
              {content.tags && content.tags.length > 0 && (<div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">相关标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag, index) => (<span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 cursor-pointer transition-colors">
                        {tag}
                      </span>))}
                  </div>
                </div>)}

              {/* 原文链接 */}
              {content.url && (<div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">阅读原文</h3>
                      <p className="text-sm text-gray-600">查看完整的原始文章</p>
                    </div>
                    <Button onClick={() => window.open(content.url, '_blank')} className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2"/>
                      访问原文
                    </Button>
                  </div>
                </div>)}

              {/* 互动按钮 */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={handleLike} className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-2"/>
                    点赞
                  </Button>
                  
                  <Button variant="outline" onClick={() => handleBookmark()} className={isBookmarked ? 'text-yellow-600 border-yellow-600' : ''}>
                    <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`}/>
                    {isBookmarked ? '已收藏' : '收藏'}
                  </Button>
                  
                  <Button variant="outline" onClick={() => handleShare()}>
                    <Share2 className="h-4 w-4 mr-2"/>
                    分享
                  </Button>
                </div>
                
                <div className="text-sm text-gray-500">
                  最后更新: {formatRelativeTime(content.updatedAt)}
                </div>
              </div>
            </div>
          </article>

          {/* 相关新闻 */}
          {relatedNews.length > 0 && (<div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">相关新闻</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedNews.map((news) => (<Card key={news.id} className="hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => router.push(`/news/${news.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {news.imageUrl && (<div className="flex-shrink-0 w-20 h-16 bg-gray-200 rounded overflow-hidden">
                            <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" onError={(e) => {
                        e.target.style.display = 'none';
                    }}/>
                          </div>)}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                            {news.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{news.source.name}</span>
                            <span>{formatRelativeTime(news.publishedAt || news.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>))}
              </div>
            </div>)}
        </main>

        {/* 点击外部关闭分享菜单 */}
        {showShareMenu && (<div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)}/>)}
      </div>
    </ProtectedRoute>);
}
