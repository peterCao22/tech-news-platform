/**
 * Content Preview Component
 * 内容预览组件
 * Story 3.3: Manual Content Management
 */

'use client';

import React from 'react';
import DOMPurify from 'dompurify';
import { FileText, Calendar, Tag, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface ContentPreviewProps {
  formData: {
    title: string;
    description: string;
    content: string;
    url: string;
    category: string;
    tags: string[];
    publishedAt?: Date;
    reviewStatus: string;
  };
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({ formData }) => {
  // 清理HTML内容以防止XSS攻击
  const sanitizedContent = DOMPurify.sanitize(formData.content, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'strong',
      'em',
      'u',
      's',
      'code',
      'pre',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class'],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
      PENDING_REVIEW: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
      APPROVED: { label: '已通过', color: 'bg-green-100 text-green-700' },
      REJECTED: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
      PUBLISHED: { label: '已发布', color: 'bg-blue-100 text-blue-700' },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date?: Date) => {
    if (!date) return '未设置';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="content-preview bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 预览头部 */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">内容预览</h3>
          </div>
          {getStatusBadge(formData.reviewStatus)}
        </div>
      </div>

      {/* 预览内容 */}
      <div className="px-6 py-4">
        {/* 标题 */}
        {formData.title ? (
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{formData.title}</h1>
        ) : (
          <div className="flex items-center text-gray-400 mb-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>未设置标题</span>
          </div>
        )}

        {/* 元数据 */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
          {formData.category && (
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1.5" />
              <span className="font-medium">{formData.category}</span>
            </div>
          )}

          {formData.publishedAt && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5" />
              <span>{formatDate(formData.publishedAt)}</span>
            </div>
          )}

          {formData.url && (
            <a
              href={formData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <LinkIcon className="h-4 w-4 mr-1.5" />
              <span>查看原文</span>
            </a>
          )}
        </div>

        {/* 标签 */}
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 描述 */}
        {formData.description && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 leading-relaxed">{formData.description}</p>
          </div>
        )}

        {/* 正文内容 */}
        {formData.content ? (
          <div
            className="prose prose-sm max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-pre:bg-gray-800 prose-pre:text-gray-100"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>暂无正文内容</p>
            </div>
          </div>
        )}
      </div>

      {/* 预览页脚 */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">这是内容在发布后的展示效果预览</p>
      </div>
    </div>
  );
};

export default ContentPreview;

