interface RSSItem {
    title?: string;
    link?: string;
    pubDate?: string;
    content?: string;
    contentSnippet?: string;
    guid?: string;
    categories?: string[];
    creator?: string;
    summary?: string;
    enclosure?: {
        url: string;
        type: string;
    };
    'content:encoded'?: string;
    'dc:creator'?: string;
    [key: string]: any;
}
interface RSSFeed {
    title?: string;
    description?: string;
    link?: string;
    items: RSSItem[];
    language?: string;
    copyright?: string;
    managingEditor?: string;
    [key: string]: any;
}
export declare class RSSService {
    private parser;
    constructor();
    /**
     * 解析单个RSS源
     */
    parseFeed(url: string): Promise<RSSFeed>;
    /**
     * 将RSS项目转换为内容数据
     */
    private convertRSSItemToContent;
    /**
     * 从内容中提取摘要
     */
    private extractSummary;
    /**
     * 获取并处理单个RSS源的内容
     */
    fetchAndProcessSource(sourceId: string): Promise<{
        success: boolean;
        newItemsCount: number;
        error?: string;
    }>;
    /**
     * 批量处理所有活跃的RSS源
     */
    fetchAllActiveSources(): Promise<{
        totalSources: number;
        successfulSources: number;
        successCount: number;
        totalNewItems: number;
        results: Array<{
            sourceId: string;
            success: boolean;
            newItemsCount: number;
            error?: string;
        }>;
        errors: Array<{
            sourceId: string;
            error: string;
        }>;
    }>;
    /**
     * 验证RSS源URL是否有效
     */
    validateRSSUrl(url: string): Promise<{
        valid: boolean;
        feedInfo?: {
            title?: string;
            itemCount: number;
        };
        title?: string;
        description?: string;
        itemCount?: number;
        error?: string;
        warning?: string;
    }>;
}
export declare const rssService: RSSService;
export {};
