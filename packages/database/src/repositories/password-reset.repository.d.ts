import { PasswordResetToken } from '../client';
export declare class PasswordResetRepository {
    static createToken(email: string): Promise<PasswordResetToken>;
    static validateToken(token: string): Promise<PasswordResetToken | null>;
    static markTokenAsUsed(token: string): Promise<void>;
    static cleanupExpiredTokens(): Promise<number>;
    static getActiveTokenByEmail(email: string): Promise<PasswordResetToken | null>;
    static revokeAllTokensForEmail(email: string): Promise<number>;
}
