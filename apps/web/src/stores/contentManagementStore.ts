/**
 * Content Management Store
 * 手工内容管理的状态管理
 * Story 3.3: Manual Content Management
 */

import { create } from 'zustand';

interface ContentManagementState {
  // 表单状态
  formData: {
    title: string;
    description: string;
    content: string;
    url: string;
    category: string;
    tags: string[];
    sourceId?: string;
    customSource?: {
      name: string;
      domain: string;
    };
    publishedAt?: Date;
    reviewStatus: string;
  };
  
  // UI 状态
  isEditing: boolean;
  isSaving: boolean;
  showPreview: boolean;
  activeTab: 'edit' | 'preview';
  
  // 模板
  templates: any[];
  selectedTemplateId: string | null;
  
  // URL 导入
  isImporting: boolean;
  importedData: any | null;
  
  // 批量导入
  batchImportStatus: {
    batchId: string | null;
    status: string | null;
    totalItems: number;
    successCount: number;
    failedCount: number;
  };
  
  // 验证
  validation: {
    valid: boolean;
    issues: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string }>;
    suggestions: string[];
  } | null;
  
  // Actions
  setFormData: (data: Partial<ContentManagementState['formData']>) => void;
  resetForm: () => void;
  setIsEditing: (editing: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setShowPreview: (show: boolean) => void;
  setActiveTab: (tab: 'edit' | 'preview') => void;
  setTemplates: (templates: any[]) => void;
  setSelectedTemplateId: (id: string | null) => void;
  applyTemplate: (template: any) => void;
  setIsImporting: (importing: boolean) => void;
  setImportedData: (data: any | null) => void;
  setBatchImportStatus: (status: Partial<ContentManagementState['batchImportStatus']>) => void;
  setValidation: (validation: ContentManagementState['validation']) => void;
}

const initialFormData = {
  title: '',
  description: '',
  content: '',
  url: '',
  category: '',
  tags: [],
  reviewStatus: 'DRAFT',
};

export const useContentManagementStore = create<ContentManagementState>((set) => ({
  // 初始状态
  formData: initialFormData,
  isEditing: false,
  isSaving: false,
  showPreview: false,
  activeTab: 'edit',
  templates: [],
  selectedTemplateId: null,
  isImporting: false,
  importedData: null,
  batchImportStatus: {
    batchId: null,
    status: null,
    totalItems: 0,
    successCount: 0,
    failedCount: 0,
  },
  validation: null,
  
  // Actions
  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),
  
  resetForm: () =>
    set({
      formData: initialFormData,
      isEditing: false,
      selectedTemplateId: null,
      importedData: null,
      validation: null,
    }),
  
  setIsEditing: (editing) => set({ isEditing: editing }),
  
  setIsSaving: (saving) => set({ isSaving: saving }),
  
  setShowPreview: (show) => set({ showPreview: show }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setTemplates: (templates) => set({ templates }),
  
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
  
  applyTemplate: (template) =>
    set((state) => ({
      formData: {
        ...state.formData,
        category: template.category || state.formData.category,
        tags: template.template?.tags || state.formData.tags,
        ...template.template?.defaultValues,
      },
      selectedTemplateId: template.id,
    })),
  
  setIsImporting: (importing) => set({ isImporting: importing }),
  
  setImportedData: (data) => set({ importedData: data }),
  
  setBatchImportStatus: (status) =>
    set((state) => ({
      batchImportStatus: { ...state.batchImportStatus, ...status },
    })),
  
  setValidation: (validation) => set({ validation }),
}));

