// 科技新闻聚合平台 - 用户个人资料页面
// 用户资料管理和设置界面

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Lock, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tech-news-platform/ui';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // 表单状态
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    
    setName(user.name || '');
    setEmail(user.email || '');
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('个人资料已更新（演示）');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    toast.success('密码已更新（演示）');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">个人设置</h1>
          <p className="text-gray-600 mt-2">管理您的账户信息和偏好设置</p>
        </div>

        <div className="space-y-6">
          {/* 个人资料卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                个人资料
              </CardTitle>
              <CardDescription>更新您的个人信息</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入姓名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    角色
                  </label>
                  <Input
                    type="text"
                    value={user?.role === 'ADMIN' ? '管理员' : user?.role === 'EDITOR' ? '编辑' : '用户'}
                    disabled
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    保存更改
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 修改密码卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                修改密码
              </CardTitle>
              <CardDescription>更新您的账户密码</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    当前密码
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="请输入当前密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新密码
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    确认新密码
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">
                    <Lock className="h-4 w-4 mr-2" />
                    更新密码
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 账户信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                账户信息
              </CardTitle>
              <CardDescription>您的账户详细信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">用户ID:</span>
                  <span className="font-mono text-gray-900">{user?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">账户状态:</span>
                  <span className="text-green-600 font-medium">
                    {user?.status === 'ACTIVE' ? '激活' : '未激活'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">注册时间:</span>
                  <span className="text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

