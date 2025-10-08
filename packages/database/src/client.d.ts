import { PrismaClient } from './generated';
declare global {
    var __prisma: PrismaClient | undefined;
}
export declare const db: PrismaClient<import("@/database/generated/default").Prisma.PrismaClientOptions, never, import("packages/database/dist/generated/runtime/library").DefaultArgs>;
export declare const prisma: PrismaClient<import("@/database/generated/default").Prisma.PrismaClientOptions, never, import("packages/database/dist/generated/runtime/library").DefaultArgs>;
export declare const checkDatabaseConnection: () => Promise<boolean>;
export declare const closeDatabaseConnection: () => Promise<void>;
export declare const withTransaction: <T>(fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>) => Promise<T>;
export type { User, Account, Session, VerificationToken, PasswordResetToken, Source, Content, ContentReview, DailyDigest, UserActivity, AITask, SystemConfig, ApiConfiguration, ApiCallLog, Prisma } from './generated';
export { UserRole, UserStatus, SourceType, SourceStatus, ContentStatus, ReviewAction, ApiConfigStatus, ApiAuthType } from './generated';
