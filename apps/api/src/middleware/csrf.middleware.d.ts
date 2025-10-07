import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            csrfToken?: string;
        }
    }
}
export declare class CSRFProtection {
    static generateToken(sessionId: string): string;
    static validateToken(sessionId: string, token: string): boolean;
    static middleware(): (req: Request, res: Response, next: NextFunction) => void;
    static getTokenHandler(): (req: Request, res: Response) => void;
}
export declare const csrfProtection: (req: Request, res: Response, next: NextFunction) => void;
export declare const csrfTokenRoute: (req: Request, res: Response) => void;
