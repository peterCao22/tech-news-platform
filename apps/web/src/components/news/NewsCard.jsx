import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@tech-news-platform/ui';
import { User, Clock, Tag, Bookmark, Share2, Eye, ExternalLink } from 'lucide-react';
export const NewsCard = ({ content, viewMode = 'grid', showActions = true, onBookmark, onShare, className = '' }) => {
    const router = useRouter();
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
        return new Date(dateString).toLocaleDateString('zh-CN');
    };
    const truncateText = (text, maxLength = 150) => {
        if (!text)
            return '';
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength) + '...';
    };
    const handleCardClick = () => {
        router.push(`/news/${content.id}`);
    };
    const handleBookmark = (e) => {
        e.stopPropagation();
        onBookmark?.(content);
    };
    const handleShare = (e) => {
        e.stopPropagation();
        onShare?.(content);
    };
    const handleExternalLink = (e) => {
        e.stopPropagation();
        if (content.url) {
            window.open(content.url, '_blank');
        }
    };
    if (viewMode === 'list') {
        return (<div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${className}`} onClick={handleCardClick}>
        <div className="p-6">
          <div className="flex gap-4">
            {/* 缩略图 */}
            {content.imageUrl && (<div className="flex-shrink-0 w-32 h-24 bg-gray-200 rounded-lg overflow-hidden">
                <img src={content.imageUrl} alt={content.title} className="w-full h-full object-cover" onError={(e) => {
                    e.target.style.display = 'none';
                }}/>
              </div>)}
            
            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 flex-1">
                  {content.title}
                </h3>
                {showActions && (<div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {content.url && (<Button size="sm" variant="ghost" onClick={handleExternalLink} className="text-gray-500 hover:text-blue-600" title="查看原文">
                        <ExternalLink className="h-4 w-4"/>
                      </Button>)}
                    <Button size="sm" variant="ghost" onClick={handleBookmark} className="text-gray-500 hover:text-yellow-600" title="收藏">
                      <Bookmark className="h-4 w-4"/>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleShare} className="text-gray-500 hover:text-blue-600" title="分享">
                      <Share2 className="h-4 w-4"/>
                    </Button>
                  </div>)}
              </div>
              
              {content.description && (<p className="text-gray-600 mb-3 leading-relaxed">
                  {truncateText(content.description, 200)}
                </p>)}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4"/>
                  <span>{content.source.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4"/>
                  <span>{formatRelativeTime(content.publishedAt || content.createdAt)}</span>
                </div>
                {content.category && (<div className="flex items-center gap-1">
                    <Tag className="h-4 w-4"/>
                    <span className="capitalize">{content.category}</span>
                  </div>)}
                {content.viewCount && content.viewCount > 0 && (<div className="flex items-center gap-1">
                    <Eye className="h-4 w-4"/>
                    <span>{content.viewCount} 浏览</span>
                  </div>)}
              </div>
              
              {content.tags && content.tags.length > 0 && (<div className="flex flex-wrap gap-2">
                  {content.tags.slice(0, 3).map((tag, index) => (<span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>))}
                  {content.tags.length > 3 && (<span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{content.tags.length - 3}
                    </span>)}
                </div>)}
            </div>
          </div>
        </div>
      </div>);
    }
    // Grid view
    return (<div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer h-full ${className}`} onClick={handleCardClick}>
      {/* 缩略图 */}
      {content.imageUrl && (<div className="w-full h-48 bg-gray-200 overflow-hidden rounded-t-lg">
          <img src={content.imageUrl} alt={content.title} className="w-full h-full object-cover" onError={(e) => {
                e.target.style.display = 'none';
            }}/>
        </div>)}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 flex-1">
            {content.title}
          </h3>
          {showActions && (<div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {content.url && (<Button size="sm" variant="ghost" onClick={handleExternalLink} className="text-gray-500 hover:text-blue-600 p-1" title="查看原文">
                  <ExternalLink className="h-4 w-4"/>
                </Button>)}
              <Button size="sm" variant="ghost" onClick={handleBookmark} className="text-gray-500 hover:text-yellow-600 p-1" title="收藏">
                <Bookmark className="h-4 w-4"/>
              </Button>
              <Button size="sm" variant="ghost" onClick={handleShare} className="text-gray-500 hover:text-blue-600 p-1" title="分享">
                <Share2 className="h-4 w-4"/>
              </Button>
            </div>)}
        </div>
        
        {content.description && (<p className="text-gray-600 mb-3 leading-relaxed text-sm">
            {truncateText(content.description, 120)}
          </p>)}
        
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3"/>
            <span>{content.source.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3"/>
            <span>{formatRelativeTime(content.publishedAt || content.createdAt)}</span>
          </div>
          {content.viewCount && content.viewCount > 0 && (<div className="flex items-center gap-1">
              <Eye className="h-3 w-3"/>
              <span>{content.viewCount}</span>
            </div>)}
        </div>
        
        {content.tags && content.tags.length > 0 && (<div className="flex flex-wrap gap-1">
            {content.tags.slice(0, 2).map((tag, index) => (<span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {tag}
              </span>))}
            {content.tags.length > 2 && (<span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{content.tags.length - 2}
              </span>)}
          </div>)}
      </div>
    </div>);
};
export default NewsCard;
