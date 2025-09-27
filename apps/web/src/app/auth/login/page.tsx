// 科技新闻聚合平台 - 登录页面
// 用户登录界面和逻辑

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';

import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@tech-news-platform/ui';
import { Input } from '@tech-news-platform/ui';
import { Checkbox } from '@tech-news-platform/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tech-news-platform/ui';

// 登录表单验证模式
const loginSchema = z.object({
  email: z
    .string()
    .email('请输入有效的邮箱地址')
    .min(1, '邮箱不能为空'),
  password: z
    .string()
    .min(1, '密码不能为空'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens, setLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      
      const response = await authApi.login({
        email: data.email!,
        password: data.password!,
        remember: data.remember
      });
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        // 更新认证状态
        setUser(user);
        setTokens(token, refreshToken);
        
        toast.success('登录成功！');
        
        // 重定向到仪表板
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || '登录失败，请重试');
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

        {/* 登录表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              登录账户
            </CardTitle>
            <CardDescription>
              使用您的邮箱和密码登录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 邮箱输入 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  邮箱地址
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="pl-10"
                    placeholder="your@email.com"
                    error={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* 密码输入 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  密码
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="pl-10 pr-10"
                    placeholder="输入密码"
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* 记住我和忘记密码 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Checkbox
                    {...register('remember')}
                    id="remember"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    记住我
                  </label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  忘记密码？
                </Link>
              </div>

              {/* 登录按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                登录
              </Button>
            </form>

            {/* 注册链接 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                还没有账户？{' '}
                <Link
                  href="/auth/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            登录即表示您同意我们的{' '}
            <Link href="/terms" className="text-primary-600 hover:text-primary-500">
              服务条款
            </Link>{' '}
            和{' '}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
              隐私政策
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
