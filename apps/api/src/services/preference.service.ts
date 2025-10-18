/**
 * Story 4.1: User Preferences Service
 * 用户个性化偏好管理服务
 * 
 * 功能：
 * - 偏好CRUD操作
 * - 兴趣管理
 * - 关注列表管理
 * - 信息源权重管理
 * - 偏好导入导出
 * - 偏好模板管理
 */

import { prisma } from '@tech-news-platform/database';
import type { 
  UserPreference, 
  UserInterest, 
  UserFollowing, 
  SourceWeight,
  PreferenceTemplate,
  FollowType 
} from '@tech-news-platform/database';

/**
 * 偏好管理服务
 */
export class PreferenceService {
  
  // ==========================================
  // 基础偏好管理
  // ==========================================
  
  /**
   * 获取用户偏好
   */
  async getUserPreference(userId: string): Promise<UserPreference | null> {
    try {
      let preference = await prisma.userPreference.findUnique({
        where: { userId },
        include: {
          interests: {
            where: { isActive: true },
            orderBy: { weight: 'desc' }
          },
          followedCompanies: {
            where: { isActive: true },
            orderBy: { weight: 'desc' }
          },
          sourceWeights: {
            include: {
              source: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  url: true
                }
              }
            }
          }
        }
      });

      // 如果用户没有偏好记录，创建默认偏好
      if (!preference) {
        preference = await this.createDefaultPreference(userId);
      }

      return preference;
    } catch (error) {
      console.error('获取用户偏好失败:', error);
      throw new Error('获取用户偏好失败');
    }
  }

  /**
   * 创建默认偏好
   */
  private async createDefaultPreference(userId: string): Promise<UserPreference> {
    return await prisma.userPreference.create({
      data: {
        userId,
        contentTypes: ['news', 'analysis'],
        preferredLanguage: 'zh-CN',
        timezone: 'Asia/Shanghai',
        itemsPerPage: 20,
        defaultSortBy: 'score',
        emailNotifications: true,
        pushNotifications: false,
        notificationFrequency: 'daily'
      },
      include: {
        interests: true,
        followedCompanies: true,
        sourceWeights: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
                type: true,
                url: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * 更新用户偏好
   */
  async updateUserPreference(
    userId: string,
    data: Partial<{
      contentTypes: string[];
      preferredLanguage: string;
      timezone: string;
      itemsPerPage: number;
      defaultSortBy: string;
      emailNotifications: boolean;
      pushNotifications: boolean;
      notificationFrequency: string;
    }>
  ): Promise<UserPreference> {
    try {
      // 确保偏好记录存在
      await this.getUserPreference(userId);

      return await prisma.userPreference.update({
        where: { userId },
        data,
        include: {
          interests: {
            where: { isActive: true }
          },
          followedCompanies: {
            where: { isActive: true }
          },
          sourceWeights: {
            include: {
              source: true
            }
          }
        }
      });
    } catch (error) {
      console.error('更新用户偏好失败:', error);
      throw new Error('更新用户偏好失败');
    }
  }

  // ==========================================
  // 兴趣管理
  // ==========================================

  /**
   * 获取兴趣列表
   */
  async getInterests(
    userId: string,
    filters?: {
      category?: string;
      isActive?: boolean;
    }
  ): Promise<UserInterest[]> {
    try {
      return await prisma.userInterest.findMany({
        where: {
          userId,
          ...(filters?.category && { category: filters.category }),
          ...(filters?.isActive !== undefined && { isActive: filters.isActive })
        },
        orderBy: [
          { weight: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    } catch (error) {
      console.error('获取兴趣列表失败:', error);
      throw new Error('获取兴趣列表失败');
    }
  }

  /**
   * 添加兴趣
   */
  async addInterest(
    userId: string,
    data: {
      category: string;
      name: string;
      weight?: number;
    }
  ): Promise<UserInterest> {
    try {
      // 确保偏好记录存在
      await this.getUserPreference(userId);

      // 验证权重范围
      const weight = data.weight ?? 1.0;
      if (weight < 0.5 || weight > 2.0) {
        throw new Error('兴趣权重必须在 0.5 到 2.0 之间');
      }

      return await prisma.userInterest.create({
        data: {
          userId,
          category: data.category,
          name: data.name,
          weight,
          isActive: true
        }
      });
    } catch (error) {
      if ((error as any).code === 'P2002') {
        throw new Error('该兴趣已存在');
      }
      console.error('添加兴趣失败:', error);
      throw error;
    }
  }

  /**
   * 批量添加兴趣
   */
  async batchAddInterests(
    userId: string,
    interests: Array<{
      category: string;
      name: string;
      weight?: number;
    }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const interest of interests) {
      try {
        await this.addInterest(userId, interest);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`添加兴趣 "${interest.name}" 失败: ${(error as Error).message}`);
      }
    }

    return results;
  }

  /**
   * 更新兴趣
   */
  async updateInterest(
    interestId: string,
    userId: string,
    data: {
      weight?: number;
      isActive?: boolean;
    }
  ): Promise<UserInterest> {
    try {
      // 验证权重范围
      if (data.weight !== undefined && (data.weight < 0.5 || data.weight > 2.0)) {
        throw new Error('兴趣权重必须在 0.5 到 2.0 之间');
      }

      return await prisma.userInterest.update({
        where: {
          id: interestId,
          userId // 确保只能更新自己的兴趣
        },
        data
      });
    } catch (error) {
      console.error('更新兴趣失败:', error);
      throw new Error('更新兴趣失败');
    }
  }

  /**
   * 删除兴趣
   */
  async deleteInterest(interestId: string, userId: string): Promise<void> {
    try {
      await prisma.userInterest.delete({
        where: {
          id: interestId,
          userId // 确保只能删除自己的兴趣
        }
      });
    } catch (error) {
      console.error('删除兴趣失败:', error);
      throw new Error('删除兴趣失败');
    }
  }

  // ==========================================
  // 关注列表管理
  // ==========================================

  /**
   * 获取关注列表
   */
  async getFollowings(
    userId: string,
    filters?: {
      followType?: FollowType;
      isActive?: boolean;
    }
  ): Promise<UserFollowing[]> {
    try {
      return await prisma.userFollowing.findMany({
        where: {
          userId,
          ...(filters?.followType && { followType: filters.followType }),
          ...(filters?.isActive !== undefined && { isActive: filters.isActive })
        },
        orderBy: [
          { weight: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    } catch (error) {
      console.error('获取关注列表失败:', error);
      throw new Error('获取关注列表失败');
    }
  }

  /**
   * 添加关注
   */
  async addFollowing(
    userId: string,
    data: {
      followType: FollowType;
      name: string;
      identifier?: string;
      weight?: number;
      notifyOnNews?: boolean;
      notifyOnPrice?: boolean;
    }
  ): Promise<UserFollowing> {
    try {
      // 确保偏好记录存在
      await this.getUserPreference(userId);

      // 验证权重范围
      const weight = data.weight ?? 1.5;
      if (weight < 1.0 || weight > 3.0) {
        throw new Error('关注权重必须在 1.0 到 3.0 之间');
      }

      return await prisma.userFollowing.create({
        data: {
          userId,
          followType: data.followType,
          name: data.name,
          identifier: data.identifier || data.name.toLowerCase().replace(/\s+/g, '-'),
          weight,
          isActive: true,
          notifyOnNews: data.notifyOnNews ?? true,
          notifyOnPrice: data.notifyOnPrice ?? false
        }
      });
    } catch (error) {
      if ((error as any).code === 'P2002') {
        throw new Error('该关注已存在');
      }
      console.error('添加关注失败:', error);
      throw error;
    }
  }

  /**
   * 更新关注
   */
  async updateFollowing(
    followingId: string,
    userId: string,
    data: {
      weight?: number;
      isActive?: boolean;
      notifyOnNews?: boolean;
      notifyOnPrice?: boolean;
    }
  ): Promise<UserFollowing> {
    try {
      // 验证权重范围
      if (data.weight !== undefined && (data.weight < 1.0 || data.weight > 3.0)) {
        throw new Error('关注权重必须在 1.0 到 3.0 之间');
      }

      return await prisma.userFollowing.update({
        where: {
          id: followingId,
          userId // 确保只能更新自己的关注
        },
        data
      });
    } catch (error) {
      console.error('更新关注失败:', error);
      throw new Error('更新关注失败');
    }
  }

  /**
   * 删除关注
   */
  async deleteFollowing(followingId: string, userId: string): Promise<void> {
    try {
      await prisma.userFollowing.delete({
        where: {
          id: followingId,
          userId // 确保只能删除自己的关注
        }
      });
    } catch (error) {
      console.error('删除关注失败:', error);
      throw new Error('删除关注失败');
    }
  }

  // ==========================================
  // 信息源权重管理
  // ==========================================

  /**
   * 获取信息源权重列表
   */
  async getSourceWeights(userId: string): Promise<SourceWeight[]> {
    try {
      return await prisma.sourceWeight.findMany({
        where: { userId },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              type: true,
              url: true,
              status: true
            }
          }
        },
        orderBy: { weight: 'desc' }
      });
    } catch (error) {
      console.error('获取信息源权重失败:', error);
      throw new Error('获取信息源权重失败');
    }
  }

  /**
   * 设置信息源权重
   */
  async setSourceWeight(
    userId: string,
    sourceId: string,
    data: {
      weight: number;
      reason?: string;
    }
  ): Promise<SourceWeight> {
    try {
      // 确保偏好记录存在
      await this.getUserPreference(userId);

      // 验证信息源存在
      const source = await prisma.source.findUnique({
        where: { id: sourceId }
      });

      if (!source) {
        throw new Error('信息源不存在');
      }

      // 验证权重范围
      if (data.weight < 0.1 || data.weight > 2.0) {
        throw new Error('信息源权重必须在 0.1 到 2.0 之间');
      }

      // 创建或更新权重
      return await prisma.sourceWeight.upsert({
        where: {
          userId_sourceId: {
            userId,
            sourceId
          }
        },
        create: {
          userId,
          sourceId,
          weight: data.weight,
          reason: data.reason
        },
        update: {
          weight: data.weight,
          reason: data.reason
        },
        include: {
          source: true
        }
      });
    } catch (error) {
      console.error('设置信息源权重失败:', error);
      throw error;
    }
  }

  // ==========================================
  // 偏好导入导出
  // ==========================================

  /**
   * 导出偏好配置
   */
  async exportPreferences(userId: string): Promise<object> {
    try {
      const preference = await this.getUserPreference(userId);
      
      if (!preference) {
        throw new Error('用户偏好不存在');
      }

      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        preferences: {
          basic: {
            contentTypes: preference.contentTypes,
            preferredLanguage: preference.preferredLanguage,
            timezone: preference.timezone,
            itemsPerPage: preference.itemsPerPage,
            defaultSortBy: preference.defaultSortBy,
            emailNotifications: preference.emailNotifications,
            pushNotifications: preference.pushNotifications,
            notificationFrequency: preference.notificationFrequency
          },
          interests: preference.interests.map(i => ({
            category: i.category,
            name: i.name,
            weight: i.weight
          })),
          followings: preference.followedCompanies.map(f => ({
            followType: f.followType,
            name: f.name,
            identifier: f.identifier,
            weight: f.weight,
            notifyOnNews: f.notifyOnNews,
            notifyOnPrice: f.notifyOnPrice
          })),
          sourceWeights: preference.sourceWeights.map(sw => ({
            sourceName: sw.source.name,
            sourceUrl: sw.source.url,
            weight: sw.weight,
            reason: sw.reason
          }))
        }
      };
    } catch (error) {
      console.error('导出偏好失败:', error);
      throw new Error('导出偏好失败');
    }
  }

  /**
   * 导入偏好配置
   */
  async importPreferences(
    userId: string,
    data: any,
    overwrite: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 验证数据格式
      if (!data.version || !data.preferences) {
        throw new Error('无效的导入数据格式');
      }

      // 如果覆盖模式，先清除现有数据
      if (overwrite) {
        await prisma.$transaction([
          prisma.userInterest.deleteMany({ where: { userId } }),
          prisma.userFollowing.deleteMany({ where: { userId } }),
          prisma.sourceWeight.deleteMany({ where: { userId } })
        ]);
      }

      // 导入基础偏好
      if (data.preferences.basic) {
        await this.updateUserPreference(userId, data.preferences.basic);
      }

      // 导入兴趣
      if (data.preferences.interests && Array.isArray(data.preferences.interests)) {
        await this.batchAddInterests(userId, data.preferences.interests);
      }

      // 导入关注
      if (data.preferences.followings && Array.isArray(data.preferences.followings)) {
        for (const following of data.preferences.followings) {
          try {
            await this.addFollowing(userId, following);
          } catch (error) {
            console.warn(`导入关注失败: ${following.name}`, error);
          }
        }
      }

      // 导入信息源权重
      if (data.preferences.sourceWeights && Array.isArray(data.preferences.sourceWeights)) {
        for (const sw of data.preferences.sourceWeights) {
          try {
            // 通过名称查找信息源
            const source = await prisma.source.findFirst({
              where: { name: sw.sourceName }
            });

            if (source) {
              await this.setSourceWeight(userId, source.id, {
                weight: sw.weight,
                reason: sw.reason
              });
            }
          } catch (error) {
            console.warn(`导入信息源权重失败: ${sw.sourceName}`, error);
          }
        }
      }

      return {
        success: true,
        message: '偏好导入成功'
      };
    } catch (error) {
      console.error('导入偏好失败:', error);
      throw error;
    }
  }

  // ==========================================
  // 偏好模板管理
  // ==========================================

  /**
   * 获取偏好模板列表
   */
  async getTemplates(filters?: {
    category?: string;
    isPublic?: boolean;
  }): Promise<PreferenceTemplate[]> {
    try {
      return await prisma.preferenceTemplate.findMany({
        where: {
          ...(filters?.category && { category: filters.category }),
          ...(filters?.isPublic !== undefined && { isPublic: filters.isPublic })
        },
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    } catch (error) {
      console.error('获取偏好模板失败:', error);
      throw new Error('获取偏好模板失败');
    }
  }

  /**
   * 应用偏好模板
   */
  async applyTemplate(
    userId: string,
    templateId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const template = await prisma.preferenceTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error('模板不存在');
      }

      // 应用模板配置
      await this.importPreferences(userId, {
        version: '1.0',
        preferences: template.config
      }, false);

      // 增加使用计数
      await prisma.preferenceTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } }
      });

      return {
        success: true,
        message: '模板应用成功'
      };
    } catch (error) {
      console.error('应用模板失败:', error);
      throw error;
    }
  }
}

// 导出服务实例
export const preferenceService = new PreferenceService();

