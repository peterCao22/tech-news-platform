/**
 * URL Importer Component
 * URL导入组件
 * Story 3.3: Manual Content Management
 */

'use client';

import React, { useState } from 'react';
import { X, Link as LinkIcon, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { contentManagementService } from '@/services/contentManagementService';
import { useContentManagementStore } from '@/stores/contentManagementStore';

interface URLImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (data: any) => void;
}

export const URLImporter: React.FC<URLImporterProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const { setFormData, setImportedData } = useContentManagementStore();

  if (!isOpen) return null;

  const handleFetchUrl = async () => {
    if (!url.trim()) {
      setError('请输入有效的URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const response = await contentManagementService.importFromUrl(url, false);
      
      if (response.success && response.data.data) {
        setPreviewData(response.data.data);
      } else {
        setError('无法抓取URL内容');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '抓取失败，请检查URL是否有效');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (previewData) {
      setFormData({
        title: previewData.title || '',
        description: previewData.description || '',
        content: previewData.content || '',
        url: url,
      });
      setImportedData(previewData);
      
      if (onImportSuccess) {
        onImportSuccess(previewData);
      }
      
      handleClose();
    }
  };

  const handleAutoCreate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await contentManagementService.importFromUrl(url, true);
      
      if (response.success) {
        if (onImportSuccess) {
          onImportSuccess(response.data.content);
        }
        handleClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '自动创建失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setError(null);
    setPreviewData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* 背景遮罩 */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

        {/* 弹窗内容 */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">从URL导入</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* URL输入 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">网页URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                  placeholder="https://example.com/article"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      抓取中...
                    </>
                  ) : (
                    '抓取'
                  )}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* 预览数据 */}
            {previewData && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">成功抓取内容</span>
                </div>

                <div className="space-y-3">
                  {/* 标题 */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">标题</div>
                    <div className="text-sm text-gray-900 font-medium">{previewData.title}</div>
                  </div>

                  {/* 描述 */}
                  {previewData.description && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">描述</div>
                      <div className="text-sm text-gray-700 line-clamp-3">{previewData.description}</div>
                    </div>
                  )}

                  {/* 元数据 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {previewData.author && (
                      <div>
                        <span className="text-gray-500">作者：</span>
                        <span className="text-gray-900">{previewData.author}</span>
                      </div>
                    )}
                    {previewData.metadata?.domain && (
                      <div>
                        <span className="text-gray-500">来源：</span>
                        <span className="text-gray-900">{previewData.metadata.domain}</span>
                      </div>
                    )}
                    {previewData.publishedAt && (
                      <div>
                        <span className="text-gray-500">发布时间：</span>
                        <span className="text-gray-900">
                          {new Date(previewData.publishedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    )}
                    {previewData.images && previewData.images.length > 0 && (
                      <div>
                        <span className="text-gray-500">图片：</span>
                        <span className="text-gray-900">{previewData.images.length} 张</span>
                      </div>
                    )}
                  </div>

                  {/* 内容长度 */}
                  {previewData.content && (
                    <div className="text-xs text-gray-500">
                      正文长度：约 {Math.round(previewData.content.length / 2)} 字
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            {previewData && (
              <>
                <button
                  onClick={handleApplyToForm}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  应用到表单
                </button>
                <button
                  onClick={handleAutoCreate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  直接创建
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default URLImporter;

