import { BaseApiClient } from './base-api-client';
/**
 * Alpha Vantage新闻数据接口
 */
export interface AlphaVantageNewsItem {
    title: string;
    url: string;
    time_published: string;
    authors: string[];
    summary: string;
    banner_image?: string;
    source: string;
    category_within_source: string;
    source_domain: string;
    topics: Array<{
        topic: string;
        relevance_score: string;
    }>;
    overall_sentiment_score: number;
    overall_sentiment_label: string;
    ticker_sentiment: Array<{
        ticker: string;
        relevance_score: string;
        ticker_sentiment_score: string;
        ticker_sentiment_label: string;
    }>;
}
/**
 * Alpha Vantage新闻响应接口
 */
export interface AlphaVantageNewsResponse {
    items: string;
    sentiment_score_definition: string;
    relevance_score_definition: string;
    feed: AlphaVantageNewsItem[];
}
/**
 * 标准化新闻数据接口
 */
export interface StandardizedNewsItem {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    publishedAt: Date;
    source: string;
    category?: string;
    tags: string[];
    metadata: {
        sentiment: {
            score: number;
            label: string;
        };
        tickers?: Array<{
            symbol: string;
            relevance: number;
            sentiment: number;
        }>;
        topics?: Array<{
            name: string;
            relevance: number;
        }>;
    };
}
/**
 * Alpha Vantage API客户端
 */
export declare class AlphaVantageClient extends BaseApiClient {
    constructor(apiKey: string);
    /**
     * 健康检查
     */
    healthCheck(): Promise<boolean>;
    /**
     * 获取市场新闻
     */
    getMarketNews(options?: {
        tickers?: string[];
        topics?: string[];
        timeFrom?: string;
        timeTo?: string;
        sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
        limit?: number;
    }): Promise<AlphaVantageNewsResponse>;
    /**
     * 获取科技股新闻
     */
    getTechStockNews(limit?: number): Promise<AlphaVantageNewsResponse>;
    /**
     * 获取AI相关股票新闻
     */
    getAIStockNews(limit?: number): Promise<AlphaVantageNewsResponse>;
    /**
     * 标准化新闻数据
     */
    standardizeNewsData(alphaVantageNews: AlphaVantageNewsItem[]): StandardizedNewsItem[];
    /**
     * 获取并标准化科技新闻
     */
    getStandardizedTechNews(limit?: number): Promise<StandardizedNewsItem[]>;
    /**
     * 获取并标准化AI新闻
     */
    getStandardizedAINews(limit?: number): Promise<StandardizedNewsItem[]>;
    /**
     * 搜索特定公司的新闻
     */
    searchCompanyNews(ticker: string, timeFrom?: string, timeTo?: string, limit?: number): Promise<StandardizedNewsItem[]>;
}
