export declare class EmailService {
    private static transporter;
    static sendVerificationEmail(email: string, userId: string): Promise<void>;
    static sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
    static sendWelcomeEmail(email: string, name: string): Promise<void>;
    static testConnection(): Promise<boolean>;
}
