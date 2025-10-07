// 科技新闻聚合平台 - Alpha Vantage API客户端
// 集成Alpha Vantage API获取股票相关新闻
import { BaseApiClient, AuthType } from './base-api-client';
import { logger } from '../../utils/logger';
/**
 * Alpha Vantage API客户端
 */
export class AlphaVantageClient extends BaseApiClient {
    constructor(apiKey) {
        const config = {
            baseURL: 'https://www.alphavantage.co/query',
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            rateLimit: {
                maxRequests: 5, // Alpha Vantage免费版限制
                windowMs: 60000 // 每分钟5次
            },
            auth: {
                type: AuthType.API_KEY,
                apiKey,
                headerName: 'apikey' // Alpha Vantage使用查询参数而不是header
            }
        };
        super(config);
    }
    /**
     * 健康检查
     */
    async healthCheck() {
        try {
            // 使用简单的查询来检查API是否可用
            const response = await this.get('', {
                params: {
                    function: 'TIME_SERIES_INTRADAY',
                    symbol: 'IBM',
                    interval: '1min',
                    apikey: this.config.auth?.apiKey
                }
            });
            return response && !response['Error Message'] && !response['Note'];
        }
        catch (error) {
            logger.error('Alpha Vantage健康检查失败', { error });
            return false;
        }
    }
    /**
     * 获取市场新闻
     */
    async getMarketNews(options) {
        try {
            const params = {
                function: 'NEWS_SENTIMENT',
                apikey: this.config.auth?.apiKey,
                sort: options?.sort || 'LATEST',
                limit: options?.limit || 50
            };
            if (options?.tickers && options.tickers.length > 0) {
                params.tickers = options.tickers.join(',');
            }
            if (options?.topics && options.topics.length > 0) {
                params.topics = options.topics.join(',');
            }
            if (options?.timeFrom) {
                params.time_from = options.timeFrom;
            }
            if (options?.timeTo) {
                params.time_to = options.timeTo;
            }
            const response = await this.get('', { params });
            if (response['Error Message']) {
                throw new Error(`Alpha Vantage API错误: ${response['Error Message']}`);
            }
            if (response['Note']) {
                throw new Error(`Alpha Vantage API限制: ${response['Note']}`);
            }
            return response;
        }
        catch (error) {
            logger.error('获取Alpha Vantage市场新闻失败', { error, options });
            throw error;
        }
    }
    /**
     * 获取科技股新闻
     */
    async getTechStockNews(limit = 50) {
        const techTickers = [
            'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX',
            'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'ADBE', 'NOW', 'SNOW'
        ];
        return this.getMarketNews({
            tickers: techTickers,
            topics: ['technology', 'earnings', 'ipo'],
            sort: 'LATEST',
            limit
        });
    }
    /**
     * 获取AI相关股票新闻
     */
    async getAIStockNews(limit = 30) {
        const aiTickers = [
            'NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'AMD', 'INTC',
            'CRM', 'NOW', 'PLTR', 'AI', 'SNOW', 'DDOG'
        ];
        return this.getMarketNews({
            tickers: aiTickers,
            topics: ['technology'],
            sort: 'RELEVANCE',
            limit
        });
    }
    /**
     * 标准化新闻数据
     */
    standardizeNewsData(alphaVantageNews) {
        return alphaVantageNews.map(item => {
            // 解析发布时间
            const publishedAt = new Date(item.time_published.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
            // 提取标签
            const tags = [];
            // 添加主题标签
            if (item.topics) {
                item.topics.forEach(topic => {
                    if (parseFloat(topic.relevance_score) > 0.3) {
                        tags.push(topic.topic);
                    }
                });
            }
            // 添加股票标签
            if (item.ticker_sentiment) {
                item.ticker_sentiment.forEach(ticker => {
                    if (parseFloat(ticker.relevance_score) > 0.3) {
                        tags.push(`stock:${ticker.ticker}`);
                    }
                });
            }
            // 添加情感标签
            if (item.overall_sentiment_label) {
                tags.push(`sentiment:${item.overall_sentiment_label.toLowerCase()}`);
            }
            // 添加来源标签
            tags.push(`source:${item.source_domain}`);
            return {
                title: item.title,
                description: item.summary,
                url: item.url,
                imageUrl: item.banner_image,
                publishedAt,
                source: item.source,
                category: item.category_within_source,
                tags,
                metadata: {
                    sentiment: {
                        score: item.overall_sentiment_score,
                        label: item.overall_sentiment_label
                    },
                    tickers: item.ticker_sentiment?.map(ticker => ({
                        symbol: ticker.ticker,
                        relevance: parseFloat(ticker.relevance_score),
                        sentiment: parseFloat(ticker.ticker_sentiment_score)
                    })),
                    topics: item.topics?.map(topic => ({
                        name: topic.topic,
                        relevance: parseFloat(topic.relevance_score)
                    }))
                }
            };
        });
    }
    /**
     * 获取并标准化科技新闻
     */
    async getStandardizedTechNews(limit = 50) {
        try {
            const response = await this.getTechStockNews(limit);
            return this.standardizeNewsData(response.feed);
        }
        catch (error) {
            logger.error('获取标准化科技新闻失败', { error });
            throw error;
        }
    }
    /**
     * 获取并标准化AI新闻
     */
    async getStandardizedAINews(limit = 30) {
        try {
            const response = await this.getAIStockNews(limit);
            return this.standardizeNewsData(response.feed);
        }
        catch (error) {
            logger.error('获取标准化AI新闻失败', { error });
            throw error;
        }
    }
    /**
     * 搜索特定公司的新闻
     */
    async searchCompanyNews(ticker, timeFrom, timeTo, limit = 20) {
        try {
            const response = await this.getMarketNews({
                tickers: [ticker],
                timeFrom,
                timeTo,
                sort: 'LATEST',
                limit
            });
            return this.standardizeNewsData(response.feed);
        }
        catch (error) {
            logger.error('搜索公司新闻失败', { error, ticker });
            throw error;
        }
    }
}
