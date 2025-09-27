// 科技新闻聚合平台 - 输入清理和验证工具
// 防止XSS攻击和数据注入

import { Request, Response, NextFunction } from 'express';

// HTML实体编码映射
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export class InputSanitizer {
  // HTML转义
  static escapeHtml(text: string): string {
    return text.replace(/[&<>"'/]/g, (match) => htmlEntities[match] || match);
  }

  // 移除HTML标签
  static stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  // 清理字符串（移除危险字符）
  static sanitizeString(text: string, options: {
    allowHtml?: boolean;
    maxLength?: number;
    trimWhitespace?: boolean;
  } = {}): string {
    const {
      allowHtml = false,
      maxLength,
      trimWhitespace = true,
    } = options;

    if (typeof text !== 'string') {
      return '';
    }

    let sanitized = text;

    // 去除首尾空白
    if (trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // 处理HTML
    if (!allowHtml) {
      sanitized = this.stripHtml(sanitized);
      sanitized = this.escapeHtml(sanitized);
    }

    // 限制长度
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // 移除控制字符
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    return sanitized;
  }

  // 清理对象
  static sanitizeObject(obj: any, rules: Record<string, {
    type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
    required?: boolean;
    maxLength?: number;
    allowHtml?: boolean;
    pattern?: RegExp;
  }> = {}): any {
    if (!obj || typeof obj !== 'object') {
      return {};
    }

    const sanitized: any = {};

    for (const [key, rule] of Object.entries(rules)) {
      const value = obj[key];

      // 检查必填字段
      if (rule.required && (value === undefined || value === null || value === '')) {
        throw new Error(`字段 ${key} 是必填的`);
      }

      if (value === undefined || value === null) {
        continue;
      }

      // 根据类型处理
      switch (rule.type) {
        case 'string':
          sanitized[key] = this.sanitizeString(String(value), {
            maxLength: rule.maxLength,
            allowHtml: rule.allowHtml,
          });
          break;

        case 'number':
          const num = Number(value);
          if (isNaN(num)) {
            throw new Error(`字段 ${key} 必须是数字`);
          }
          sanitized[key] = num;
          break;

        case 'boolean':
          sanitized[key] = Boolean(value);
          break;

        case 'email':
          const email = this.sanitizeString(String(value), { maxLength: rule.maxLength });
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error(`字段 ${key} 必须是有效的邮箱地址`);
          }
          sanitized[key] = email.toLowerCase();
          break;

        case 'url':
          const url = this.sanitizeString(String(value), { maxLength: rule.maxLength });
          try {
            new URL(url);
            sanitized[key] = url;
          } catch {
            throw new Error(`字段 ${key} 必须是有效的URL`);
          }
          break;

        default:
          sanitized[key] = this.sanitizeString(String(value), {
            maxLength: rule.maxLength,
            allowHtml: rule.allowHtml,
          });
      }

      // 正则表达式验证
      if (rule.pattern && !rule.pattern.test(String(sanitized[key]))) {
        throw new Error(`字段 ${key} 格式不正确`);
      }
    }

    return sanitized;
  }

  // SQL注入防护（基础检查）
  static detectSqlInjection(text: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|"|`)/,
      /(\bOR\b|\bAND\b).*?[=<>]/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(text));
  }

  // XSS检测
  static detectXss(text: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(text));
  }
}

// 输入清理中间件
export const sanitizeInput = (rules: Record<string, any> = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 清理请求体
      if (req.body && typeof req.body === 'object') {
        req.body = InputSanitizer.sanitizeObject(req.body, rules);
      }

      // 清理查询参数
      if (req.query && typeof req.query === 'object') {
        const queryRules: Record<string, any> = {};
        Object.keys(req.query).forEach(key => {
          queryRules[key] = { type: 'string', maxLength: 1000 };
        });
        req.query = InputSanitizer.sanitizeObject(req.query, queryRules);
      }

      // 检查SQL注入
      const checkSqlInjection = (obj: any) => {
        for (const value of Object.values(obj)) {
          if (typeof value === 'string' && InputSanitizer.detectSqlInjection(value)) {
            throw new Error('检测到潜在的SQL注入攻击');
          }
        }
      };

      if (req.body) checkSqlInjection(req.body);
      if (req.query) checkSqlInjection(req.query);

      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '输入验证失败',
        code: 'INPUT_VALIDATION_ERROR',
      });
    }
  };
};

// 常用验证规则
export const ValidationRules = {
  // 用户注册
  userRegistration: {
    email: { type: 'email' as const, required: true, maxLength: 255 },
    password: { type: 'string' as const, required: true, maxLength: 128 },
    name: { type: 'string' as const, maxLength: 100 },
    firstName: { type: 'string' as const, maxLength: 50 },
    lastName: { type: 'string' as const, maxLength: 50 },
  },

  // 用户登录
  userLogin: {
    email: { type: 'email' as const, required: true, maxLength: 255 },
    password: { type: 'string' as const, required: true, maxLength: 128 },
    remember: { type: 'boolean' as const },
  },

  // 个人资料更新
  profileUpdate: {
    name: { type: 'string' as const, maxLength: 100 },
    firstName: { type: 'string' as const, maxLength: 50 },
    lastName: { type: 'string' as const, maxLength: 50 },
    bio: { type: 'string' as const, maxLength: 500 },
    timezone: { type: 'string' as const, maxLength: 50 },
    language: { type: 'string' as const, maxLength: 10 },
  },

  // 密码重置
  passwordReset: {
    email: { type: 'email' as const, required: true, maxLength: 255 },
  },

  // 新密码设置
  passwordChange: {
    currentPassword: { type: 'string' as const, required: true, maxLength: 128 },
    newPassword: { type: 'string' as const, required: true, maxLength: 128 },
    confirmNewPassword: { type: 'string' as const, required: true, maxLength: 128 },
  },
};
