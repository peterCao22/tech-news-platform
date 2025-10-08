import { User, UserRole, UserStatus } from '../client';
import { CreateUserInput, UpdateUserInput, UserWithProfile } from '../types/user.types';
export declare class UserRepository {
    static create(input: CreateUserInput): Promise<User>;
    static findById(id: string): Promise<UserWithProfile | null>;
    static findByEmail(email: string): Promise<User | null>;
    static validatePassword(email: string, password: string): Promise<User | null>;
    static update(id: string, input: UpdateUserInput): Promise<User>;
    static verifyEmail(id: string): Promise<User>;
    static updateLastLogin(id: string): Promise<void>;
    static findMany(options?: {
        skip?: number;
        take?: number;
        role?: UserRole;
        status?: UserStatus;
        search?: string;
    }): Promise<{
        users: User[];
        total: number;
    }>;
    static softDelete(id: string): Promise<User>;
    static hardDelete(id: string): Promise<void>;
    static hasPermission(userId: string, requiredRole: UserRole): Promise<boolean>;
    static getStats(): Promise<{
        total: number;
        active: number;
        pending: number;
        suspended: number;
        byRole: Record<UserRole, number>;
    }>;
}
