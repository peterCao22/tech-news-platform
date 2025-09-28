// 科技新闻聚合平台 - 重置密码页面
// 密码重置确认页面

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Key } from 'lucide-react';

import { authApi } from '@/lib/api';
import { Button } from '@tech-news-platform/ui';
import { Input } from '@tech-news-platform/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tech-news-platform/ui';

// 重置密码表单验证模式
const resetPasswordSchema = z.object({
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

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isResetComplete, setIsResetComplete] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchedPassword = watch('password');

  // 验证令牌有效性
  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      return;
    }

    // 这里应该调用API验证令牌，简化实现
    setIsTokenValid(true);
  }, [token]);

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

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('重置令牌无效');
      return;
    }

    try {
      const response = await authApi.resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      
      if (response.success) {
        setIsResetComplete(true);
        toast.success('密码重置成功！');
      }
    } catch (error: any) {
      toast.error(error.message || '密码重置失败');
    }
  };

  // 令牌无效
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              科技新闻聚合平台
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              AI驱动的智能新闻筛选系统
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-red-600">链接无效</CardTitle>
              <CardDescription>
                重置链接无效或已过期
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                重置链接可能已过期或无效。请重新申请密码重置。
              </p>
              <div className="flex flex-col space-y-3">
                <Link href="/auth/forgot-password">
                  <Button className="w-full">
                    重新申请密码重置
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    返回登录页面
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 重置完成
  if (isResetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              科技新闻聚合平台
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              AI驱动的智能新闻筛选系统
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-600">密码重置成功</CardTitle>
              <CardDescription>
                您的密码已成功重置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                您现在可以使用新密码登录您的账户。
              </p>
              <Link href="/auth/login">
                <Button className="w-full">
                  立即登录
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 加载中
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">验证重置链接...</p>
        </div>
      </div>
    );
  }

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

        {/* 重置密码表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              设置新密码
            </CardTitle>
            <CardDescription>
              请输入您的新密码
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 新密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  新密码
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="pl-10 pr-10"
                    placeholder="输入新密码"
                    error={!!errors.password}
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
                  确认新密码
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="pl-10 pr-10"
                    placeholder="再次输入新密码"
                    error={!!errors.confirmPassword}
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

              {/* 密码要求提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">密码要求：</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      watchedPassword && watchedPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    至少8个字符
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      watchedPassword && /[a-z]/.test(watchedPassword) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    包含小写字母
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      watchedPassword && /[A-Z]/.test(watchedPassword) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    包含大写字母
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      watchedPassword && /\d/.test(watchedPassword) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    包含数字
                  </li>
                </ul>
              </div>

              {/* 重置按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? '重置中...' : '重置密码'}
              </Button>
            </form>

            {/* 返回登录链接 */}
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                返回登录页面
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
