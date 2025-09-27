// 科技新闻聚合平台 - 用户类型定义
// 用户相关的TypeScript类型和验证模式

import { z } from 'zod';
import { User, Account, Session, UserRole, UserStatus } from '../client';

// 用户偏好设置类型
export interface UserPreferences {
  // 通知设置
  notifications: {
    email: boolean;
    push: boolean;
    digest: boolean;
  };
  
  // 内容偏好
  content: {
    categories: string[];
    sources: string[];
    keywords: string[];
  };
  
  // 显示设置
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    itemsPerPage: number;
  };
  
  // AI设置
  ai: {
    enableAutoSummary: boolean;
    enableSmartFiltering: boolean;
    confidenceThreshold: number;
  };
}

// 扩展的用户类型（包含关联数据）
export interface UserWithProfile extends User {
  accounts: Account[];
  sessions: Session[];
}

// 创建用户输入类型
export interface CreateUserInput {
  email: string;
  password?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  preferences?: Partial<UserPreferences>;
  timezone?: string;
  language?: string;
}

// 更新用户输入类型
export interface UpdateUserInput {
  email?: string;
  password?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  image?: string;
  preferences?: Partial<UserPreferences>;
  timezone?: string;
  language?: string;
  status?: UserStatus;
  role?: UserRole;
}

// 用户注册验证模式
export const registerSchema = z.object({
  email: z
    .string()
    .email('请输入有效的邮箱地址')
    .min(1, '邮箱不能为空'),
  password: z
    .string()
    .min(8, '密码至少需要8个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '密码必须包含至少一个小写字母、一个大写字母和一个数字'
    ),
  confirmPassword: z.string(),
  name: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符')
    .optional(),
  firstName: z
    .string()
    .min(1, '名字不能为空')
    .max(25, '名字不能超过25个字符')
    .optional(),
  lastName: z
    .string()
    .min(1, '姓氏不能为空')
    .max(25, '姓氏不能超过25个字符')
    .optional(),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, '请同意服务条款'),
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: '密码确认不匹配',
    path: ['confirmPassword'],
  }
);

// 用户登录验证模式
export const loginSchema = z.object({
  email: z
    .string()
    .email('请输入有效的邮箱地址')
    .min(1, '邮箱不能为空'),
  password: z
    .string()
    .min(1, '密码不能为空'),
  remember: z.boolean().optional(),
});

// 密码重置请求验证模式
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('请输入有效的邮箱地址')
    .min(1, '邮箱不能为空'),
});

// 密码重置验证模式
export const resetPasswordSchema = z.object({
  token: z.string().min(1, '重置令牌不能为空'),
  password: z
    .string()
    .min(8, '密码至少需要8个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '密码必须包含至少一个小写字母、一个大写字母和一个数字'
    ),
  confirmPassword: z.string(),
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: '密码确认不匹配',
    path: ['confirmPassword'],
  }
);

// 用户资料更新验证模式
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符')
    .optional(),
  firstName: z
    .string()
    .min(1, '名字不能为空')
    .max(25, '名字不能超过25个字符')
    .optional(),
  lastName: z
    .string()
    .min(1, '姓氏不能为空')
    .max(25, '姓氏不能超过25个字符')
    .optional(),
  bio: z
    .string()
    .max(500, '个人简介不能超过500个字符')
    .optional(),
  timezone: z
    .string()
    .optional(),
  language: z
    .string()
    .min(2, '语言代码至少需要2个字符')
    .max(10, '语言代码不能超过10个字符')
    .optional(),
});

// 密码更改验证模式
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, '当前密码不能为空'),
  newPassword: z
    .string()
    .min(8, '新密码至少需要8个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '新密码必须包含至少一个小写字母、一个大写字母和一个数字'
    ),
  confirmNewPassword: z.string(),
}).refine(
  data => data.newPassword === data.confirmNewPassword,
  {
    message: '新密码确认不匹配',
    path: ['confirmNewPassword'],
  }
);

// 用户偏好设置验证模式
export const userPreferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    digest: z.boolean(),
  }).optional(),
  content: z.object({
    categories: z.array(z.string()),
    sources: z.array(z.string()),
    keywords: z.array(z.string()),
  }).optional(),
  display: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    language: z.string(),
    timezone: z.string(),
    itemsPerPage: z.number().min(5).max(100),
  }).optional(),
  ai: z.object({
    enableAutoSummary: z.boolean(),
    enableSmartFiltering: z.boolean(),
    confidenceThreshold: z.number().min(0).max(1),
  }).optional(),
});

// 导出验证模式的类型
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
