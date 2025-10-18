/**
 * Story 4.5: 智能通知与提醒
 * 邮件服务 - 负责发送邮件、模板渲染等
 */

import * as fs from 'fs';
import * as path from 'path';

// SMTP配置接口
interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 邮件选项
export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
}

// 模板数据
export interface TemplateData {
  [key: string]: any;
}

export class EmailService {
  private transporter: any;
  private from: string;
  private templatesDir: string;

  constructor() {
    // 延迟初始化，避免阻塞服务启动
    // 注意：很多SMTP服务器要求发件人地址必须与认证用户相同
    this.from = process.env.SMTP_USER || 'noreply@technews.com';
    this.templatesDir = path.join(__dirname, '..', 'templates', 'email');
    console.log('[EmailService] 邮件服务已初始化（延迟模式）');
  }

  /**
   * 延迟初始化邮件传输器
   */
  private async initializeTransporter() {
    if (this.transporter) return;

    try {
      // 动态导入 nodemailer
      const nodemailerModule = await import('nodemailer');
      const nm = nodemailerModule.default || nodemailerModule;

      // 从环境变量读取SMTP配置
      const config: SMTPConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      };

      // 创建邮件发送器
      this.transporter = nm.createTransport(config);
      console.log('[EmailService] 邮件传输器已初始化');
    } catch (error) {
      console.error('[EmailService] ❌ 邮件传输器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 验证SMTP连接（按需调用）
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.initializeTransporter(); // 延迟初始化
      await this.transporter.verify();
      console.log('[EmailService] ✅ SMTP连接验证成功');
      return true;
    } catch (error) {
      console.error('[EmailService] ❌ SMTP连接验证失败:', error);
      console.error('[EmailService] 请检查SMTP环境变量配置');
      return false;
    }
  }

  /**
   * 发送邮件
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.initializeTransporter(); // 延迟初始化

      const mailOptions = {
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] ✅ 邮件发送成功:', info.messageId);
    } catch (error) {
      console.error('[EmailService] ❌ 邮件发送失败:', error);
      throw new Error(`邮件发送失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 使用模板发送邮件
   */
  async sendTemplateEmail(
    templateName: string,
    data: TemplateData,
    to: string,
    subject: string
  ): Promise<void> {
    try {
      const html = await this.renderTemplate(templateName, data);
      await this.sendEmail({
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('[EmailService] ❌ 模板邮件发送失败:', error);
      throw error;
    }
  }

  /**
   * 渲染邮件模板
   */
  private async renderTemplate(templateName: string, data: TemplateData): Promise<string> {
    try {
      // 动态导入 handlebars
      const handlebarsModule = await import('handlebars');
      const hbs = handlebarsModule.default || handlebarsModule;

      // 模板文件路径
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

      // 检查模板文件是否存在
      if (!fs.existsSync(templatePath)) {
        console.warn(`[EmailService] ⚠️ 模板文件不存在: ${templatePath}，使用默认模板`);
        return this.getDefaultTemplate(templateName, data);
      }

      // 读取模板文件
      const templateSource = fs.readFileSync(templatePath, 'utf-8');

      // 编译模板
      const template = hbs.compile(templateSource);

      // 渲染模板
      return template(data);
    } catch (error) {
      console.error('[EmailService] ❌ 模板渲染失败:', error);
      // 使用默认模板作为fallback
      return this.getDefaultTemplate(templateName, data);
    }
  }

  /**
   * 获取默认模板（当模板文件不存在时使用）
   */
  private getDefaultTemplate(templateName: string, data: TemplateData): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    switch (templateName) {
      case 'stock-alert':
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f7fafc; padding: 30px; }
    .alert-box { background: white; border-left: 4px solid ${data.changePercent > 0 ? '#48bb78' : '#f56565'}; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .price-info { display: flex; justify-content: space-between; margin: 15px 0; padding: 15px; background: #edf2f7; border-radius: 4px; }
    .news-item { border-bottom: 1px solid #e2e8f0; padding: 15px 0; }
    .news-item:last-child { border-bottom: none; }
    .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 股票异动提醒</h1>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <h2 style="margin: 0 0 15px 0;">${data.stockName} (${data.stockSymbol})</h2>
        <div class="price-info">
          <div>
            <strong>当前价格:</strong> $${data.currentPrice}
          </div>
          <div>
            <strong>涨跌幅:</strong> <span style="color: ${data.changePercent > 0 ? '#48bb78' : '#f56565'}; font-weight: bold;">${data.changePercent > 0 ? '+' : ''}${data.changePercent}%</span>
          </div>
        </div>
        <p style="color: #718096; margin: 10px 0 0 0;">前一收盘价: $${data.previousPrice}</p>
      </div>
      
      ${data.relatedNews && data.relatedNews.length > 0 ? `
      <h3>相关新闻 (${data.relatedNews.length}条)</h3>
      ${data.relatedNews.map((news: any) => `
      <div class="news-item">
        <h4 style="margin: 0 0 10px 0;">${news.title}</h4>
        <p style="color: #4a5568; margin: 10px 0;">${news.summary || ''}</p>
        <p style="color: #718096; font-size: 14px; margin: 5px 0;">
          ${news.source?.name || news.source || '未知来源'} | ${new Date(news.publishedAt).toLocaleString('zh-CN')}
        </p>
        <a href="${frontendUrl}/content/${news.id}" class="button">阅读全文 →</a>
      </div>
      `).join('')}
      ` : '<p style="color: #718096;">暂无相关新闻</p>'}
    </div>
    
    <div class="footer">
      <p>您收到此邮件是因为您关注了${data.stockSymbol}的股价异动提醒</p>
      <p><a href="${frontendUrl}/settings/notifications" style="color: #667eea;">管理通知设置</a></p>
    </div>
  </div>
</body>
</html>
        `;

      case 'important-news':
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f7fafc; padding: 30px; }
    .news-card { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-right: 8px; }
    .badge-score { background: #f6ad55; color: white; }
    .badge-category { background: #4299e1; color: white; }
    .button { background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 重要新闻推送</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px;">基于您的兴趣为您推荐</p>
    </div>
    
    <div class="content">
      <div class="news-card">
        <div style="margin-bottom: 15px;">
          <span class="badge badge-score">AI评分: ${data.score}分</span>
          <span class="badge badge-category">${data.category || '科技'}</span>
        </div>
        
        <h2 style="margin: 0 0 15px 0; color: #2d3748;">${data.title}</h2>
        
        <p style="color: #4a5568; line-height: 1.8; margin: 15px 0;">${data.summary || data.description || ''}</p>
        
        <p style="color: #718096; font-size: 14px; margin: 15px 0;">
          📰 ${data.source?.name || data.source || '未知来源'} | 
          🕒 ${new Date(data.publishedAt).toLocaleString('zh-CN')}
        </p>
        
        ${data.tags && data.tags.length > 0 ? `
        <p style="color: #718096; font-size: 14px; margin: 10px 0;">
          🏷️ ${data.tags.slice(0, 5).join(', ')}
        </p>
        ` : ''}
        
        <a href="${frontendUrl}/content/${data.id}" class="button">阅读全文 →</a>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #4299e1;">
        <p style="margin: 0; color: #4a5568;">💡 <strong>为什么推荐这条新闻？</strong></p>
        <p style="margin: 10px 0 0 0; color: #718096;">这条新闻获得了高AI评分，并与您的兴趣偏好高度匹配。</p>
      </div>
    </div>
    
    <div class="footer">
      <p>您收到此邮件是因为您启用了重要新闻推送</p>
      <p><a href="${frontendUrl}/settings/notifications" style="color: #f5576c;">管理通知设置</a></p>
    </div>
  </div>
</body>
</html>
        `;

      case 'top10-digest':
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f7fafc; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 20px; }
    .news-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; }
    .rank { position: absolute; top: -10px; left: -10px; background: #667eea; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .news-title { margin: 10px 0; color: #2d3748; font-size: 18px; }
    .news-meta { color: #718096; font-size: 14px; margin: 10px 0; }
    .news-summary { color: #4a5568; margin: 15px 0; line-height: 1.8; }
    .button { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px; }
    .footer { background: white; padding: 30px; text-align: center; color: #718096; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📰 今日科技新闻 TOP10</h1>
      <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">${data.date || new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">为您精选最值得关注的科技资讯</p>
    </div>
    
    <div class="content">
      ${data.top10News && data.top10News.map((news: any, index: number) => `
      <div class="news-card">
        <div class="rank">${index + 1}</div>
        <h2 class="news-title">${news.title}</h2>
        <p class="news-meta">
          📰 ${news.source?.name || news.source || '未知来源'} | 
          ⭐ 评分：${news.score || news.aiScore || 'N/A'}分 | 
          🕒 ${new Date(news.publishedAt).toLocaleString('zh-CN')}
        </p>
        ${news.summary ? `<p class="news-summary">${news.summary}</p>` : ''}
        <a href="${frontendUrl}/content/${news.id}" class="button">阅读全文 →</a>
      </div>
      `).join('') || '<p style="text-align: center; color: #718096;">暂无TOP10内容</p>'}
    </div>
    
    <div class="footer">
      <p>💡 这是根据${data.isPersonalized ? '您的个人偏好' : '平台热度'}生成的每日TOP10摘要</p>
      <p style="margin-top: 15px;">
        <a href="${frontendUrl}/top10" style="color: #667eea; text-decoration: none;">查看完整榜单</a> | 
        <a href="${frontendUrl}/settings/notifications" style="color: #667eea; text-decoration: none;">管理通知设置</a>
      </p>
      <p style="margin-top: 20px; color: #a0aec0;">Tech News Platform © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
        `;

      case 'test-email':
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }
    .success-icon { font-size: 48px; margin: 20px 0; }
    .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1 style="margin: 0;">邮件测试成功</h1>
    </div>
    
    <div class="content">
      <h2>您的邮件配置工作正常！</h2>
      <p>这是一封测试邮件，用于验证您的SMTP配置是否正确。</p>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>📧 收件人:</strong> ${data.recipient}</p>
        <p style="margin: 10px 0 0 0;"><strong>🕒 发送时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
      </div>
      
      <p>如果您收到了这封邮件，说明：</p>
      <ul>
        <li>✅ SMTP服务器连接正常</li>
        <li>✅ 邮件发送功能工作正常</li>
        <li>✅ 邮件模板渲染正常</li>
      </ul>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
        Tech News Platform - 智能通知系统
      </p>
    </div>
  </div>
</body>
</html>
        `;

      default:
        return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <h1>Tech News Platform 通知</h1>
  <p>${JSON.stringify(data, null, 2)}</p>
</body>
</html>
        `;
    }
  }

  /**
   * 验证邮件地址格式
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(to: string): Promise<void> {
    await this.sendTemplateEmail(
      'test-email',
      {
        recipient: to,
        timestamp: new Date().toLocaleString('zh-CN'),
      },
      to,
      '邮件测试 - Tech News Platform'
    );
  }
}

// 导出单例实例
export const emailService = new EmailService();
