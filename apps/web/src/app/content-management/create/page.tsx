/**
 * Manual Content Creator Page
 * 手工内容创建页面
 * Story 3.3: Manual Content Management
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FileText, Eye, Link as LinkIcon, Upload, Layers } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  ContentForm,
  URLImporter,
  BatchImporter,
  TemplateSelector,
} from '@/components/content-management';
import { useContentManagementStore } from '@/stores/contentManagementStore';
import { contentManagementService } from '@/services/contentManagementService';

export default function ManualContentCreatorPage() {
  const router = useRouter();
  const { activeTab, setActiveTab, resetForm } = useContentManagementStore();

  const [isSaving, setIsSaving] = useState(false);
  const [showUrlImporter, setShowUrlImporter] = useState(false);
  const [showBatchImporter, setShowBatchImporter] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSaving(true);

    try {
      const response = await contentManagementService.createContent(data);

      if (response.success) {
        toast.success('✅ 内容创建成功！正在跳转到审核页面...');
        resetForm();
        
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          router.push('/review');
        }, 1500);
      } else {
        toast.error('创建失败，请重试');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '创建内容失败';
      toast.error(errorMessage);
      console.error('创建内容错误:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUrlImportSuccess = (data: any) => {
    toast.success('URL导入成功！内容已自动填充到表单');
    setShowUrlImporter(false);
  };

  const handleBatchImportComplete = (result: any) => {
    if (result.status === 'completed') {
      toast.success(
        `批量导入完成！成功 ${result.successCount} 个，失败 ${result.failedCount} 个`
      );
    } else {
      toast.error('批量导入失败');
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">创建内容</h1>
              <p className="mt-2 text-sm text-gray-600">
                手动创建、编辑新闻内容，或从URL批量导入
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
              >
                <Layers className="h-4 w-4 mr-2" />
                使用模板
              </button>
              <button
                onClick={() => setShowUrlImporter(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                URL导入
              </button>
              <button
                onClick={() => setShowBatchImporter(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                批量导入
              </button>
            </div>
          </div>
        </div>

        {/* 模板选择器（可折叠） */}
        {showTemplateSelector && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <TemplateSelector
              onTemplateSelect={() => {
                toast.success('模板已应用到表单');
                setShowTemplateSelector(false);
              }}
            />
          </div>
        )}

        {/* 主内容区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 标签页 */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'edit'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                编辑
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'preview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                预览
              </button>
            </nav>
          </div>

          {/* 内容区域 */}
          <div className="p-6">
            {activeTab === 'edit' && (
              <ContentForm onSubmit={handleSubmit} isSubmitting={isSaving} />
            )}
            {activeTab === 'preview' && (
              <div className="text-center py-12 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">预览功能</p>
                <p className="text-sm">
                  提交表单后可在内容审核页面查看完整预览
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>支持富文本编辑、URL导入、批量导入和模板功能</p>
        </div>
      </div>

      {/* 弹窗组件 */}
      <URLImporter
        isOpen={showUrlImporter}
        onClose={() => setShowUrlImporter(false)}
        onImportSuccess={handleUrlImportSuccess}
      />

      <BatchImporter
        isOpen={showBatchImporter}
        onClose={() => setShowBatchImporter(false)}
        onImportComplete={handleBatchImportComplete}
      />
      </div>
    </DashboardLayout>
  );
}

