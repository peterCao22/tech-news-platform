// 科技新闻聚合平台 - 用户控制器
// 处理用户资料管理和用户相关业务逻辑

import { Request, Response } from 'express';
import { UserRepository } from '@tech-news-platform/database';
import { logger } from '../utils/logger';

export class UserController {
  // 获取用户资料
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const user = await UserRepository.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio,
            image: user.image,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            timezone: user.timezone,
            language: user.language,
            preferences: user.preferences,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          },
        },
      });
    } catch (error) {
      logger.error('获取用户资料错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户资料失败',
        code: 'GET_PROFILE_ERROR',
      });
    }
  }

  // 更新用户资料
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, firstName, lastName, bio, timezone, language } = req.body;

      const updatedUser = await UserRepository.update(userId, {
        name,
        firstName,
        lastName,
        bio,
        timezone,
        language,
      });

      res.json({
        success: true,
        message: '用户资料更新成功',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            bio: updatedUser.bio,
            timezone: updatedUser.timezone,
            language: updatedUser.language,
          },
        },
      });
    } catch (error) {
      logger.error('更新用户资料错误:', error);
      res.status(500).json({
        success: false,
        message: '更新用户资料失败',
        code: 'UPDATE_PROFILE_ERROR',
      });
    }
  }

  // 更新用户偏好设置
  static async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { preferences } = req.body;

      const updatedUser = await UserRepository.update(userId, {
        preferences,
      });

      res.json({
        success: true,
        message: '用户偏好设置更新成功',
        data: {
          preferences: updatedUser.preferences,
        },
      });
    } catch (error) {
      logger.error('更新用户偏好设置错误:', error);
      res.status(500).json({
        success: false,
        message: '更新偏好设置失败',
        code: 'UPDATE_PREFERENCES_ERROR',
      });
    }
  }

  // 获取用户活动日志
  static async getActivities(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // 这里应该从数据库获取用户活动日志
      // 简化实现，返回空数组
      const activities: any[] = [];
      const total = 0;

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error('获取用户活动日志错误:', error);
      res.status(500).json({
        success: false,
        message: '获取活动日志失败',
        code: 'GET_ACTIVITIES_ERROR',
      });
    }
  }

  // 删除用户账户
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // 软删除用户（更改状态为SUSPENDED）
      await UserRepository.softDelete(userId);

      res.json({
        success: true,
        message: '账户已删除',
      });
    } catch (error) {
      logger.error('删除用户账户错误:', error);
      res.status(500).json({
        success: false,
        message: '删除账户失败',
        code: 'DELETE_ACCOUNT_ERROR',
      });
    }
  }

  // 管理员功能 - 获取用户列表
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as string;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      const { users, total } = await UserRepository.findMany({
        skip,
        take: limit,
        role: role as any,
        status: status as any,
        search,
      });

      res.json({
        success: true,
        data: {
          users: users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error('获取用户列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败',
        code: 'GET_USERS_ERROR',
      });
    }
  }

  // 管理员功能 - 获取用户详情
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await UserRepository.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            timezone: user.timezone,
            language: user.language,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            accounts: user.accounts,
          },
        },
      });
    } catch (error) {
      logger.error('获取用户详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户详情失败',
        code: 'GET_USER_ERROR',
      });
    }
  }

  // 管理员功能 - 更新用户状态
  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      const updatedUser = await UserRepository.update(userId, { status });

      res.json({
        success: true,
        message: '用户状态更新成功',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status,
          },
        },
      });
    } catch (error) {
      logger.error('更新用户状态错误:', error);
      res.status(500).json({
        success: false,
        message: '更新用户状态失败',
        code: 'UPDATE_USER_STATUS_ERROR',
      });
    }
  }

  // 管理员功能 - 更新用户角色
  static async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const updatedUser = await UserRepository.update(userId, { role });

      res.json({
        success: true,
        message: '用户角色更新成功',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
          },
        },
      });
    } catch (error) {
      logger.error('更新用户角色错误:', error);
      res.status(500).json({
        success: false,
        message: '更新用户角色失败',
        code: 'UPDATE_USER_ROLE_ERROR',
      });
    }
  }

  // 管理员功能 - 获取用户统计
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await UserRepository.getStats();

      res.json({
        success: true,
        data: {
          stats,
        },
      });
    } catch (error) {
      logger.error('获取用户统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户统计失败',
        code: 'GET_USER_STATS_ERROR',
      });
    }
  }
}
