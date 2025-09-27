// 科技新闻聚合平台 - 认证状态管理测试
// 测试Zustand认证store的功能

import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth.store';

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置store状态
    useAuthStore.getState().logout();
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setUser', () => {
    it('应该设置用户并更新认证状态', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('setTokens', () => {
    it('应该设置访问令牌', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens('access-token', 'refresh-token');
      });

      expect(result.current.token).toBe('access-token');
      expect(result.current.refreshToken).toBe('refresh-token');
    });

    it('应该只更新访问令牌', () => {
      const { result } = renderHook(() => useAuthStore());

      // 先设置刷新令牌
      act(() => {
        result.current.setTokens('access-token-1', 'refresh-token');
      });

      // 只更新访问令牌
      act(() => {
        result.current.setTokens('access-token-2');
      });

      expect(result.current.token).toBe('access-token-2');
      expect(result.current.refreshToken).toBe('refresh-token');
    });
  });

  describe('updateUser', () => {
    it('应该更新用户信息', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      // 先设置用户
      act(() => {
        result.current.setUser(mockUser);
      });

      // 更新用户信息
      act(() => {
        result.current.updateUser({
          name: 'Updated Name',
          bio: 'New bio',
        });
      });

      expect(result.current.user?.name).toBe('Updated Name');
      expect(result.current.user?.bio).toBe('New bio');
      expect(result.current.user?.email).toBe('test@example.com'); // 保持不变
    });

    it('如果没有用户则不应该更新', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ name: 'New Name' });
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('应该清除所有认证状态', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      // 先设置认证状态
      act(() => {
        result.current.setUser(mockUser);
        result.current.setTokens('access-token', 'refresh-token');
        result.current.setLoading(true);
      });

      // 登出
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('应该设置加载状态', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('应该正确检查用户角色', () => {
      const { result } = renderHook(() => useAuthStore());

      const adminUser = {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      act(() => {
        result.current.setUser(adminUser);
      });

      expect(result.current.hasRole('USER')).toBe(true);
      expect(result.current.hasRole('EDITOR')).toBe(true);
      expect(result.current.hasRole('ADMIN')).toBe(true);
    });

    it('应该对普通用户返回正确的角色检查', () => {
      const { result } = renderHook(() => useAuthStore());

      const regularUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      act(() => {
        result.current.setUser(regularUser);
      });

      expect(result.current.hasRole('USER')).toBe(true);
      expect(result.current.hasRole('EDITOR')).toBe(false);
      expect(result.current.hasRole('ADMIN')).toBe(false);
    });

    it('如果没有用户应该返回false', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasRole('USER')).toBe(false);
      expect(result.current.hasRole('ADMIN')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('应该正确检查用户权限', () => {
      const { result } = renderHook(() => useAuthStore());

      const editorUser = {
        id: 'user-1',
        email: 'editor@example.com',
        name: 'Editor User',
        role: 'EDITOR' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      act(() => {
        result.current.setUser(editorUser);
      });

      expect(result.current.hasPermission('read:own_profile')).toBe(true);
      expect(result.current.hasPermission('read:content')).toBe(true);
      expect(result.current.hasPermission('manage:system')).toBe(false);
    });

    it('如果没有用户应该返回false', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasPermission('read:own_profile')).toBe(false);
    });
  });

  describe('持久化', () => {
    it('应该持久化认证状态到localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
      };

      act(() => {
        result.current.setUser(mockUser);
        result.current.setTokens('access-token', 'refresh-token');
      });

      // 验证localStorage被调用
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('登出时应该清除localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.logout();
      });

      // 验证localStorage被清除
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});
