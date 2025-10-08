import { z } from 'zod';
import { User, Account, Session, UserRole, UserStatus } from '../client';
export interface UserPreferences {
    notifications: {
        email: boolean;
        push: boolean;
        digest: boolean;
    };
    content: {
        categories: string[];
        sources: string[];
        keywords: string[];
    };
    display: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        timezone: string;
        itemsPerPage: number;
    };
    ai: {
        enableAutoSummary: boolean;
        enableSmartFiltering: boolean;
        confidenceThreshold: number;
    };
}
export interface UserWithProfile extends User {
    accounts: Account[];
    sessions: Session[];
}
export interface CreateUserInput {
    email: string;
    password?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    preferences?: Partial<UserPreferences>;
    timezone?: string;
    language?: string;
}
export interface UpdateUserInput {
    email?: string;
    password?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    image?: string;
    preferences?: Partial<UserPreferences>;
    timezone?: string;
    language?: string;
    status?: UserStatus;
    role?: UserRole;
}
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    confirmPassword: string;
    acceptTerms: boolean;
    name?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    password: string;
    email: string;
    confirmPassword: string;
    acceptTerms: boolean;
    name?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}>, {
    password: string;
    email: string;
    confirmPassword: string;
    acceptTerms: boolean;
    name?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    password: string;
    email: string;
    confirmPassword: string;
    acceptTerms: boolean;
    name?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    remember: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    remember?: boolean | undefined;
}, {
    password: string;
    email: string;
    remember?: boolean | undefined;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    language?: string | undefined;
    name?: string | undefined;
    timezone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    bio?: string | undefined;
}, {
    language?: string | undefined;
    name?: string | undefined;
    timezone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    bio?: string | undefined;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmNewPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>;
export declare const userPreferencesSchema: z.ZodObject<{
    notifications: z.ZodOptional<z.ZodObject<{
        email: z.ZodBoolean;
        push: z.ZodBoolean;
        digest: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        push: boolean;
        email: boolean;
        digest: boolean;
    }, {
        push: boolean;
        email: boolean;
        digest: boolean;
    }>>;
    content: z.ZodOptional<z.ZodObject<{
        categories: z.ZodArray<z.ZodString, "many">;
        sources: z.ZodArray<z.ZodString, "many">;
        keywords: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        categories: string[];
        keywords: string[];
        sources: string[];
    }, {
        categories: string[];
        keywords: string[];
        sources: string[];
    }>>;
    display: z.ZodOptional<z.ZodObject<{
        theme: z.ZodEnum<["light", "dark", "auto"]>;
        language: z.ZodString;
        timezone: z.ZodString;
        itemsPerPage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        language: string;
        timezone: string;
        theme: "light" | "dark" | "auto";
        itemsPerPage: number;
    }, {
        language: string;
        timezone: string;
        theme: "light" | "dark" | "auto";
        itemsPerPage: number;
    }>>;
    ai: z.ZodOptional<z.ZodObject<{
        enableAutoSummary: z.ZodBoolean;
        enableSmartFiltering: z.ZodBoolean;
        confidenceThreshold: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        enableAutoSummary: boolean;
        enableSmartFiltering: boolean;
        confidenceThreshold: number;
    }, {
        enableAutoSummary: boolean;
        enableSmartFiltering: boolean;
        confidenceThreshold: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    content?: {
        categories: string[];
        keywords: string[];
        sources: string[];
    } | undefined;
    notifications?: {
        push: boolean;
        email: boolean;
        digest: boolean;
    } | undefined;
    display?: {
        language: string;
        timezone: string;
        theme: "light" | "dark" | "auto";
        itemsPerPage: number;
    } | undefined;
    ai?: {
        enableAutoSummary: boolean;
        enableSmartFiltering: boolean;
        confidenceThreshold: number;
    } | undefined;
}, {
    content?: {
        categories: string[];
        keywords: string[];
        sources: string[];
    } | undefined;
    notifications?: {
        push: boolean;
        email: boolean;
        digest: boolean;
    } | undefined;
    display?: {
        language: string;
        timezone: string;
        theme: "light" | "dark" | "auto";
        itemsPerPage: number;
    } | undefined;
    ai?: {
        enableAutoSummary: boolean;
        enableSmartFiltering: boolean;
        confidenceThreshold: number;
    } | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
