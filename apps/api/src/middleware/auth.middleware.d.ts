import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                status: string;
            };
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (requiredRole: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireEditor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const generateToken: (user: {
    id: string;
    email: string;
    role: string;
}) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const verifyRefreshToken: (token: string) => {
    userId: string;
} | null;
export declare class AuthMiddleware {
    /**
     * 认证中间件
     */
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * 授权中间件
     */
    authorize: (requiredRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
