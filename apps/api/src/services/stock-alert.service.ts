/**
 * Story 4.5: 智能通知与提醒
 * 股票异动监控服务 - 监控股票价格变化，发送异动提醒
 */

import axios from 'axios';
import { prisma } from '@tech-news-platform/database';
import { StockPriceHistory, NotificationType, NotificationChannel, Content } from '@tech-news-platform/database';
import { notificationService } from './notification.service';

// 股票价格数据
export interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

// 股票异动警报
export interface StockAlert {
  userId: string;
  stock: StockPrice;
  previousPrice: number;
  threshold: number;
  relatedNews: Content[];
}

export class StockAlertService {
  private apiKey: string = '';
  private apiBaseUrl: string = 'https://www.alphavantage.co/query';
  private initialized: boolean = false;

  constructor() {
    // 延迟初始化，避免在环境变量加载前检查
  }

  /**
   * 初始化API密钥（延迟加载）
   */
  private initialize(): void {
    if (this.initialized) return;
    
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.initialized = true;
    
    if (!this.apiKey) {
      console.warn('[StockAlertService] ⚠️ Alpha Vantage API密钥未配置，股票监控功能将受限');
    } else {
      console.log('[StockAlertService] ✅ Alpha Vantage API密钥已加载');
    }
  }

  /**
   * 获取股票价格（通过Alpha Vantage API）
   */
  async fetchStockPrice(symbol: string): Promise<StockPrice | null> {
    try {
      this.initialize(); // 延迟初始化
      
      if (!this.apiKey) {
        console.warn('[StockAlertService] API密钥未配置，无法获取股票价格');
        return null;
      }

      const url = `${this.apiBaseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await axios.get(url, { timeout: 10000 });

      const quote = response.data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        console.warn(`[StockAlertService] 未找到股票: ${symbol}`);
        return null;
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      return {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(), // API不返回公司名称，使用symbol代替
        price,
        change,
        changePercent,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`[StockAlertService] 获取股票价格失败 (${symbol}):`, error);
      
      // API限流检查
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        console.warn('[StockAlertService] Alpha Vantage API限流，请检查API调用频率');
      }
      
      return null;
    }
  }

  /**
   * 记录股票价格历史
   */
  async recordStockPrice(stockPrice: StockPrice): Promise<StockPriceHistory> {
    try {
      return await prisma.stockPriceHistory.create({
        data: {
          symbol: stockPrice.symbol,
          name: stockPrice.name,
          price: stockPrice.price,
          change: stockPrice.change,
          changePercent: stockPrice.changePercent,
          timestamp: stockPrice.timestamp,
        },
      });
    } catch (error) {
      console.error('[StockAlertService] 记录股票价格失败:', error);
      throw error;
    }
  }

  /**
   * 获取股票的最近价格历史
   */
  async getRecentPriceHistory(symbol: string, hours: number = 24): Promise<StockPriceHistory[]> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      return await prisma.stockPriceHistory.findMany({
        where: {
          symbol,
          timestamp: {
            gte: since,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
    } catch (error) {
      console.error('[StockAlertService] 获取价格历史失败:', error);
      return [];
    }
  }

  /**
   * 检测股票异动
   */
  async checkStockAlerts(): Promise<StockAlert[]> {
    try {
      this.initialize(); // 延迟初始化
      console.log('[StockAlertService] 开始检测股票异动...');

      const alerts: StockAlert[] = [];

      // 获取所有启用了股票提醒的用户
      const usersWithPreferences = await prisma.notificationPreference.findMany({
        where: {
          stockAlertEnabled: true,
          emailEnabled: true,
        },
        include: {
          user: {
            include: {
              preference: {
                include: {
                  followings: true,
                },
              },
            },
          },
        },
      });

      console.log(`[StockAlertService] 找到 ${usersWithPreferences.length} 个用户启用了股票提醒`);

      // 收集所有需要监控的股票
      const stockSymbols = new Set<string>();
      
      for (const userPref of usersWithPreferences) {
        const user = userPref.user;
        const followings = user.preference?.followings || [];
        
        // 从关注列表中提取股票代码
        for (const following of followings) {
          if (following.type === 'STOCK') {
            stockSymbols.add(following.identifier);
          }
        }
      }

      if (stockSymbols.size === 0) {
        console.log('[StockAlertService] 没有需要监控的股票');
        return alerts;
      }

      console.log(`[StockAlertService] 监控 ${stockSymbols.size} 只股票: ${Array.from(stockSymbols).join(', ')}`);

      // 检查每只股票
      for (const symbol of stockSymbols) {
        try {
          // 获取当前价格
          const currentPrice = await this.fetchStockPrice(symbol);
          
          if (!currentPrice) {
            continue;
          }

          // 记录价格历史
          await this.recordStockPrice(currentPrice);

          // 获取前一价格
          const priceHistory = await this.getRecentPriceHistory(symbol, 24);
          
          // 至少需要2个价格点才能计算变化
          if (priceHistory.length < 2) {
            console.log(`[StockAlertService] ${symbol} 价格历史不足，跳过`);
            continue;
          }

          const previousPrice = priceHistory[1].price;

          // 检查哪些用户应该收到此股票的提醒
          for (const userPref of usersWithPreferences) {
            const user = userPref.user;
            const followings = user.preference?.followings || [];
            
            // 检查用户是否关注此股票
            const isFollowing = followings.some(
              (f) => f.type === 'STOCK' && f.identifier === symbol
            );

            if (!isFollowing) {
              continue;
            }

            // 检查是否超过阈值
            const threshold = userPref.stockAlertThreshold;
            const actualChangePercent = Math.abs(currentPrice.changePercent);

            if (actualChangePercent >= threshold) {
              console.log(
                `[StockAlertService] 检测到异动: ${symbol} ${currentPrice.changePercent > 0 ? '+' : ''}${currentPrice.changePercent.toFixed(2)}% (阈值: ${threshold}%)`
              );

              // 查找相关新闻
              const relatedNews = await this.findRelatedNews(symbol, 24);

              alerts.push({
                userId: user.id,
                stock: currentPrice,
                previousPrice,
                threshold,
                relatedNews,
              });
            }
          }

          // API限流：每次请求后暂停一下
          await new Promise((resolve) => setTimeout(resolve, 15000)); // Alpha Vantage免费版限制：5次/分钟
        } catch (error) {
          console.error(`[StockAlertService] 检查股票 ${symbol} 失败:`, error);
        }
      }

      // 发送所有异动提醒
      if (alerts.length > 0) {
        console.log(`[StockAlertService] 发送 ${alerts.length} 个股票异动提醒`);
        
        for (const alert of alerts) {
          await this.sendStockAlert(alert);
        }
      } else {
        console.log('[StockAlertService] 未检测到股票异动');
      }

      return alerts;
    } catch (error) {
      console.error('[StockAlertService] 检测股票异动失败:', error);
      return [];
    }
  }

  /**
   * 查找相关新闻
   */
  async findRelatedNews(symbol: string, hours: number = 24): Promise<Content[]> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      // 查找标签或内容中包含股票代码的新闻
      const news = await prisma.content.findMany({
        where: {
          OR: [
            {
              tags: {
                has: symbol,
              },
            },
            {
              tags: {
                has: symbol.toUpperCase(),
              },
            },
            {
              title: {
                contains: symbol,
                mode: 'insensitive',
              },
            },
          ],
          status: 'PROCESSED',
          publishedAt: {
            gte: since,
          },
        },
        include: {
          source: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 5, // 最多5条相关新闻
      });

      return news;
    } catch (error) {
      console.error('[StockAlertService] 查找相关新闻失败:', error);
      return [];
    }
  }

  /**
   * 发送股票异动提醒
   */
  async sendStockAlert(alert: StockAlert): Promise<void> {
    try {
      const stock = alert.stock;
      const changeDirection = stock.changePercent > 0 ? '上涨' : '下跌';
      const changeSymbol = stock.changePercent > 0 ? '+' : '';

      await notificationService.sendNotification({
        userId: alert.userId,
        type: NotificationType.STOCK_ALERT,
        channel: NotificationChannel.EMAIL,
        subject: `【股票异动提醒】${stock.name} (${stock.symbol}) ${changeDirection} ${Math.abs(stock.changePercent).toFixed(2)}%`,
        content: '', // 使用模板，content为空
        template: 'stock-alert',
        templateData: {
          stockName: stock.name,
          stockSymbol: stock.symbol,
          currentPrice: stock.price.toFixed(2),
          previousPrice: alert.previousPrice.toFixed(2),
          changePercent: stock.changePercent.toFixed(2),
          changeColor: stock.changePercent > 0 ? '#48bb78' : '#f56565',
          relatedNews: alert.relatedNews.map((news) => ({
            id: news.id,
            title: news.title,
            summary: news.summary,
            source: news.source?.name || '未知来源',
            publishedAt: news.publishedAt,
          })),
          newsCount: alert.relatedNews.length,
        },
        metadata: {
          stockSymbol: stock.symbol,
          changePercent: stock.changePercent,
          threshold: alert.threshold,
          newsCount: alert.relatedNews.length,
        },
      });

      console.log(`[StockAlertService] ✅ 已发送股票异动提醒: ${stock.symbol} (用户: ${alert.userId})`);
    } catch (error) {
      console.error('[StockAlertService] 发送股票异动提醒失败:', error);
    }
  }

  /**
   * 批量记录股票价格（定时任务用）
   */
  async recordStockPrices(symbols: string[]): Promise<void> {
    console.log(`[StockAlertService] 开始记录 ${symbols.length} 只股票的价格...`);

    for (const symbol of symbols) {
      try {
        const price = await this.fetchStockPrice(symbol);
        
        if (price) {
          await this.recordStockPrice(price);
          console.log(`[StockAlertService] ✅ 已记录 ${symbol}: $${price.price} (${price.changePercent > 0 ? '+' : ''}${price.changePercent}%)`);
        }

        // API限流
        await new Promise((resolve) => setTimeout(resolve, 15000)); // 15秒延迟
      } catch (error) {
        console.error(`[StockAlertService] 记录 ${symbol} 价格失败:`, error);
      }
    }

    console.log('[StockAlertService] 股票价格记录完成');
  }

  /**
   * 清理旧的价格历史记录
   */
  async cleanupOldPriceHistory(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.stockPriceHistory.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`[StockAlertService] 清理了 ${result.count} 条旧价格记录`);
      return result.count;
    } catch (error) {
      console.error('[StockAlertService] 清理价格历史失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const stockAlertService = new StockAlertService();

