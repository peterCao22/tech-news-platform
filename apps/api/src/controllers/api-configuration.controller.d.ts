import { Request, Response } from 'express';
/**
 * API配置控制器
 */
export declare class ApiConfigurationController {
    /**
     * 创建API配置
     */
    static create(req: Request, res: Response): Promise<void>;
    /**
     * 获取API配置列表
     */
    static getList(req: Request, res: Response): Promise<void>;
    /**
     * 获取单个API配置
     */
    static getById(req: Request, res: Response): Promise<void>;
    /**
     * 更新API配置
     */
    static update(req: Request, res: Response): Promise<void>;
    /**
     * 删除API配置
     */
    static delete(req: Request, res: Response): Promise<void>;
    /**
     * 测试API配置
     */
    static test(req: Request, res: Response): Promise<void>;
    /**
     * 获取API统计信息
     */
    static getStats(req: Request, res: Response): Promise<void>;
    /**
     * 清除API客户端缓存
     */
    static clearCache(req: Request, res: Response): Promise<void>;
}
/**
 * 创建API配置验证规则
 */
export declare const createApiConfigValidation: import("express-validator").ValidationChain[];
/**
 * 更新API配置验证规则
 */
export declare const updateApiConfigValidation: import("express-validator").ValidationChain[];
/**
 * 获取API配置验证规则
 */
export declare const getApiConfigValidation: import("express-validator").ValidationChain[];
/**
 * 获取API配置列表验证规则
 */
export declare const getApiConfigListValidation: import("express-validator").ValidationChain[];
