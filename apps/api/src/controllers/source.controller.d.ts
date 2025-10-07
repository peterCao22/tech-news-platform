import { Request, Response, NextFunction } from 'express';
export declare class SourceController {
    /**
     * 获取所有信息源
     */
    getSources: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * 根据ID获取信息源详情
     */
    getSource: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 创建新的信息源
     */
    createSource: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 更新信息源
     */
    updateSource: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 删除信息源
     */
    deleteSource: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 手动触发RSS源抓取
     */
    fetchSource: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 批量抓取所有活跃RSS源
     */
    fetchAllSources: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * 获取信息源统计信息
     */
    getSourceStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * 验证RSS URL
     */
    validateRSSUrl: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取源的内容列表
     */
    getSourceContent: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const sourceController: SourceController;
