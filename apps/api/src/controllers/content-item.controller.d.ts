/**
 * 内容管理控制器
 * 提供内容的CRUD操作、搜索、标签管理等功能
 */
import { Request, Response } from 'express';
export declare class ContentItemController {
    private contentService;
    private tagService;
    constructor();
    /**
     * 获取内容列表
     */
    getContent: (req: Request, res: Response) => Promise<void>;
    /**
     * 根据ID获取内容详情
     */
    getContentById: (req: Request, res: Response) => Promise<void>;
    /**
     * 创建内容
     */
    createContent: (req: Request, res: Response) => Promise<void>;
    /**
     * 更新内容
     */
    updateContent: (req: Request, res: Response) => Promise<void>;
    /**
     * 删除内容
     */
    deleteContent: (req: Request, res: Response) => Promise<void>;
    /**
     * 批量更新内容状态
     */
    updateContentStatus: (req: Request, res: Response) => Promise<void>;
    /**
     * 为内容添加标签
     */
    addContentTags: (req: Request, res: Response) => Promise<void>;
    /**
     * 移除内容标签
     */
    removeContentTags: (req: Request, res: Response) => Promise<void>;
    /**
     * 检查内容重复
     */
    checkDuplication: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取内容统计信息
     */
    getContentStatistics: (req: Request, res: Response) => Promise<void>;
    /**
     * 增加分享次数
     */
    shareContent: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取标签列表
     */
    getTags: (req: Request, res: Response) => Promise<void>;
    /**
     * 创建标签
     */
    createTag: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取标签建议
     */
    getTagSuggestions: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取热门标签
     */
    getPopularTags: (req: Request, res: Response) => Promise<void>;
}
