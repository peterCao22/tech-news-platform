// 科技新闻聚合平台 - 用户数据访问层
// 用户相关的数据库操作封装

import { hash, compare } from 'bcryptjs';
import { db, User, UserRole, UserStatus } from '../client';
import { CreateUserInput, UpdateUserInput, UserWithProfile } from '../types/user.types';

export class UserRepository {
  // 创建新用户
  static async create(input: CreateUserInput): Promise<User> {
    const hashedPassword = input.password 
      ? await hash(input.password, 12)
      : null;

    return await db.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || UserRole.USER,
        status: UserStatus.PENDING,
        preferences: input.preferences || {},
        timezone: input.timezone || 'UTC',
        language: input.language || 'zh-CN',
      },
    });
  }

  // 根据ID查找用户
  static async findById(id: string): Promise<UserWithProfile | null> {
    return await db.user.findUnique({
      where: { id },
      include: {
        accounts: true,
        sessions: true,
      },
    });
  }

  // 根据邮箱查找用户
  static async findByEmail(email: string): Promise<User | null> {
    return await db.user.findUnique({
      where: { email },
    });
  }

  // 验证用户密码
  static async validatePassword(
    email: string, 
    password: string
  ): Promise<User | null> {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isValid = await compare(password, user.password);
    return isValid ? user : null;
  }

  // 更新用户信息
  static async update(id: string, input: UpdateUserInput): Promise<User> {
    const updateData: any = { ...input };

    // 如果更新密码，需要加密
    if (input.password) {
      updateData.password = await hash(input.password, 12);
    }

    return await db.user.update({
      where: { id },
      data: updateData,
    });
  }

  // 验证用户邮箱
  static async verifyEmail(id: string): Promise<User> {
    return await db.user.update({
      where: { id },
      data: {
        emailVerified: new Date(),
        status: UserStatus.ACTIVE,
      },
    });
  }

  // 更新最后登录时间
  static async updateLastLogin(id: string): Promise<void> {
    await db.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  // 获取用户列表（管理员功能）
  static async findMany(options: {
    skip?: number;
    take?: number;
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  } = {}): Promise<{ users: User[]; total: number }> {
    const { skip = 0, take = 20, role, status, search } = options;

    const where: any = {};
    
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ]);

    return { users, total };
  }

  // 删除用户（软删除 - 更改状态）
  static async softDelete(id: string): Promise<User> {
    return await db.user.update({
      where: { id },
      data: {
        status: UserStatus.SUSPENDED,
      },
    });
  }

  // 硬删除用户（谨慎使用）
  static async hardDelete(id: string): Promise<void> {
    await db.user.delete({
      where: { id },
    });
  }

  // 检查用户权限
  static async hasPermission(
    userId: string, 
    requiredRole: UserRole
  ): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return false;
    }

    // 权限层级: ADMIN > EDITOR > USER
    const roleHierarchy = {
      [UserRole.USER]: 0,
      [UserRole.EDITOR]: 1,
      [UserRole.ADMIN]: 2,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  // 获取用户统计信息
  static async getStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byRole: Record<UserRole, number>;
  }> {
    const [total, active, pending, suspended, byRole] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: UserStatus.ACTIVE } }),
      db.user.count({ where: { status: UserStatus.PENDING } }),
      db.user.count({ where: { status: UserStatus.SUSPENDED } }),
      db.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    const roleStats = byRole.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<UserRole, number>);

    return {
      total,
      active,
      pending,
      suspended,
      byRole: roleStats,
    };
  }
}
