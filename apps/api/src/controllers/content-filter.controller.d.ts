import { Request, Response, NextFunction } from 'express';
export declare class ContentFilterController {
    /**
     * 获取当前过滤配置
     */
    getFilterConfig(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 更新过滤配置
     */
    updateFilterConfig(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 测试内容过滤
     */
    testContentFilter(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 批量测试内容过滤
     */
    batchTestContentFilter(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * 获取预设的过滤规则模板
     */
    getFilterTemplates(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const contentFilterController: ContentFilterController;
