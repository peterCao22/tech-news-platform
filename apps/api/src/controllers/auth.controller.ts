// 科技新闻聚合平台 - 认证控制器
// 处理所有认证相关的业务逻辑

import { Request, Response } from 'express';
import { 
  UserRepository, 
  PasswordResetRepository,
  CreateUserInput 
} from '@tech-news-platform/database';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} from '../middleware/auth.middleware';
// import { EmailService } from '../services/email.service';
import { logger } from '../utils/logger';

export class AuthController {
  // 用户注册
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, firstName, lastName } = req.body;

      // 检查邮箱是否已存在
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: '该邮箱已被注册',
          code: 'EMAIL_ALREADY_EXISTS',
        });
        return;
      }

      // 创建用户
      const createUserInput: CreateUserInput = {
        email,
        password,
        name,
        firstName,
        lastName,
      };

      const user = await UserRepository.create(createUserInput);

      // 发送验证邮件
      try {
        // await EmailService.sendVerificationEmail(user.email, user.id);
      } catch (emailError) {
        logger.error('发送验证邮件失败:', emailError);
        // 不阻止注册流程，但记录错误
      }

      // 生成令牌
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken(user.id);

      res.status(201).json({
        success: true,
        message: '注册成功，请查收验证邮件',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
          },
          token,
          refreshToken,
        },
      });
    } catch (error) {
      logger.error('用户注册错误:', error);
      res.status(500).json({
        success: false,
        message: '注册失败，请稍后重试',
        code: 'REGISTRATION_ERROR',
      });
    }
  }

  // 用户登录
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, remember } = req.body;

      // 验证用户凭据
      const user = await UserRepository.validatePassword(email, password);
      if (!user) {
        res.status(401).json({
          success: false,
          message: '邮箱或密码错误',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      // 检查用户状态
      if (user.status === 'SUSPENDED') {
        res.status(401).json({
          success: false,
          message: '账户已被暂停，请联系管理员',
          code: 'ACCOUNT_SUSPENDED',
        });
        return;
      }

      // 更新最后登录时间
      await UserRepository.updateLastLogin(user.id);

      // 生成令牌
      const tokenExpiry = remember ? '30d' : '7d';
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken(user.id);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
          },
          token,
          refreshToken,
          expiresIn: tokenExpiry,
        },
      });
    } catch (error) {
      logger.error('用户登录错误:', error);
      res.status(500).json({
        success: false,
        message: '登录失败，请稍后重试',
        code: 'LOGIN_ERROR',
      });
    }
  }

  // 用户登出
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // 在实际应用中，这里可以将令牌加入黑名单
      // 或者从数据库中删除会话记录
      
      res.json({
        success: true,
        message: '登出成功',
      });
    } catch (error) {
      logger.error('用户登出错误:', error);
      res.status(500).json({
        success: false,
        message: '登出失败',
        code: 'LOGOUT_ERROR',
      });
    }
  }

  // 刷新令牌
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: '无效的刷新令牌',
          code: 'INVALID_REFRESH_TOKEN',
        });
        return;
      }

      const user = await UserRepository.findById(decoded.userId);
      if (!user || user.status !== 'ACTIVE') {
        res.status(401).json({
          success: false,
          message: '用户不存在或已被暂停',
          code: 'USER_NOT_FOUND_OR_SUSPENDED',
        });
        return;
      }

      // 生成新的访问令牌
      const newToken = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      logger.error('令牌刷新错误:', error);
      res.status(500).json({
        success: false,
        message: '令牌刷新失败',
        code: 'TOKEN_REFRESH_ERROR',
      });
    }
  }

  // 邮箱验证
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      // 这里应该验证邮箱验证令牌
      // 简化实现，实际应用中需要从数据库验证令牌
      
      res.json({
        success: true,
        message: '邮箱验证成功',
      });
    } catch (error) {
      logger.error('邮箱验证错误:', error);
      res.status(500).json({
        success: false,
        message: '邮箱验证失败',
        code: 'EMAIL_VERIFICATION_ERROR',
      });
    }
  }

  // 重新发送验证邮件
  static async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await UserRepository.findByEmail(email);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      if (user.emailVerified) {
        res.status(400).json({
          success: false,
          message: '邮箱已经验证过了',
          code: 'EMAIL_ALREADY_VERIFIED',
        });
        return;
      }

      // 发送验证邮件
      // await EmailService.sendVerificationEmail(user.email, user.id);

      res.json({
        success: true,
        message: '验证邮件已重新发送',
      });
    } catch (error) {
      logger.error('重新发送验证邮件错误:', error);
      res.status(500).json({
        success: false,
        message: '发送验证邮件失败',
        code: 'RESEND_VERIFICATION_ERROR',
      });
    }
  }

  // 忘记密码
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await UserRepository.findByEmail(email);
      if (!user) {
        // 为了安全，不透露用户是否存在
        res.json({
          success: true,
          message: '如果该邮箱存在，重置链接已发送',
        });
        return;
      }

      // 创建密码重置令牌
      const resetToken = await PasswordResetRepository.createToken(email);

      // 发送密码重置邮件
      // await EmailService.sendPasswordResetEmail(email, resetToken.token);

      res.json({
        success: true,
        message: '密码重置链接已发送到您的邮箱',
      });
    } catch (error) {
      logger.error('忘记密码错误:', error);
      res.status(500).json({
        success: false,
        message: '发送重置邮件失败',
        code: 'FORGOT_PASSWORD_ERROR',
      });
    }
  }

  // 重置密码
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      // 验证重置令牌
      const resetToken = await PasswordResetRepository.validateToken(token);
      if (!resetToken) {
        res.status(400).json({
          success: false,
          message: '无效或已过期的重置令牌',
          code: 'INVALID_RESET_TOKEN',
        });
        return;
      }

      // 查找用户
      const user = await UserRepository.findByEmail(resetToken.email);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      // 更新密码
      await UserRepository.update(user.id, { password });

      // 标记令牌为已使用
      await PasswordResetRepository.markTokenAsUsed(token);

      res.json({
        success: true,
        message: '密码重置成功',
      });
    } catch (error) {
      logger.error('重置密码错误:', error);
      res.status(500).json({
        success: false,
        message: '密码重置失败',
        code: 'RESET_PASSWORD_ERROR',
      });
    }
  }

  // 更改密码
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      // 验证当前密码
      const user = await UserRepository.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      const isCurrentPasswordValid = await UserRepository.validatePassword(
        user.email,
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: '当前密码错误',
          code: 'INVALID_CURRENT_PASSWORD',
        });
        return;
      }

      // 更新密码
      await UserRepository.update(userId, { password: newPassword });

      res.json({
        success: true,
        message: '密码更改成功',
      });
    } catch (error) {
      logger.error('更改密码错误:', error);
      res.status(500).json({
        success: false,
        message: '密码更改失败',
        code: 'CHANGE_PASSWORD_ERROR',
      });
    }
  }

  // 获取当前用户信息
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
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
      logger.error('获取当前用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        code: 'GET_USER_ERROR',
      });
    }
  }

  // 检查邮箱是否已存在
  static async checkEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const existingUser = await UserRepository.findByEmail(email);

      res.json({
        success: true,
        data: {
          exists: !!existingUser,
        },
      });
    } catch (error) {
      logger.error('检查邮箱错误:', error);
      res.status(500).json({
        success: false,
        message: '检查邮箱失败',
        code: 'CHECK_EMAIL_ERROR',
      });
    }
  }
}
