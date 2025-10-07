import { Request, Response } from 'express';
export declare class UserController {
    static getProfile(req: Request, res: Response): Promise<void>;
    static updateProfile(req: Request, res: Response): Promise<void>;
    static updatePreferences(req: Request, res: Response): Promise<void>;
    static getActivities(req: Request, res: Response): Promise<void>;
    static deleteAccount(req: Request, res: Response): Promise<void>;
    static getUsers(req: Request, res: Response): Promise<void>;
    static getUserById(req: Request, res: Response): Promise<void>;
    static updateUserStatus(req: Request, res: Response): Promise<void>;
    static updateUserRole(req: Request, res: Response): Promise<void>;
    static getUserStats(req: Request, res: Response): Promise<void>;
}
