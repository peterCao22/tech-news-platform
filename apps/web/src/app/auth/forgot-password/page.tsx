// 科技新闻聚合平台 - 忘记密码页面
// 密码重置请求页面

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

import { authApi } from '@/lib/api';
import { Button } from '@tech-news-platform/ui';
import { Input } from '@tech-news-platform/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tech-news-platform/ui';

// 忘记密码表单验证模式
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('请输入有效的邮箱地址')
    .min(1, '邮箱不能为空'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await authApi.forgotPassword(data.email);
      
      if (response.success) {
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
        toast.success('密码重置邮件已发送');
      }
    } catch (error: any) {
      toast.error(error.message || '发送重置邮件失败');
    }
  };

  if (isSubmitted) {
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

          {/* 成功提示卡片 */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-600">邮件已发送</CardTitle>
              <CardDescription>
                我们已向 <strong>{submittedEmail}</strong> 发送了密码重置链接
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>请按照以下步骤重置您的密码：</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>检查您的邮箱收件箱</li>
                  <li>查找来自科技新闻聚合平台的邮件</li>
                  <li>点击邮件中的重置链接</li>
                  <li>设置新密码</li>
                </ol>
                <p className="text-xs text-gray-500 mt-4">
                  重置链接将在1小时后失效。如果没有收到邮件，请检查垃圾邮件文件夹。
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setSubmittedEmail('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  重新发送到其他邮箱
                </Button>

                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full">
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

        {/* 忘记密码表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              重置密码
            </CardTitle>
            <CardDescription>
              输入您的邮箱地址，我们将发送重置链接
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

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? '发送中...' : '发送重置链接'}
              </Button>
            </form>

            {/* 返回登录链接 */}
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回登录页面
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 帮助信息 */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            如果您记起了密码，可以直接{' '}
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-500"
            >
              登录
            </Link>
            。如果遇到问题，请{' '}
            <Link
              href="/support"
              className="text-primary-600 hover:text-primary-500"
            >
              联系客服
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
