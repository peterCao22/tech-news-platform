// 科技新闻聚合平台 - 用户个人资料页面
// 用户资料管理和设置界面

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Lock, 
  Settings, 
  Bell, 
  Globe, 
  Clock,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Shield
} from 'lucide-react';

import { userApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// 个人资料表单验证模式
const profileSchema = z.object({
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
  timezone: z.string().optional(),
  language: z.string().optional(),
});

// 密码更改表单验证模式
const passwordSchema = z.object({
  currentPassword: z.string().min(1, '当前密码不能为空'),
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

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      digest: true,
    },
    content: {
      categories: ['AI', 'Technology', 'Startups'],
      autoSummary: true,
      smartFiltering: true,
    },
    display: {
      theme: 'light',
      itemsPerPage: 20,
    },
  });

  // 个人资料表单
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      timezone: user?.timezone || 'Asia/Shanghai',
      language: user?.language || 'zh-CN',
    },
  });

  // 密码更改表单
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // 加载用户偏好设置
  useEffect(() => {
    if (user?.preferences) {
      setPreferences(prev => ({ ...prev, ...user.preferences }));
    }
  }, [user]);

  // 更新个人资料
  const onUpdateProfile = async (data: ProfileFormData) => {
    try {
      const response = await userApi.updateProfile(data);
      
      if (response.success && response.data) {
        updateUser(response.data.user);
        toast.success('个人资料更新成功');
      }
    } catch (error: any) {
      toast.error(error.message || '更新个人资料失败');
    }
  };

  // 更改密码
  const onChangePassword = async (data: PasswordFormData) => {
    try {
      const response = await authApi.changePassword(data);
      
      if (response.success) {
        toast.success('密码更改成功');
        passwordForm.reset();
      }
    } catch (error: any) {
      toast.error(error.message || '密码更改失败');
    }
  };

  // 更新偏好设置
  const updatePreferences = async (newPreferences: typeof preferences) => {
    try {
      const response = await userApi.updatePreferences(newPreferences);
      
      if (response.success) {
        setPreferences(newPreferences);
        updateUser({ preferences: newPreferences });
        toast.success('偏好设置已保存');
      }
    } catch (error: any) {
      toast.error(error.message || '保存偏好设置失败');
    }
  };

  if (!user) {
    return <div>加载中...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">个人设置</h1>
        <p className="text-gray-600 mt-2">管理您的账户信息和偏好设置</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            个人资料
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            安全设置
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            偏好设置
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            通知设置
          </TabsTrigger>
        </TabsList>

        {/* 个人资料标签页 */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>
                更新您的个人资料信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                {/* 邮箱显示（只读） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      value={user.email}
                      disabled
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    邮箱地址无法更改。如需更改，请联系客服。
                  </p>
                </div>

                {/* 姓名输入 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      名字
                    </label>
                    <Input
                      {...profileForm.register('firstName')}
                      placeholder="输入名字"
                      error={!!profileForm.formState.errors.firstName}
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">
                        {profileForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      姓氏
                    </label>
                    <Input
                      {...profileForm.register('lastName')}
                      placeholder="输入姓氏"
                      error={!!profileForm.formState.errors.lastName}
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {profileForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* 个人简介 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    个人简介
                  </label>
                  <Textarea
                    {...profileForm.register('bio')}
                    placeholder="介绍一下您自己..."
                    rows={4}
                    error={!!profileForm.formState.errors.bio}
                  />
                  {profileForm.formState.errors.bio && (
                    <p className="text-sm text-red-600 mt-1">
                      {profileForm.formState.errors.bio.message}
                    </p>
                  )}
                </div>

                {/* 时区和语言 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      时区
                    </label>
                    <Select
                      value={profileForm.watch('timezone')}
                      onValueChange={(value) => profileForm.setValue('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择时区" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Shanghai">北京时间 (UTC+8)</SelectItem>
                        <SelectItem value="America/New_York">纽约时间 (UTC-5)</SelectItem>
                        <SelectItem value="Europe/London">伦敦时间 (UTC+0)</SelectItem>
                        <SelectItem value="Asia/Tokyo">东京时间 (UTC+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      语言
                    </label>
                    <Select
                      value={profileForm.watch('language')}
                      onValueChange={(value) => profileForm.setValue('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择语言" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                        <SelectItem value="zh-TW">繁体中文</SelectItem>
                        <SelectItem value="en-US">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={profileForm.formState.isSubmitting}
                    loading={profileForm.formState.isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    保存更改
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置标签页 */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* 密码更改 */}
            <Card>
              <CardHeader>
                <CardTitle>更改密码</CardTitle>
                <CardDescription>
                  定期更改密码以保护您的账户安全
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                  {/* 当前密码 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      当前密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        {...passwordForm.register('currentPassword')}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="pl-10 pr-10"
                        placeholder="输入当前密码"
                        error={!!passwordForm.formState.errors.currentPassword}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  {/* 新密码 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        {...passwordForm.register('newPassword')}
                        type={showNewPassword ? 'text' : 'password'}
                        className="pl-10 pr-10"
                        placeholder="输入新密码"
                        error={!!passwordForm.formState.errors.newPassword}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* 确认新密码 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认新密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        {...passwordForm.register('confirmNewPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="pl-10 pr-10"
                        placeholder="再次输入新密码"
                        error={!!passwordForm.formState.errors.confirmNewPassword}
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
                    {passwordForm.formState.errors.confirmNewPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.confirmNewPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                      loading={passwordForm.formState.isSubmitting}
                    >
                      更改密码
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 账户状态 */}
            <Card>
              <CardHeader>
                <CardTitle>账户状态</CardTitle>
                <CardDescription>
                  查看您的账户安全状态
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">邮箱验证</p>
                    <p className="text-sm text-gray-500">
                      {user.emailVerified ? '已验证' : '未验证'}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.emailVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.emailVerified ? '已验证' : '待验证'}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">账户状态</p>
                    <p className="text-sm text-gray-500">
                      {user.status === 'ACTIVE' ? '正常' : user.status}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'ACTIVE' ? '正常' : user.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 偏好设置标签页 */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>内容偏好</CardTitle>
              <CardDescription>
                自定义您的内容体验
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI自动摘要</p>
                  <p className="text-sm text-gray-500">
                    为长文章生成智能摘要
                  </p>
                </div>
                <Switch
                  checked={preferences.content.autoSummary}
                  onCheckedChange={(checked) => {
                    const newPrefs = {
                      ...preferences,
                      content: { ...preferences.content, autoSummary: checked }
                    };
                    updatePreferences(newPrefs);
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">智能筛选</p>
                  <p className="text-sm text-gray-500">
                    基于您的兴趣智能筛选内容
                  </p>
                </div>
                <Switch
                  checked={preferences.content.smartFiltering}
                  onCheckedChange={(checked) => {
                    const newPrefs = {
                      ...preferences,
                      content: { ...preferences.content, smartFiltering: checked }
                    };
                    updatePreferences(newPrefs);
                  }}
                />
              </div>

              <Separator />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每页显示条目数
                </label>
                <Select
                  value={preferences.display.itemsPerPage.toString()}
                  onValueChange={(value) => {
                    const newPrefs = {
                      ...preferences,
                      display: { ...preferences.display, itemsPerPage: parseInt(value) }
                    };
                    updatePreferences(newPrefs);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置标签页 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知偏好</CardTitle>
              <CardDescription>
                管理您接收通知的方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">邮件通知</p>
                  <p className="text-sm text-gray-500">
                    接收重要更新的邮件通知
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.email}
                  onCheckedChange={(checked) => {
                    const newPrefs = {
                      ...preferences,
                      notifications: { ...preferences.notifications, email: checked }
                    };
                    updatePreferences(newPrefs);
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">每日摘要</p>
                  <p className="text-sm text-gray-500">
                    每日TOP10内容摘要推送
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.digest}
                  onCheckedChange={(checked) => {
                    const newPrefs = {
                      ...preferences,
                      notifications: { ...preferences.notifications, digest: checked }
                    };
                    updatePreferences(newPrefs);
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">浏览器推送</p>
                  <p className="text-sm text-gray-500">
                    重要内容的浏览器推送通知
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.push}
                  onCheckedChange={(checked) => {
                    const newPrefs = {
                      ...preferences,
                      notifications: { ...preferences.notifications, push: checked }
                    };
                    updatePreferences(newPrefs);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
