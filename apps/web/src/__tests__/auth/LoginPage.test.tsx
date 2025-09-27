// 科技新闻聚合平台 - 登录页面测试
// 测试登录页面的功能和用户交互

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import LoginPage from '@/app/auth/login/page';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

// 模拟依赖
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

// 模拟UI组件
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, loading, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      data-testid="button"
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ error, ...props }: any) => (
    <input
      data-testid={props.name || 'input'}
      className={error ? 'error' : ''}
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: (props: any) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockSetUser = jest.fn();
  const mockSetTokens = jest.fn();
  const mockSetLoading = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useAuthStore as jest.Mock).mockReturnValue({
      setUser: mockSetUser,
      setTokens: mockSetTokens,
      setLoading: mockSetLoading,
    });
  });

  it('应该渲染登录表单', () => {
    render(<LoginPage />);

    expect(screen.getByText('科技新闻聚合平台')).toBeInTheDocument();
    expect(screen.getByText('登录账户')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    expect(screen.getByText('登录')).toBeInTheDocument();
  });

  it('应该显示验证错误', async () => {
    render(<LoginPage />);

    const submitButton = screen.getByText('登录');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('邮箱不能为空')).toBeInTheDocument();
      expect(screen.getByText('密码不能为空')).toBeInTheDocument();
    });
  });

  it('应该成功登录', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      status: 'ACTIVE',
    };

    const mockResponse = {
      success: true,
      data: {
        user: mockUser,
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      },
    };

    (authApi.login as jest.Mock).mockResolvedValue(mockResponse);

    render(<LoginPage />);

    // 填写表单
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'Password123' },
    });

    // 提交表单
    fireEvent.click(screen.getByText('登录'));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
        remember: false,
      });
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      expect(mockSetTokens).toHaveBeenCalledWith('jwt-token', 'refresh-token');
      expect(toast.success).toHaveBeenCalledWith('登录成功！');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('应该处理登录失败', async () => {
    const mockError = {
      message: '邮箱或密码错误',
    };

    (authApi.login as jest.Mock).mockRejectedValue(mockError);

    render(<LoginPage />);

    // 填写表单
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'wrongpassword' },
    });

    // 提交表单
    fireEvent.click(screen.getByText('登录'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('邮箱或密码错误');
      expect(mockSetUser).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('应该切换密码可见性', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByTestId('password');
    const toggleButton = screen.getByRole('button', { name: /toggle password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('应该处理记住我选项', async () => {
    const mockResponse = {
      success: true,
      data: {
        user: { id: 'user-1' },
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      },
    };

    (authApi.login as jest.Mock).mockResolvedValue(mockResponse);

    render(<LoginPage />);

    // 填写表单并选中记住我
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'Password123' },
    });
    fireEvent.click(screen.getByTestId('checkbox'));

    // 提交表单
    fireEvent.click(screen.getByText('登录'));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
        remember: true,
      });
    });
  });

  it('应该显示加载状态', async () => {
    // 模拟延迟的API调用
    (authApi.login as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<LoginPage />);

    // 填写表单
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'Password123' },
    });

    // 提交表单
    fireEvent.click(screen.getByText('登录'));

    // 应该显示加载状态
    expect(screen.getByText('登录中...')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeDisabled();
  });

  it('应该有正确的链接', () => {
    render(<LoginPage />);

    expect(screen.getByText('忘记密码？')).toHaveAttribute('href', '/auth/forgot-password');
    expect(screen.getByText('立即注册')).toHaveAttribute('href', '/auth/register');
    expect(screen.getByText('服务条款')).toHaveAttribute('href', '/terms');
    expect(screen.getByText('隐私政策')).toHaveAttribute('href', '/privacy');
  });
});
