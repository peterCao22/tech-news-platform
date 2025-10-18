/**
 * Filter Rules Store
 * Story 3.2: Intelligent Filter Rules
 * 
 * Zustand store for managing filter rules state
 */

import { create } from 'zustand';

export interface FilterRule {
  id: string;
  name: string;
  description?: string;
  ruleType: RuleType;
  status: RuleStatus;
  priority: number;
  config: any;
  version: number;
  isPublished: boolean;
  publishedAt?: string;
  publishedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export type RuleType = 
  | 'KEYWORD_BOOST'
  | 'KEYWORD_PENALTY' 
  | 'SOURCE_WHITELIST'
  | 'SOURCE_BLACKLIST'
  | 'CATEGORY_BOOST'
  | 'CATEGORY_PENALTY'
  | 'CUSTOM';

export type RuleStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface RuleVersion {
  id: string;
  ruleId: string;
  version: number;
  config: any;
  changeLog?: string;
  createdBy: string;
  createdAt: string;
}

export interface SourceListItem {
  id: string;
  listType: 'WHITELIST' | 'BLACKLIST';
  sourceId?: string;
  sourceName: string;
  sourceDomain?: string;
  weight: number;
  reason?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface RuleTestResult {
  contentId: string;
  title: string;
  originalScore: number;
  newScore: number;
  scoreChange: number;
  adjustments: Array<{
    ruleId: string;
    ruleName: string;
    adjustment: number;
    reason: string;
  }>;
}

interface FilterRulesState {
  // Rules list
  rules: FilterRule[];
  currentRule: FilterRule | null;
  loading: boolean;
  error: string | null;
  
  // Filters and pagination
  filters: {
    type?: RuleType;
    status?: RuleStatus;
    search?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Rule editor
  isEditorOpen: boolean;
  editorMode: 'create' | 'edit' | 'view';
  
  // Rule test/preview
  testResults: RuleTestResult[];
  isTestLoading: boolean;
  
  // Rule versions
  versions: RuleVersion[];
  isVersionsLoading: boolean;
  
  // Source lists
  sourceLists: SourceListItem[];
  isSourceListsLoading: boolean;
  
  // Actions
  setRules: (rules: FilterRule[], total?: number) => void;
  setCurrentRule: (rule: FilterRule | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FilterRulesState['filters']>) => void;
  setPagination: (pagination: Partial<FilterRulesState['pagination']>) => void;
  openEditor: (mode: 'create' | 'edit' | 'view', rule?: FilterRule) => void;
  closeEditor: () => void;
  setTestResults: (results: RuleTestResult[]) => void;
  setTestLoading: (loading: boolean) => void;
  setVersions: (versions: RuleVersion[]) => void;
  setVersionsLoading: (loading: boolean) => void;
  setSourceLists: (lists: SourceListItem[]) => void;
  setSourceListsLoading: (loading: boolean) => void;
  addRule: (rule: FilterRule) => void;
  updateRule: (ruleId: string, updates: Partial<FilterRule>) => void;
  removeRule: (ruleId: string) => void;
  resetFilters: () => void;
}

const initialFilters = {
  type: undefined,
  status: undefined,
  search: undefined,
};

const initialPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export const useFilterRulesStore = create<FilterRulesState>((set) => ({
  // Initial state
  rules: [],
  currentRule: null,
  loading: false,
  error: null,
  filters: initialFilters,
  pagination: initialPagination,
  isEditorOpen: false,
  editorMode: 'view',
  testResults: [],
  isTestLoading: false,
  versions: [],
  isVersionsLoading: false,
  sourceLists: [],
  isSourceListsLoading: false,
  
  // Actions
  setRules: (rules, total) => set((state) => ({
    rules,
    pagination: total !== undefined 
      ? {
          ...state.pagination,
          total,
          totalPages: Math.ceil(total / state.pagination.limit),
        }
      : state.pagination,
  })),
  
  setCurrentRule: (rule) => set({ currentRule: rule }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
    pagination: { ...state.pagination, page: 1 }, // Reset to first page on filter change
  })),
  
  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination },
  })),
  
  openEditor: (mode, rule) => set({
    isEditorOpen: true,
    editorMode: mode,
    currentRule: rule || null,
  }),
  
  closeEditor: () => set({
    isEditorOpen: false,
    currentRule: null,
  }),
  
  setTestResults: (results) => set({ testResults: results }),
  
  setTestLoading: (loading) => set({ isTestLoading: loading }),
  
  setVersions: (versions) => set({ versions }),
  
  setVersionsLoading: (loading) => set({ isVersionsLoading: loading }),
  
  setSourceLists: (lists) => set({ sourceLists: lists }),
  
  setSourceListsLoading: (loading) => set({ isSourceListsLoading: loading }),
  
  addRule: (rule) => set((state) => ({
    rules: [rule, ...state.rules],
    pagination: {
      ...state.pagination,
      total: state.pagination.total + 1,
      totalPages: Math.ceil((state.pagination.total + 1) / state.pagination.limit),
    },
  })),
  
  updateRule: (ruleId, updates) => set((state) => ({
    rules: state.rules.map((rule) =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ),
    currentRule: state.currentRule?.id === ruleId
      ? { ...state.currentRule, ...updates }
      : state.currentRule,
  })),
  
  removeRule: (ruleId) => set((state) => ({
    rules: state.rules.filter((rule) => rule.id !== ruleId),
    pagination: {
      ...state.pagination,
      total: state.pagination.total - 1,
      totalPages: Math.ceil((state.pagination.total - 1) / state.pagination.limit),
    },
  })),
  
  resetFilters: () => set({
    filters: initialFilters,
    pagination: initialPagination,
  }),
}));

