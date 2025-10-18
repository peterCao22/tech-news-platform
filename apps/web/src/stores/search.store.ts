/**
 * Story 4.2: 高级搜索与筛选 - Zustand状态管理
 * 
 * 负责管理搜索页面的状态：
 * - 搜索关键词和查询历史
 * - 搜索结果列表
 * - 筛选条件（日期、来源、分类、评分）
 * - 分页和排序
 * - 筛选选项列表
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  score: number;
  publishedAt: string;
  createdAt: string;
  category: string;
  source: {
    id: string;
    name: string;
    url: string;
  } | null;
  highlights?: {
    title?: string;
    description?: string;
    content?: string;
  };
}

interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  sources?: string[];
  categories?: string[];
  scoreMin?: number;
  scoreMax?: number;
}

interface SearchState {
  // 搜索关键词
  query: string;
  setQuery: (query: string) => void;
  
  // 搜索历史 (持久化)
  searchHistory: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  
  // 搜索结果
  results: SearchResult[];
  setResults: (results: SearchResult[]) => void;
  
  // 分页
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // 排序
  sortBy: 'relevance' | 'date' | 'score';
  sortOrder: 'asc' | 'desc';
  setSorting: (sortBy: string, sortOrder: string) => void;
  
  // 筛选条件
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  
  // 筛选选项（来源、分类列表）
  availableSources: Array<{ id: string; name: string; count: number }>;
  availableCategories: Array<{ name: string; count: number }>;
  setFilterOptions: (sources: any[], categories: any[]) => void;
  
  // 加载状态
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // 搜索性能
  searchTime: number;
  setSearchTime: (time: number) => void;
  
  // 高级搜索展开状态
  isAdvancedOpen: boolean;
  toggleAdvanced: () => void;
  
  // 重置状态
  reset: () => void;
}

const initialState = {
  query: '',
  searchHistory: [],
  results: [],
  currentPage: 1,
  totalPages: 0,
  totalResults: 0,
  pageSize: 20,
  sortBy: 'relevance' as const,
  sortOrder: 'desc' as const,
  filters: {},
  availableSources: [],
  availableCategories: [],
  isLoading: false,
  searchTime: 0,
  isAdvancedOpen: false,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setQuery: (query) => set({ query }),
      
      addToHistory: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        
        const { searchHistory } = get();
        // 去重，最多保留20条历史
        const newHistory = [
          trimmed,
          ...searchHistory.filter(q => q !== trimmed)
        ].slice(0, 20);
        
        set({ searchHistory: newHistory });
      },
      
      clearHistory: () => set({ searchHistory: [] }),
      
      setResults: (results) => set({ results }),
      
      setPage: (page) => set({ currentPage: page }),
      
      setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
      
      setSorting: (sortBy, sortOrder) => set({ 
        sortBy: sortBy as any, 
        sortOrder: sortOrder as any,
        currentPage: 1 
      }),
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
        currentPage: 1
      })),
      
      clearFilters: () => set({ filters: {}, currentPage: 1 }),
      
      setFilterOptions: (sources, categories) => set({
        availableSources: sources,
        availableCategories: categories
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setSearchTime: (time) => set({ searchTime: time }),
      
      toggleAdvanced: () => set((state) => ({ 
        isAdvancedOpen: !state.isAdvancedOpen 
      })),
      
      reset: () => set({
        ...initialState,
        searchHistory: get().searchHistory, // 保留搜索历史
      }),
    }),
    {
      name: 'search-storage',
      // 只持久化搜索历史
      partialize: (state) => ({ 
        searchHistory: state.searchHistory 
      }),
    }
  )
);

