/**
 * Story 4.1: User Preferences Store
 * 用户个性化偏好状态管理
 * 
 * 功能：
 * - 偏好基础设置管理
 * - 兴趣列表管理
 * - 关注列表管理
 * - 信息源权重管理
 * - 偏好模板管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 兴趣类型
 */
interface Interest {
  id: string;
  category: string;
  name: string;
  weight: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * 关注类型
 */
interface Following {
  id: string;
  followType: 'COMPANY' | 'STOCK' | 'PERSON' | 'ORGANIZATION';
  name: string;
  identifier?: string;
  weight: number;
  isActive: boolean;
  notifyOnNews: boolean;
  notifyOnPrice: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 信息源权重类型
 */
interface SourceWeight {
  id: string;
  sourceId: string;
  weight: number;
  reason?: string;
  source: {
    id: string;
    name: string;
    type: string;
    url?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 偏好模板类型
 */
interface PreferenceTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
}

/**
 * 用户偏好类型
 */
interface UserPreference {
  id: string;
  userId: string;
  preferredLanguage: string;
  timezone: string;
  contentTypes: string[];
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationFrequency: string;
  itemsPerPage: number;
  defaultSortBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 偏好状态接口
 */
interface PreferencesState {
  // 基础偏好
  preference: UserPreference | null;
  
  // 兴趣列表
  interests: Interest[];
  interestsLoading: boolean;
  
  // 关注列表
  followings: Following[];
  followingsLoading: boolean;
  
  // 信息源权重
  sourceWeights: SourceWeight[];
  sourceWeightsLoading: boolean;
  
  // 偏好模板
  templates: PreferenceTemplate[];
  templatesLoading: boolean;
  
  // UI状态
  activeTab: string;
  editingInterest: Interest | null;
  editingFollowing: Following | null;
  
  // Actions - 基础偏好
  setPreference: (preference: UserPreference | null) => void;
  updatePreferenceField: (field: keyof UserPreference, value: any) => void;
  
  // Actions - 兴趣管理
  setInterests: (interests: Interest[]) => void;
  addInterest: (interest: Interest) => void;
  updateInterest: (id: string, updates: Partial<Interest>) => void;
  removeInterest: (id: string) => void;
  setInterestsLoading: (loading: boolean) => void;
  setEditingInterest: (interest: Interest | null) => void;
  
  // Actions - 关注管理
  setFollowings: (followings: Following[]) => void;
  addFollowing: (following: Following) => void;
  updateFollowing: (id: string, updates: Partial<Following>) => void;
  removeFollowing: (id: string) => void;
  setFollowingsLoading: (loading: boolean) => void;
  setEditingFollowing: (following: Following | null) => void;
  
  // Actions - 信息源权重
  setSourceWeights: (weights: SourceWeight[]) => void;
  updateSourceWeight: (sourceId: string, weight: number, reason?: string) => void;
  setSourceWeightsLoading: (loading: boolean) => void;
  
  // Actions - 偏好模板
  setTemplates: (templates: PreferenceTemplate[]) => void;
  setTemplatesLoading: (loading: boolean) => void;
  
  // Actions - UI状态
  setActiveTab: (tab: string) => void;
  
  // Actions - 重置
  reset: () => void;
}

/**
 * 初始状态
 */
const initialState = {
  preference: null,
  interests: [],
  interestsLoading: false,
  followings: [],
  followingsLoading: false,
  sourceWeights: [],
  sourceWeightsLoading: false,
  templates: [],
  templatesLoading: false,
  activeTab: 'interests',
  editingInterest: null,
  editingFollowing: null,
};

/**
 * 偏好状态管理 Store
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...initialState,

      // 基础偏好管理
      setPreference: (preference) => set({ preference }),
      
      updatePreferenceField: (field, value) =>
        set((state) => ({
          preference: state.preference
            ? { ...state.preference, [field]: value }
            : null,
        })),

      // 兴趣管理
      setInterests: (interests) => set({ interests }),
      
      addInterest: (interest) =>
        set((state) => ({
          interests: [interest, ...state.interests],
        })),
      
      updateInterest: (id, updates) =>
        set((state) => ({
          interests: state.interests.map((interest) =>
            interest.id === id ? { ...interest, ...updates } : interest
          ),
        })),
      
      removeInterest: (id) =>
        set((state) => ({
          interests: state.interests.filter((interest) => interest.id !== id),
        })),
      
      setInterestsLoading: (loading) => set({ interestsLoading: loading }),
      
      setEditingInterest: (interest) => set({ editingInterest: interest }),

      // 关注管理
      setFollowings: (followings) => set({ followings }),
      
      addFollowing: (following) =>
        set((state) => ({
          followings: [following, ...state.followings],
        })),
      
      updateFollowing: (id, updates) =>
        set((state) => ({
          followings: state.followings.map((following) =>
            following.id === id ? { ...following, ...updates } : following
          ),
        })),
      
      removeFollowing: (id) =>
        set((state) => ({
          followings: state.followings.filter((following) => following.id !== id),
        })),
      
      setFollowingsLoading: (loading) => set({ followingsLoading: loading }),
      
      setEditingFollowing: (following) => set({ editingFollowing: following }),

      // 信息源权重管理
      setSourceWeights: (weights) => set({ sourceWeights: weights }),
      
      updateSourceWeight: (sourceId, weight, reason) =>
        set((state) => {
          const existing = state.sourceWeights.find((sw) => sw.sourceId === sourceId);
          if (existing) {
            return {
              sourceWeights: state.sourceWeights.map((sw) =>
                sw.sourceId === sourceId ? { ...sw, weight, reason } : sw
              ),
            };
          }
          // 如果不存在，等待API返回后添加
          return state;
        }),
      
      setSourceWeightsLoading: (loading) => set({ sourceWeightsLoading: loading }),

      // 偏好模板管理
      setTemplates: (templates) => set({ templates }),
      
      setTemplatesLoading: (loading) => set({ templatesLoading: loading }),

      // UI状态管理
      setActiveTab: (tab) => set({ activeTab: tab }),

      // 重置状态
      reset: () => set(initialState),
    }),
    {
      name: 'preferences-storage',
      partialize: (state) => ({
        // 只持久化必要的状态
        activeTab: state.activeTab,
        preference: state.preference,
      }),
    }
  )
);

/**
 * 便捷的选择器
 */
export const selectPreference = (state: PreferencesState) => state.preference;
export const selectInterests = (state: PreferencesState) => state.interests;
export const selectFollowings = (state: PreferencesState) => state.followings;
export const selectSourceWeights = (state: PreferencesState) => state.sourceWeights;
export const selectActiveTab = (state: PreferencesState) => state.activeTab;

