// 科技新闻聚合平台 - 邮箱验证页面
// 邮箱验证提示和处理页面

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@tech-news-platform/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tech-news-platform/ui';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuthStore();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [countdown, setCountdown] = useState(0);

  const token = searchParams.get('token');

  // 自动验证令牌
  useEffect(() => {
    if (token) {
      verifyEmailToken(token);
    }
  }, [token]);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const verifyEmailToken = async (verificationToken: string) => {
    try {
      setIsVerifying(true);
      
      const response = await authApi.verifyEmail(verificationToken);
      
      if (response.success) {
        setVerificationStatus('success');
        
        // 更新用户状态
        if (user) {
          updateUser({
            emailVerified: new Date(),
            status: 'ACTIVE',
          });
        }
        
        toast.success('邮箱验证成功！');
        
        // 3秒后跳转到仪表板
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (error: any) {
      setVerificationStatus('error');
      toast.error(error.message || '邮箱验证失败');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) {
      toast.error('用户邮箱信息不存在');
      return;
    }

    try {
      setIsResending(true);
      
      const response = await authApi.resendVerification(user.email);
      
      if (response.success) {
        toast.success('验证邮件已重新发送');
        setCountdown(60); // 60秒倒计时
      }
    } catch (error: any) {
      toast.error(error.message || '发送验证邮件失败');
    } finally {
      setIsResending(false);
    }
  };

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // 如果邮箱已验证，重定向到仪表板
  if (user.emailVerified && verificationStatus !== 'success') {
    router.push('/dashboard');
    return null;
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

        {/* 验证状态卡片 */}
        <Card>
          <CardHeader className="text-center">
            {verificationStatus === 'pending' && !isVerifying && (
              <>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>验证您的邮箱</CardTitle>
                <CardDescription>
                  我们已向 <strong>{user.email}</strong> 发送了验证邮件
                </CardDescription>
              </>
            )}

            {isVerifying && (
              <>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <CardTitle>正在验证...</CardTitle>
                <CardDescription>
                  请稍候，我们正在验证您的邮箱
                </CardDescription>
              </>
            )}

            {verificationStatus === 'success' && (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-green-600">验证成功！</CardTitle>
                <CardDescription>
                  您的邮箱已成功验证，即将跳转到仪表板...
                </CardDescription>
              </>
            )}

            {verificationStatus === 'error' && (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-red-600">验证失败</CardTitle>
                <CardDescription>
                  验证链接可能已过期或无效，请重新发送验证邮件
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {verificationStatus === 'pending' && !token && (
              <>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>请按照以下步骤完成邮箱验证：</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>检查您的邮箱收件箱</li>
                    <li>查找来自科技新闻聚合平台的邮件</li>
                    <li>点击邮件中的验证链接</li>
                    <li>如果没有收到邮件，请检查垃圾邮件文件夹</li>
                  </ol>
                </div>

                <div className="flex flex-col space-y-3">
                  <Button
                    onClick={resendVerificationEmail}
                    disabled={isResending || countdown > 0}
                    loading={isResending}
                    variant="outline"
                    className="w-full"
                  >
                    {countdown > 0 
                      ? `重新发送 (${countdown}s)` 
                      : isResending 
                        ? '发送中...' 
                        : '重新发送验证邮件'
                    }
                  </Button>

                  <Button
                    onClick={() => router.push('/dashboard')}
                    variant="ghost"
                    className="w-full"
                  >
                    稍后验证，先进入系统
                  </Button>
                </div>
              </>
            )}

            {verificationStatus === 'error' && (
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={resendVerificationEmail}
                  disabled={isResending || countdown > 0}
                  loading={isResending}
                  className="w-full"
                >
                  {countdown > 0 
                    ? `重新发送 (${countdown}s)` 
                    : isResending 
                      ? '发送中...' 
                      : '重新发送验证邮件'
                  }
                </Button>

                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  返回仪表板
                </Button>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="text-center">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  立即进入仪表板
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 帮助信息 */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            遇到问题？{' '}
            <Link
              href="/support"
              className="text-primary-600 hover:text-primary-500"
            >
              联系客服
            </Link>{' '}
            或{' '}
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-500"
            >
              重新登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
