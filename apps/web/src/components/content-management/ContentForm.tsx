/**
 * Content Form Component
 * 内容表单组件
 * Story 3.3: Manual Content Management
 */

'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { useContentManagementStore } from '@/stores/contentManagementStore';
import RichTextEditor from './RichTextEditor';

// 表单验证 schema
const contentSchema = z.object({
  title: z.string().min(10, '标题至少需要10个字符').max(200, '标题最多200个字符'),
  description: z.string().optional(),
  content: z.string().optional(),
  url: z.string().url('请输入有效的URL').optional().or(z.literal('')),
  category: z.string().min(1, '请选择分类'),
  tags: z.array(z.string()).default([]),
  reviewStatus: z.string().default('DRAFT'),
});

type ContentFormData = z.infer<typeof contentSchema>;

interface ContentFormProps {
  onSubmit: (data: ContentFormData) => void;
  isSubmitting?: boolean;
}

const CATEGORIES = [
  { value: 'AI', label: 'AI技术' },
  { value: 'TECH', label: '科技新闻' },
  { value: 'FINANCE', label: '金融市场' },
  { value: 'TECH_COMPANY', label: '科技公司' },
  { value: 'PRODUCT', label: '产品发布' },
  { value: 'GENERAL', label: '综合' },
];

const REVIEW_STATUS = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PENDING_REVIEW', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
];

export const ContentForm: React.FC<ContentFormProps> = ({ onSubmit, isSubmitting = false }) => {
  const { formData } = useContentManagementStore();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: formData,
  });

  // 标签输入处理
  const [tagInput, setTagInput] = React.useState('');
  const currentTags = watch('tags') || [];

  const handleAddTag = () => {
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      const newTags = [...currentTags, tagInput.trim()];
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = currentTags.filter((tag) => tag !== tagToRemove);
    setValue('tags', newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 标题 */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          标题 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title')}
          type="text"
          id="title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="输入新闻标题..."
        />
        {errors.title && (
          <div className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.title.message}
          </div>
        )}
      </div>

      {/* 描述 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          描述/摘要
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="简要描述内容..."
        />
      </div>

      {/* 正文内容 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">正文内容</label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <RichTextEditor value={field.value || ''} onChange={field.onChange} height="300px" />
          )}
        />
      </div>

      {/* URL */}
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
          原文链接
        </label>
        <input
          {...register('url')}
          type="url"
          id="url"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/article"
        />
        {errors.url && (
          <div className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.url.message}
          </div>
        )}
      </div>

      {/* 分类和状态 - 两列布局 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 分类 */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            分类 <span className="text-red-500">*</span>
          </label>
          <select
            {...register('category')}
            id="category"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">选择分类</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.category.message}
            </div>
          )}
        </div>

        {/* 审核状态 */}
        <div>
          <label htmlFor="reviewStatus" className="block text-sm font-medium text-gray-700 mb-1">
            审核状态
          </label>
          <select
            {...register('reviewStatus')}
            id="reviewStatus"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {REVIEW_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 标签 */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          标签
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="输入标签后按回车添加..."
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            添加
          </button>
        </div>
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setValue('reviewStatus', 'DRAFT')}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          保存草稿
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              保存中...
            </>
          ) : (
            '发布内容'
          )}
        </button>
      </div>
    </form>
  );
};

export default ContentForm;

