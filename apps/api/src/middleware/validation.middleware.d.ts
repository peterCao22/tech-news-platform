import { Request, Response, NextFunction } from 'express';
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const validationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
