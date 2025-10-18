/**
 * Content Editor Component
 * Story 3.1: 内容审核工作台
 * 
 * 内容编辑器组件，用于编辑内容详情
 */

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Save,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  Tag as TagIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { StatusBadge } from './StatusBadge';
import type { ContentItem } from '../../stores/contentReviewStore';

interface ContentEditorProps {
  content: ContentItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ContentItem>) => Promise<void>;
  readOnly?: boolean;
}

// 表单验证模式
const contentSchema = z.object({
  title: z.string().min(5, '标题至少5个字符').max(200, '标题最多200个字符'),
  description: z.string().max(500, '描述最多500个字符').optional(),
  content: z.string().optional(),
  url: z.string().url('请输入有效的URL').optional().or(z.literal('')),
  imageUrl: z.string().url('请输入有效的图片URL').optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.string().optional(), // 逗号分隔的标签字符串
  reviewStatus: z.string().optional(), // 审核状态
});

type ContentFormData = z.infer<typeof contentSchema>;

export const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  isOpen,
  onClose,
  onSave,
  readOnly = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: content.title,
      description: content.description || '',
      content: content.content || '',
      url: content.url || '',
      imageUrl: content.imageUrl || '',
      category: content.category || '',
      tags: content.tags?.join(', ') || '',
      reviewStatus: content.reviewStatus || 'DRAFT',
    },
  });

  // 监听表单值变化
  const formValues = watch();

  // 当内容变化时重置表单
  useEffect(() => {
    reset({
      title: content.title,
      description: content.description || '',
      content: content.content || '',
      url: content.url || '',
      imageUrl: content.imageUrl || '',
      category: content.category || '',
      tags: content.tags?.join(', ') || '',
      reviewStatus: content.reviewStatus || 'DRAFT',
    });
  }, [content, reset]);

  // 关闭时清理
  useEffect(() => {
    if (!isOpen) {
      setTagInput('');
    }
  }, [isOpen]);

  const onSubmit = async (data: ContentFormData) => {
    if (readOnly) return;

    setIsSaving(true);
    try {
      // 转换标签字符串为数组
      const tags = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      await onSave(content.id, {
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        imageUrl: data.imageUrl,
        category: data.category,
        tags,
        reviewStatus: data.reviewStatus as any,
      });

      toast.success('内容已更新');
      onClose();
    } catch (error: any) {
      toast.error(error.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !readOnly) {
      if (window.confirm('有未保存的更改，确定要关闭吗？')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleCancel}
      />

      {/* 编辑器面板 */}
      <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-hard z-50 flex flex-col animate-slide-left">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {readOnly ? '查看内容' : '编辑内容'}
            </h2>
            <StatusBadge status={content.reviewStatus} size="sm" />
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} id="content-edit-form" className="space-y-6">
            {/* 标题 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-error-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                disabled={readOnly}
                className={clsx(
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.title ? 'border-error-500' : 'border-gray-300',
                  readOnly && 'bg-gray-50 cursor-not-allowed'
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* 描述 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                disabled={readOnly}
                className={clsx(
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.description ? 'border-error-500' : 'border-gray-300',
                  readOnly && 'bg-gray-50 cursor-not-allowed'
                )}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formValues.description?.length || 0} / 500
              </p>
            </div>

            {/* 正文内容 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                正文内容
              </label>
              <textarea
                id="content"
                rows={8}
                {...register('content')}
                disabled={readOnly}
                className={clsx(
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm',
                  'border-gray-300',
                  readOnly && 'bg-gray-50 cursor-not-allowed'
                )}
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                原文链接
              </label>
              <input
                id="url"
                type="url"
                {...register('url')}
                disabled={readOnly}
                placeholder="https://example.com/article"
                className={clsx(
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.url ? 'border-error-500' : 'border-gray-300',
                  readOnly && 'bg-gray-50 cursor-not-allowed'
                )}
              />
              {errors.url && (
                <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.url.message}
                </p>
              )}
            </div>

            {/* 图片URL */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                封面图片
              </label>
              <input
                id="imageUrl"
                type="url"
                {...register('imageUrl')}
                disabled={readOnly}
                placeholder="https://example.com/image.jpg"
                className={clsx(
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.imageUrl ? 'border-error-500' : 'border-gray-300',
                  readOnly && 'bg-gray-50 cursor-not-allowed'
                )}
              />
              {errors.imageUrl && (
                <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.imageUrl.message}
                </p>
              )}
              {formValues.imageUrl && (
                <div className="mt-3">
                  <img
                    src={formValues.imageUrl}
                    alt="预览"
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* 分类 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <input
                id="category"
                type="text"
                {...register('category')}
                disabled={readOnly}
                placeholder="例如：人工智能、区块链"
                className={clsx(
                  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  readOnly && 'bg-gray-50 cursor-not-allowed'
                )}
              />
            </div>

            {/* 审核状态 */}
            <div>
              <label htmlFor="reviewStatus" className="block text-sm font-medium text-gray-700 mb-2">
                审核状态
              </label>
              <select
                id="reviewStatus"
                {...register('reviewStatus')}
                disabled={readOnly}
                className={clsx(
                  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  readOnly && 'bg-gray-50 cursor-not-allowed'
                )}
              >
                <option value="DRAFT">草稿</option>
                <option value="PENDING_REVIEW">待审核</option>
                <option value="APPROVED">已通过</option>
                <option value="REJECTED">已拒绝</option>
                <option value="PUBLISHED">已发布</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formValues.reviewStatus === 'DRAFT' && '草稿状态，需要提交审核后才能被审核人员处理'}
                {formValues.reviewStatus === 'PENDING_REVIEW' && '等待审核人员审核'}
                {formValues.reviewStatus === 'APPROVED' && '已通过审核，可以发布'}
                {formValues.reviewStatus === 'REJECTED' && '审核未通过，需要修改'}
                {formValues.reviewStatus === 'PUBLISHED' && '已发布，对外可见'}
              </p>
            </div>

            {/* 标签 */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                标签
              </label>
              <input
                id="tags"
                type="text"
                {...register('tags')}
                disabled={readOnly}
                placeholder="多个标签用逗号分隔，例如：AI, GPT-4, OpenAI"
                className={clsx(
                  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  readOnly && 'bg-gray-50 cursor-not-allowed'
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                使用逗号分隔多个标签
              </p>
            </div>

            {/* 元数据（只读） */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">元数据</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">内容ID</p>
                  <p className="text-gray-900 font-mono">{content.id}</p>
                </div>
                {content.source && (
                  <div>
                    <p className="text-gray-500">来源</p>
                    <p className="text-gray-900">{content.source.name}</p>
                  </div>
                )}
                {content.contentScore && (
                  <div>
                    <p className="text-gray-500">内容评分</p>
                    <p className="text-gray-900 font-semibold">
                      {content.contentScore.totalScore.toFixed(1)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">创建时间</p>
                  <p className="text-gray-900">
                    {new Date(content.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* 底部操作栏 */}
        {!readOnly && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              form="content-edit-form"
              disabled={isSaving || !isDirty}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存更改
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

