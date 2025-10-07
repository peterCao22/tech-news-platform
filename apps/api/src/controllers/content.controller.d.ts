import { Request, Response, NextFunction } from 'express';
export declare class ContentController {
    /**
     * 获取内容列表（支持分页和筛选）
     */
    getContents: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * 根据ID获取内容详情
     */
    getContent: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 更新内容
     */
    updateContent: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 删除内容
     */
    deleteContent: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 批量更新内容状态
     */
    batchUpdateStatus: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取内容统计信息
     */
    getContentStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * 搜索内容
     */
    searchContent: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取最近内容
     */
    getRecentContent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const contentController: ContentController;
