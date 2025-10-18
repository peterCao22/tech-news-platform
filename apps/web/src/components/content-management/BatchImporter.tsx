/**
 * Batch Importer Component
 * 批量导入组件
 * Story 3.3: Manual Content Management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import { contentManagementService } from '@/services/contentManagementService';

interface BatchImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: any) => void;
}

export const BatchImporter: React.FC<BatchImporterProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [importType, setImportType] = useState<'urls' | 'text'>('urls');
  const [urlList, setUrlList] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('GENERAL');
  const [defaultTags, setDefaultTags] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  
  const [isImporting, setIsImporting] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 轮询导入状态
  useEffect(() => {
    if (!batchId) return;

    const checkStatus = async () => {
      try {
        const response = await contentManagementService.getBatchImportStatus(batchId);
        setImportStatus(response.data);

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          setIsImporting(false);
          if (onImportComplete) {
            onImportComplete(response.data);
          }
        }
      } catch (err) {
        console.error('查询导入状态失败:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000); // 每2秒查询一次

    return () => clearInterval(interval);
  }, [batchId, onImportComplete]);

  if (!isOpen) return null;

  const handleStartImport = async () => {
    const urls = urlList
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && line.startsWith('http'));

    if (urls.length === 0) {
      setError('请输入至少一个有效的URL');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportStatus(null);

    try {
      const tags = defaultTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      const response = await contentManagementService.batchImportUrls(urls, {
        autoApprove,
        defaultCategory,
        defaultTags: tags,
      });

      if (response.success && response.data.id) {
        setBatchId(response.data.id);
        setImportStatus(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '批量导入失败');
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setUrlList('');
    setError(null);
    setImportStatus(null);
    setBatchId(null);
    setIsImporting(false);
    onClose();
  };

  const urlCount = urlList
    .split('\n')
    .filter((line) => line.trim() && line.trim().startsWith('http')).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* 背景遮罩 */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

        {/* 弹窗内容 */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">批量导入</h3>
            </div>
            <button
              onClick={handleClose}
              disabled={isImporting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!isImporting && !importStatus && (
              <>
                {/* URL列表输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL列表（每行一个）
                  </label>
                  <textarea
                    value={urlList}
                    onChange={(e) => setUrlList(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder={'https://example.com/article1\nhttps://example.com/article2\nhttps://example.com/article3'}
                  />
                  <div className="mt-1 text-sm text-gray-500">
                    检测到 <span className="font-medium text-gray-900">{urlCount}</span> 个有效URL
                  </div>
                </div>

                {/* 导入选项 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">默认分类</label>
                    <select
                      value={defaultCategory}
                      onChange={(e) => setDefaultCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="AI">AI技术</option>
                      <option value="TECH">科技新闻</option>
                      <option value="FINANCE">金融市场</option>
                      <option value="TECH_COMPANY">科技公司</option>
                      <option value="PRODUCT">产品发布</option>
                      <option value="GENERAL">综合</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      默认标签（逗号分隔）
                    </label>
                    <input
                      type="text"
                      value={defaultTags}
                      onChange={(e) => setDefaultTags(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="科技, 新闻"
                    />
                  </div>
                </div>

                {/* 自动审核 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoApprove"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoApprove" className="ml-2 block text-sm text-gray-700">
                    自动通过审核（直接设为"已通过"状态）
                  </label>
                </div>
              </>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                <XCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* 导入进度 */}
            {importStatus && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {importStatus.status === 'processing' && (
                      <Loader className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
                    )}
                    {importStatus.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    )}
                    {importStatus.status === 'failed' && (
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className="font-medium text-gray-900">
                      {importStatus.status === 'processing' && '正在导入...'}
                      {importStatus.status === 'completed' && '导入完成'}
                      {importStatus.status === 'failed' && '导入失败'}
                    </span>
                  </div>
                </div>

                {/* 进度统计 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{importStatus.totalItems}</div>
                    <div className="text-xs text-gray-500">总数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importStatus.successCount}</div>
                    <div className="text-xs text-gray-500">成功</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importStatus.failedCount}</div>
                    <div className="text-xs text-gray-500">失败</div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((importStatus.successCount + importStatus.failedCount) / importStatus.totalItems) * 100}%`,
                    }}
                  />
                </div>

                {/* 错误日志 */}
                {importStatus.errorLog && importStatus.failedCount > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center text-sm font-medium text-yellow-800 mb-2">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      导入错误详情
                    </div>
                    <div className="text-xs text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                      {Array.isArray(importStatus.errorLog) &&
                        importStatus.errorLog.map((log: any, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span className="truncate flex-1">{log.url || log.item}</span>
                            <span className="text-yellow-600 ml-2">{log.error}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            {!isImporting && !importStatus && (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleStartImport}
                  disabled={urlCount === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  开始导入
                </button>
              </>
            )}
            {(importStatus?.status === 'completed' || importStatus?.status === 'failed') && (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchImporter;

