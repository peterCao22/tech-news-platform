/**
 * Reviewer Middleware
 * Story 3.1: 内容审核工作台界面
 * 
 * 验证用户是否具有审核权限
 * 只有 EDITOR 和 ADMIN 角色可以进行内容审核
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class ReviewerMiddleware {
  /**
   * 验证审核员权限
   */
  public checkReviewerRole = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      // 检查用户是否已认证
      if (!user) {
        res.status(401).json({
          success: false,
          error: '未授权：请先登录'
        });
        return;
      }

      // 检查用户角色
      const allowedRoles = ['EDITOR', 'ADMIN'];
      if (!allowedRoles.includes(user.role)) {
        logger.warn('用户无审核权限', {
          userId: user.id,
          role: user.role
        });

        res.status(403).json({
          success: false,
          error: '权限不足：只有编辑和管理员可以进行内容审核'
        });
        return;
      }

      // 权限验证通过，继续处理请求
      next();
    } catch (error: any) {
      logger.error('审核员权限验证失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: '权限验证失败'
      });
    }
  };

  /**
   * 验证编辑权限（更严格，仅ADMIN）
   */
  public checkAdminRole = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: '未授权：请先登录'
        });
        return;
      }

      if (user.role !== 'ADMIN') {
        logger.warn('用户无管理员权限', {
          userId: user.id,
          role: user.role
        });

        res.status(403).json({
          success: false,
          error: '权限不足：只有管理员可以执行此操作'
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error('管理员权限验证失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: '权限验证失败'
      });
    }
  };
}

// 导出中间件实例
const reviewerMiddleware = new ReviewerMiddleware();
export const checkReviewerRole = reviewerMiddleware.checkReviewerRole;
export const checkAdminRole = reviewerMiddleware.checkAdminRole;

