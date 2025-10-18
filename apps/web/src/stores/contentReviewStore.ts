/**
 * Content Review Store
 * Story 3.1: 内容审核工作台界面
 * 
 * 使用 Zustand 管理审核工作台的状态
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 审核状态类型
export type ContentReviewStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';

// 内容项接口
export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  imageUrl?: string;
  category?: string;
  tags: string[];
  reviewStatus: ContentReviewStatus;
  score?: number;
  sourceId: string;
  source?: {
    id: string;
    name: string;
    url?: string;
  };
  contentScore?: {
    totalScore: number;
    timelinessScore: number;
    authorityScore: number;
    qualityScore: number;
    relevanceScore: number;
    aiImportanceScore: number;
    engagementScore: number;
    explanation?: string;
  };
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 筛选参数
export interface FilterParams {
  status?: ContentReviewStatus[];
  category?: string;
  sourceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'score' | 'title' | 'reviewedAt';
  sortOrder?: 'asc' | 'desc';
}

// 统计数据
export interface ReviewStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  publishedCount: number;
}

// Store 状态接口
interface ContentReviewState {
  // 数据
  items: ContentItem[];
  selectedIds: Set<string>;
  currentItem: ContentItem | null;
  
  // 分页
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  
  // 筛选
  filters: FilterParams;
  
  // 统计
  stats: ReviewStats;
  
  // UI状态
  loading: boolean;
  error: string | null;
  isEditorOpen: boolean;
  editingItem: ContentItem | null;
  
  // Actions
  setItems: (items: ContentItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setFilters: (filters: Partial<FilterParams>) => void;
  setStats: (stats: ReviewStats) => void;
  
  // 选择操作
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // 编辑器操作
  openEditor: (item: ContentItem) => void;
  closeEditor: () => void;
  
  // 内容操作
  updateItemStatus: (id: string, status: ContentReviewStatus) => void;
  updateItemDetails: (id: string, updates: Partial<ContentItem>) => void;
  removeItem: (id: string) => void;
  
  // 重置
  reset: () => void;
}

const initialState = {
  items: [],
  selectedIds: new Set<string>(),
  currentItem: null,
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  filters: {
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
  },
  stats: {
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    publishedCount: 0,
  },
  loading: false,
  error: null,
  isEditorOpen: false,
  editingItem: null,
};

export const useContentReviewStore = create<ContentReviewState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 设置数据
      setItems: (items) => set({ items }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setPage: (page) => set({ page }),
      
      setFilters: (filters) => 
        set((state) => ({ 
          filters: { ...state.filters, ...filters },
          page: 1 // 重置到第一页
        })),
      
      setStats: (stats) => set({ stats }),

      // 选择操作
      toggleSelect: (id) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);
          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
          } else {
            newSelectedIds.add(id);
          }
          return { selectedIds: newSelectedIds };
        }),

      selectAll: () =>
        set((state) => ({
          selectedIds: new Set(state.items.map((item) => item.id)),
        })),

      clearSelection: () => set({ selectedIds: new Set() }),

      // 编辑器操作
      openEditor: (item) =>
        set({
          isEditorOpen: true,
          editingItem: item,
        }),

      closeEditor: () =>
        set({
          isEditorOpen: false,
          editingItem: null,
        }),

      // 内容操作
      updateItemStatus: (id, status) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, reviewStatus: status } : item
          ),
        })),

      updateItemDetails: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          total: state.total - 1,
        })),

      // 重置
      reset: () => set(initialState),
    }),
    {
      name: 'content-review-store',
    }
  )
);

