export interface FilterRule {
    type: 'include' | 'exclude';
    keywords: string[];
    weight: number;
}
export interface ContentFilterConfig {
    includeRules: FilterRule[];
    excludeRules: FilterRule[];
    minIncludeScore: number;
    maxExcludeScore: number;
}
export declare class ContentFilterService {
    private config;
    constructor();
    /**
     * 检查内容是否应该被过滤掉
     */
    shouldFilterContent(title: string, description?: string, content?: string): {
        shouldFilter: boolean;
        reason: string;
        includeScore: number;
        excludeScore: number;
    };
    /**
     * 合并文本内容
     */
    private combineText;
    /**
     * 计算匹配分数
     */
    private calculateScore;
    /**
     * 批量过滤内容
     */
    filterContentBatch(contents: Array<{
        title: string;
        description?: string;
        content?: string;
    }>): Array<{
        index: number;
        shouldFilter: boolean;
        reason: string;
        includeScore: number;
        excludeScore: number;
    }>;
    /**
     * 获取过滤统计信息
     */
    getFilterStats(results: ReturnType<typeof this.filterContentBatch>): {
        total: number;
        filtered: number;
        kept: number;
        filterRate: number;
        reasons: Record<string, number>;
    };
    /**
     * 更新过滤配置
     */
    updateConfig(newConfig: Partial<ContentFilterConfig>): void;
}
export declare const contentFilterService: ContentFilterService;
