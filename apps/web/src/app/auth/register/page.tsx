// 科技新闻聚合平台 - 注册页面
// 用户注册界面和逻辑

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Check } from 'lucide-react';

import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@tech-news-platform/ui';
import { Input } from '@tech-news-platform/ui';
import { Checkbox } from '@tech-news-platform/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tech-news-platform/ui';

// 注册表单验证模式
const registerSchema = z.object({
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

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setTokens, setLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  // 检查邮箱是否已存在
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      setCheckingEmail(true);
      const response = await authApi.checkEmail(email);
      
      if (response.success && response.data?.exists) {
        setEmailExists(true);
        setError('email', {
          type: 'manual',
          message: '该邮箱已被注册',
        });
      } else {
        setEmailExists(false);
        clearErrors('email');
      }
    } catch (error) {
      // 忽略检查错误
    } finally {
      setCheckingEmail(false);
    }
  };

  // 密码强度检查
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (score < 3) return { score, text: '弱', color: 'text-red-500' };
    if (score < 4) return { score, text: '中等', color: 'text-yellow-500' };
    return { score, text: '强', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(watchedPassword || '');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      
      const response = await authApi.register({
        email: data.email!,
        password: data.password!,
        confirmPassword: data.confirmPassword!,
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        acceptTerms: data.acceptTerms!
      });
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        // 更新认证状态
        setUser(user);
        setTokens(token, refreshToken);
        
        toast.success('注册成功！请查收验证邮件');
        
        // 重定向到邮箱验证提示页面
        router.push('/auth/verify-email');
      }
    } catch (error: any) {
      toast.error(error.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 头部 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            科技新闻聚合平台
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            AI驱动的智能新闻筛选系统
          </p>
        </div>

        {/* 注册表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              创建账户
            </CardTitle>
            <CardDescription>
              填写信息创建您的账户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 邮箱输入 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  邮箱地址 *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                    onBlur={(e) => checkEmailExists(e.target.value)}
                  />
                  {checkingEmail && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* 姓名输入 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    名字
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('firstName')}
                      type="text"
                      autoComplete="given-name"
                      className="pl-10"
                      placeholder="名字"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    姓氏
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('lastName')}
                      type="text"
                      autoComplete="family-name"
                      placeholder="姓氏"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* 密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  密码 *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="pl-10 pr-10"
                    placeholder="输入密码"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* 密码强度指示器 */}
                {watchedPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score < 3 ? 'bg-red-500' :
                            passwordStrength.score < 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* 确认密码输入 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  确认密码 *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="pl-10 pr-10"
                    placeholder="再次输入密码"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* 服务条款同意 */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    {...register('acceptTerms')}
                    id="acceptTerms"
type="checkbox"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="text-gray-700">
                    我同意{' '}
                    <Link
                      href="/terms"
                      className="text-primary-600 hover:text-primary-500"
                      target="_blank"
                    >
                      服务条款
                    </Link>{' '}
                    和{' '}
                    <Link
                      href="/privacy"
                      className="text-primary-600 hover:text-primary-500"
                      target="_blank"
                    >
                      隐私政策
                    </Link>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-1 text-red-600">{errors.acceptTerms.message}</p>
                  )}
                </div>
              </div>

              {/* 注册按钮 */}
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || emailExists}
              >
                {isSubmitting ? '注册中...' : '创建账户'}
              </button>
            </form>

            {/* 登录链接 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                已有账户？{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 功能特色 */}
        <div className="text-center">
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                <Check className="h-4 w-4 text-primary-600" />
              </div>
              <span>AI智能筛选</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                <Check className="h-4 w-4 text-primary-600" />
              </div>
              <span>每日TOP10</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                <Check className="h-4 w-4 text-primary-600" />
              </div>
              <span>个性化推荐</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
