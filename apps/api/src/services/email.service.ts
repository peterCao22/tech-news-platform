// 科技新闻聚合平台 - 邮件服务
// 处理用户认证相关的邮件发送

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private static transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 发送邮箱验证邮件
  static async sendVerificationEmail(email: string, userId: string): Promise<void> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${userId}`;
      
      const mailOptions = {
        from: `"科技新闻聚合平台" <${process.env.SMTP_FROM || 'noreply@technews.com'}>`,
        to: email,
        subject: '验证您的邮箱地址',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">欢迎加入科技新闻聚合平台！</h2>
            <p>感谢您注册我们的平台。请点击下面的链接验证您的邮箱地址：</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                验证邮箱
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              如果按钮无法点击，请复制以下链接到浏览器地址栏：<br>
              <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
            <p style="color: #666; font-size: 14px;">
              此链接将在24小时后失效。如果您没有注册账户，请忽略此邮件。
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2025 科技新闻聚合平台. 保留所有权利。
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`验证邮件已发送到: ${email}`);
    } catch (error) {
      logger.error('发送验证邮件失败:', error);
      throw new Error('邮件发送失败');
    }
  }

  // 发送密码重置邮件
  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"科技新闻聚合平台" <${process.env.SMTP_FROM || 'noreply@technews.com'}>`,
        to: email,
        subject: '重置您的密码',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">密码重置请求</h2>
            <p>我们收到了您的密码重置请求。请点击下面的链接重置您的密码：</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc3545; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                重置密码
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              如果按钮无法点击，请复制以下链接到浏览器地址栏：<br>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="color: #666; font-size: 14px;">
              此链接将在1小时后失效。如果您没有请求重置密码，请忽略此邮件。
            </p>
            <p style="color: #e74c3c; font-size: 14px;">
              <strong>安全提醒：</strong>请不要将此邮件转发给他人。
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2025 科技新闻聚合平台. 保留所有权利。
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`密码重置邮件已发送到: ${email}`);
    } catch (error) {
      logger.error('发送密码重置邮件失败:', error);
      throw new Error('邮件发送失败');
    }
  }

  // 发送欢迎邮件
  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"科技新闻聚合平台" <${process.env.SMTP_FROM || 'noreply@technews.com'}>`,
        to: email,
        subject: '欢迎加入科技新闻聚合平台！',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">欢迎，${name}！</h2>
            <p>恭喜您成功注册科技新闻聚合平台！</p>
            <p>我们的平台为您提供：</p>
            <ul style="color: #666;">
              <li>🤖 AI驱动的智能新闻筛选</li>
              <li>📊 每日TOP10精选科技资讯</li>
              <li>🎯 个性化内容推荐</li>
              <li>📈 股票相关科技新闻追踪</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                开始探索
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              如果您有任何问题，请随时联系我们的支持团队。
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2025 科技新闻聚合平台. 保留所有权利。
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`欢迎邮件已发送到: ${email}`);
    } catch (error) {
      logger.error('发送欢迎邮件失败:', error);
      // 欢迎邮件失败不应该阻止注册流程
    }
  }

  // 测试邮件配置
  static async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('邮件服务连接测试成功');
      return true;
    } catch (error) {
      logger.error('邮件服务连接测试失败:', error);
      return false;
    }
  }
}
