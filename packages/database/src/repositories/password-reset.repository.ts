// 科技新闻聚合平台 - 密码重置令牌管理
// 密码重置相关的数据库操作

import { randomBytes } from 'crypto';
import { db, PasswordResetToken } from '../client';

export class PasswordResetRepository {
  // 创建密码重置令牌
  static async createToken(email: string): Promise<PasswordResetToken> {
    // 生成安全的随机令牌
    const token = randomBytes(32).toString('hex');
    
    // 令牌有效期为1小时
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    // 删除该邮箱的旧令牌
    await db.passwordResetToken.deleteMany({
      where: { email },
    });

    // 创建新令牌
    return await db.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });
  }

  // 验证密码重置令牌
  static async validateToken(token: string): Promise<PasswordResetToken | null> {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    // 检查令牌是否存在、未使用且未过期
    if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
      return null;
    }

    return resetToken;
  }

  // 标记令牌为已使用
  static async markTokenAsUsed(token: string): Promise<void> {
    await db.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });
  }

  // 清理过期令牌
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await db.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expires: { lt: new Date() } },
          { used: true },
        ],
      },
    });

    return result.count;
  }

  // 获取用户的活跃令牌
  static async getActiveTokenByEmail(email: string): Promise<PasswordResetToken | null> {
    return await db.passwordResetToken.findFirst({
      where: {
        email,
        used: false,
        expires: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 撤销用户的所有令牌
  static async revokeAllTokensForEmail(email: string): Promise<number> {
    const result = await db.passwordResetToken.updateMany({
      where: { email },
      data: { used: true },
    });

    return result.count;
  }
}
