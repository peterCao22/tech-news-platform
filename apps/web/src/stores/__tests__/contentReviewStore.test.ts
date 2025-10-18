/**
 * Content Review Store Tests
 * Story 3.1: 内容审核工作台
 */

/// <reference types="jest" />

import { useContentReviewStore } from '../contentReviewStore';
import type { ContentItem, ContentReviewStatus } from '../contentReviewStore';

// Mock content item
const mockContent: ContentItem = {
  id: '1',
  title: 'Test Content',
  description: 'Test Description',
  url: 'https://example.com',
  reviewStatus: 'PENDING_REVIEW',
  sourceId: 'source-1',
  source: {
    id: 'source-1',
    name: 'Test Source',
  },
  tags: ['test', 'mock'],
  createdAt: '2025-10-14T00:00:00Z',
  updatedAt: '2025-10-14T00:00:00Z',
};

describe('contentReviewStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useContentReviewStore.getState().reset();
  });

  describe('setItems', () => {
    it('should set items correctly', () => {
      const { setItems, items } = useContentReviewStore.getState();
      
      setItems([mockContent]);
      
      expect(useContentReviewStore.getState().items).toHaveLength(1);
      expect(useContentReviewStore.getState().items[0]).toEqual(mockContent);
    });
  });

  describe('selection operations', () => {
    beforeEach(() => {
      useContentReviewStore.getState().setItems([mockContent]);
    });

    it('should toggle selection', () => {
      const { toggleSelect, selectedIds } = useContentReviewStore.getState();
      
      toggleSelect('1');
      expect(useContentReviewStore.getState().selectedIds.has('1')).toBe(true);
      
      toggleSelect('1');
      expect(useContentReviewStore.getState().selectedIds.has('1')).toBe(false);
    });

    it('should select all items', () => {
      const { selectAll, selectedIds } = useContentReviewStore.getState();
      
      selectAll();
      expect(useContentReviewStore.getState().selectedIds.size).toBe(1);
      expect(useContentReviewStore.getState().selectedIds.has('1')).toBe(true);
    });

    it('should clear selection', () => {
      const { toggleSelect, clearSelection, selectedIds } = useContentReviewStore.getState();
      
      toggleSelect('1');
      expect(useContentReviewStore.getState().selectedIds.size).toBe(1);
      
      clearSelection();
      expect(useContentReviewStore.getState().selectedIds.size).toBe(0);
    });
  });

  describe('filter operations', () => {
    it('should set filters', () => {
      const { setFilters } = useContentReviewStore.getState();
      
      setFilters({ category: 'AI', sortBy: 'score' });
      
      const filters = useContentReviewStore.getState().filters;
      expect(filters.category).toBe('AI');
      expect(filters.sortBy).toBe('score');
    });

    it('should reset page when setting filters', () => {
      const { setPage, setFilters } = useContentReviewStore.getState();
      
      setPage(3);
      expect(useContentReviewStore.getState().page).toBe(3);
      
      setFilters({ category: 'Tech' });
      expect(useContentReviewStore.getState().page).toBe(1);
    });
  });

  describe('editor operations', () => {
    beforeEach(() => {
      useContentReviewStore.getState().setItems([mockContent]);
    });

    it('should open editor', () => {
      const { openEditor } = useContentReviewStore.getState();
      
      openEditor(mockContent);
      
      expect(useContentReviewStore.getState().isEditorOpen).toBe(true);
      expect(useContentReviewStore.getState().editingItem).toEqual(mockContent);
    });

    it('should close editor', () => {
      const { openEditor, closeEditor } = useContentReviewStore.getState();
      
      openEditor(mockContent);
      closeEditor();
      
      expect(useContentReviewStore.getState().isEditorOpen).toBe(false);
      expect(useContentReviewStore.getState().editingItem).toBeNull();
    });
  });

  describe('content operations', () => {
    beforeEach(() => {
      useContentReviewStore.getState().setItems([mockContent]);
    });

    it('should update item status', () => {
      const { updateItemStatus } = useContentReviewStore.getState();
      
      updateItemStatus('1', 'APPROVED');
      
      const item = useContentReviewStore.getState().items[0];
      expect(item.reviewStatus).toBe('APPROVED');
    });

    it('should update item details', () => {
      const { updateItemDetails } = useContentReviewStore.getState();
      
      updateItemDetails('1', { title: 'Updated Title' });
      
      const item = useContentReviewStore.getState().items[0];
      expect(item.title).toBe('Updated Title');
    });

    it('should remove item', () => {
      const { removeItem } = useContentReviewStore.getState();
      
      removeItem('1');
      
      expect(useContentReviewStore.getState().items).toHaveLength(0);
    });
  });

  describe('stats', () => {
    it('should set stats', () => {
      const { setStats } = useContentReviewStore.getState();
      
      const stats = {
        pendingCount: 10,
        approvedCount: 5,
        rejectedCount: 2,
        publishedCount: 3,
      };
      
      setStats(stats);
      
      expect(useContentReviewStore.getState().stats).toEqual(stats);
    });
  });

  describe('loading and error states', () => {
    it('should set loading state', () => {
      const { setLoading } = useContentReviewStore.getState();
      
      setLoading(true);
      expect(useContentReviewStore.getState().loading).toBe(true);
      
      setLoading(false);
      expect(useContentReviewStore.getState().loading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useContentReviewStore.getState();
      
      setError('Test error');
      expect(useContentReviewStore.getState().error).toBe('Test error');
      
      setError(null);
      expect(useContentReviewStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { setItems, toggleSelect, setFilters, setLoading, setError, reset } = 
        useContentReviewStore.getState();
      
      // Modify state
      setItems([mockContent]);
      toggleSelect('1');
      setFilters({ category: 'Test' });
      setLoading(true);
      setError('Error');
      
      // Reset
      reset();
      
      // Check all state is reset
      const state = useContentReviewStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.selectedIds.size).toBe(0);
      expect(state.filters.category).toBeUndefined();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});

