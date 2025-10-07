export declare class AlphaVantageService {
    private contentService;
    private sourceRepository;
    constructor();
    /**
     * 获取并保存 Alpha Vantage 科技新闻
     */
    fetchAndSaveTechNews(limit?: number): Promise<{
        success: boolean;
        totalFetched: number;
        totalSaved: number;
        errors: string[];
    }>;
    /**
     * 获取并保存 Alpha Vantage AI 新闻
     */
    fetchAndSaveAINews(limit?: number): Promise<{
        success: boolean;
        totalFetched: number;
        totalSaved: number;
        errors: string[];
    }>;
    /**
     * 获取并保存特定公司的新闻
     */
    fetchAndSaveCompanyNews(ticker: string, limit?: number): Promise<{
        success: boolean;
        totalFetched: number;
        totalSaved: number;
        errors: string[];
    }>;
    /**
     * 获取或创建 Alpha Vantage 源
     */
    private getOrCreateAlphaVantageSource;
    /**
     * 保存新闻项目到数据库
     */
    private saveNewsItem;
    /**
     * 执行完整的 Alpha Vantage 数据获取任务
     */
    executeFullFetchTask(): Promise<{
        success: boolean;
        results: {
            techNews: any;
            aiNews: any;
            companyNews: any;
        };
        totalSaved: number;
        totalErrors: number;
    }>;
}
export declare const alphaVantageService: AlphaVantageService;
