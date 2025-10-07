import { Request, Response, NextFunction } from 'express';
export declare class InputSanitizer {
    static escapeHtml(text: string): string;
    static stripHtml(text: string): string;
    static sanitizeString(text: string, options?: {
        allowHtml?: boolean;
        maxLength?: number;
        trimWhitespace?: boolean;
    }): string;
    static sanitizeObject(obj: any, rules?: Record<string, {
        type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
        required?: boolean;
        maxLength?: number;
        allowHtml?: boolean;
        pattern?: RegExp;
    }>): any;
    static detectSqlInjection(text: string): boolean;
    static detectXss(text: string): boolean;
}
export declare const sanitizeInput: (rules?: Record<string, any>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const ValidationRules: {
    userRegistration: {
        email: {
            type: "email";
            required: boolean;
            maxLength: number;
        };
        password: {
            type: "string";
            required: boolean;
            maxLength: number;
        };
        name: {
            type: "string";
            maxLength: number;
        };
        firstName: {
            type: "string";
            maxLength: number;
        };
        lastName: {
            type: "string";
            maxLength: number;
        };
    };
    userLogin: {
        email: {
            type: "email";
            required: boolean;
            maxLength: number;
        };
        password: {
            type: "string";
            required: boolean;
            maxLength: number;
        };
        remember: {
            type: "boolean";
        };
    };
    profileUpdate: {
        name: {
            type: "string";
            maxLength: number;
        };
        firstName: {
            type: "string";
            maxLength: number;
        };
        lastName: {
            type: "string";
            maxLength: number;
        };
        bio: {
            type: "string";
            maxLength: number;
        };
        timezone: {
            type: "string";
            maxLength: number;
        };
        language: {
            type: "string";
            maxLength: number;
        };
    };
    passwordReset: {
        email: {
            type: "email";
            required: boolean;
            maxLength: number;
        };
    };
    passwordChange: {
        currentPassword: {
            type: "string";
            required: boolean;
            maxLength: number;
        };
        newPassword: {
            type: "string";
            required: boolean;
            maxLength: number;
        };
        confirmNewPassword: {
            type: "string";
            required: boolean;
            maxLength: number;
        };
    };
};
