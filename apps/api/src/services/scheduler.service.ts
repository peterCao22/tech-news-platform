import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import { rssService } from './rss.service';
import { alphaVantageService } from './alpha-vantage.service';
import { finnhubService } from './finnhub.service';
import { polygonService } from './polygon.service';

export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * 启动所有定时任务
   */
  public startAll(): void {
    logger.info('启动定时任务服务');

    // RSS源抓取任务 - 每15分钟执行一次
    this.scheduleRSSFetch();

    // Alpha Vantage 数据获取任务 - 每小时执行一次
    this.scheduleAlphaVantageFetch();

    // Finnhub 数据获取任务 - 每30分钟执行一次
    this.scheduleFinnhubFetch();

    // Polygon 数据获取任务 - 每45分钟执行一次
    this.schedulePolygonFetch();

    // 清理任务 - 每天凌晨2点执行
    this.scheduleCleanup();

    logger.info(`已启动 ${this.tasks.size} 个定时任务`);
  }

  /**
   * 停止所有定时任务
   */
  public stopAll(): void {
    logger.info('停止所有定时任务');
    
    this.tasks.forEach((task, name) => {
      task.stop();
      logger.info(`已停止任务: ${name}`);
    });
    
    this.tasks.clear();
  }

  /**
   * 调度RSS源抓取任务
   */
  private scheduleRSSFetch(): void {
    const taskName = 'rss-fetch';
    
    // 每15分钟执行一次: 0 */15 * * * *
    // 开发环境可以设置更频繁: */5 * * * * (每5分钟)
    const cronExpression = process.env.NODE_ENV === 'development' 
      ? '*/5 * * * *'  // 开发环境每5分钟
      : '0 */15 * * * *'; // 生产环境每15分钟

    const task = cron.schedule(cronExpression, async () => {
      logger.info('开始执行RSS源抓取任务');
      
      try {
        const startTime = Date.now();
        const result = await rssService.fetchAllActiveSources();
        const duration = Date.now() - startTime;

        logger.info('RSS源抓取任务完成', {
          duration: `${duration}ms`,
          totalSources: result.totalSources,
          successCount: result.successCount,
          totalNewItems: result.totalNewItems,
          errorCount: result.errors.length,
        });

        // 如果有错误，记录详细信息
        if (result.errors.length > 0) {
          logger.warn('RSS源抓取任务中发现错误', {
            errors: result.errors,
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('RSS源抓取任务执行失败', { error: errorMessage });
      }
    }, {
      timezone: 'Asia/Shanghai',
    });

    this.tasks.set(taskName, task);
    task.start();
    
    logger.info(`RSS源抓取任务已启动，执行频率: ${cronExpression}`);
  }

  /**
   * 调度Alpha Vantage数据获取任务
   */
  private scheduleAlphaVantageFetch(): void {
    const taskName = 'alpha-vantage-fetch';
    
    // 每小时执行一次: 0 * * * *
    // 开发环境可以设置更频繁: 0 */30 * * * * (每30分钟)
    const cronExpression = process.env.NODE_ENV === 'development' 
      ? '0 */30 * * * *'  // 开发环境每30分钟
      : '0 * * * *'; // 生产环境每小时

    const task = cron.schedule(cronExpression, async () => {
      logger.info('开始执行Alpha Vantage数据获取任务');
      
      try {
        const startTime = Date.now();
        const result = await alphaVantageService.executeFullFetchTask();
        const duration = Date.now() - startTime;

        logger.info('Alpha Vantage数据获取任务完成', {
          duration: `${duration}ms`,
          success: result.success,
          totalSaved: result.totalSaved,
          totalErrors: result.totalErrors,
          techNews: result.results.techNews.totalSaved,
          aiNews: result.results.aiNews.totalSaved,
          companyNews: result.results.companyNews.totalSaved
        });

        // 如果有错误，记录详细信息
        const allErrors = [
          ...result.results.techNews.errors,
          ...result.results.aiNews.errors,
          ...result.results.companyNews.errors
        ];
        
        if (allErrors.length > 0) {
          logger.warn('Alpha Vantage数据获取任务中发现错误', {
            errorCount: allErrors.length,
            errors: allErrors.slice(0, 5) // 只记录前5个错误
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Alpha Vantage数据获取任务执行失败', { error: errorMessage });
      }
    }, {
      timezone: 'Asia/Shanghai',
    });

    this.tasks.set(taskName, task);
    task.start();
    
    logger.info(`Alpha Vantage数据获取任务已启动，执行频率: ${cronExpression}`);
  }

  /**
   * 调度Finnhub数据获取任务
   */
  private scheduleFinnhubFetch(): void {
    const taskName = 'finnhub-fetch';
    
    // 每30分钟执行一次: 0 */30 * * * *
    // 开发环境可以设置更频繁: 0 */15 * * * * (每15分钟)
    const cronExpression = process.env.NODE_ENV === 'development' 
      ? '0 */15 * * * *'  // 开发环境每15分钟
      : '0 */30 * * * *'; // 生产环境每30分钟

    const task = cron.schedule(cronExpression, async () => {
      logger.info('开始执行Finnhub数据获取任务');
      
      try {
        const startTime = Date.now();
        const result = await finnhubService.executeFullFetchTask();
        const duration = Date.now() - startTime;

        logger.info('Finnhub数据获取任务完成', {
          duration: `${duration}ms`,
          success: result.success,
          totalSaved: result.totalSaved,
          totalErrors: result.totalErrors,
          techNews: result.results.techNews.totalSaved,
          aiNews: result.results.aiNews.totalSaved,
          companyNews: result.results.companyNews.totalSaved
        });

        // 如果有错误，记录详细信息
        const allErrors = [
          ...result.results.techNews.errors,
          ...result.results.aiNews.errors,
          ...result.results.companyNews.errors
        ];
        
        if (allErrors.length > 0) {
          logger.warn('Finnhub数据获取任务中发现错误', {
            errorCount: allErrors.length,
            errors: allErrors.slice(0, 5) // 只记录前5个错误
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Finnhub数据获取任务执行失败', { error: errorMessage });
      }
    }, {
      timezone: 'Asia/Shanghai',
    });

    this.tasks.set(taskName, task);
    task.start();
    
    logger.info(`Finnhub数据获取任务已启动，执行频率: ${cronExpression}`);
  }

  /**
   * 调度Polygon数据获取任务
   */
  private schedulePolygonFetch(): void {
    const taskName = 'polygon-fetch';
    
    // 每45分钟执行一次: 0 */45 * * * *
    // 开发环境可以设置更频繁: 0 */20 * * * * (每20分钟)
    const cronExpression = process.env.NODE_ENV === 'development' 
      ? '0 */20 * * * *'  // 开发环境每20分钟
      : '0 */45 * * * *'; // 生产环境每45分钟

    const task = cron.schedule(cronExpression, async () => {
      logger.info('开始执行Polygon数据获取任务');
      
      try {
        const startTime = Date.now();
        const result = await polygonService.executeFullFetchTask();
        const duration = Date.now() - startTime;

        logger.info('Polygon数据获取任务完成', {
          duration: `${duration}ms`,
          success: result.success,
          totalSaved: result.totalSaved,
          totalErrors: result.totalErrors,
          techNews: result.results.techNews.totalSaved,
          aiNews: result.results.aiNews.totalSaved,
          companyNews: result.results.companyNews.totalSaved
        });

        // 如果有错误，记录详细信息
        const allErrors = [
          ...result.results.techNews.errors,
          ...result.results.aiNews.errors,
          ...result.results.companyNews.errors
        ];
        
        if (allErrors.length > 0) {
          logger.warn('Polygon数据获取任务中发现错误', {
            errorCount: allErrors.length,
            errors: allErrors.slice(0, 5) // 只记录前5个错误
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Polygon数据获取任务执行失败', { error: errorMessage });
      }
    }, {
      timezone: 'Asia/Shanghai',
    });

    this.tasks.set(taskName, task);
    task.start();
    
    logger.info(`Polygon数据获取任务已启动，执行频率: ${cronExpression}`);
  }

  /**
   * 调度清理任务
   */
  private scheduleCleanup(): void {
    const taskName = 'cleanup';
    
    // 每天凌晨2点执行: 0 2 * * *
    const cronExpression = '0 2 * * *';

    const task = cron.schedule(cronExpression, async () => {
      logger.info('开始执行清理任务');
      
      try {
        await this.performCleanup();
        logger.info('清理任务完成');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('清理任务执行失败', { error: errorMessage });
      }
    }, {
      timezone: 'Asia/Shanghai',
    });

    this.tasks.set(taskName, task);
    task.start();
    
    logger.info(`清理任务已启动，执行时间: 每天凌晨2点`);
  }

  /**
   * 执行清理操作
   */
  private async performCleanup(): Promise<void> {
    // 这里可以添加各种清理逻辑
    // 例如：清理过期的会话、临时文件、日志等
    
    logger.info('执行数据库清理...');
    
    // 示例：清理超过30天的错误日志（如果有的话）
    // await cleanupOldLogs();
    
    // 示例：清理过期的密码重置令牌
    // await cleanupExpiredTokens();
    
    logger.info('清理操作完成');
  }

  /**
   * 手动触发RSS抓取任务
   */
  public async triggerRSSFetch(): Promise<any> {
    logger.info('手动触发RSS源抓取任务');
    
    try {
      const result = await rssService.fetchAllActiveSources();
      logger.info('手动RSS源抓取任务完成', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('手动RSS源抓取任务失败', { error: errorMessage });
      throw error;
    }
  }

  /**
   * 手动触发Alpha Vantage数据获取任务
   */
  public async triggerAlphaVantageFetch(): Promise<any> {
    logger.info('手动触发Alpha Vantage数据获取任务');
    
    try {
      const result = await alphaVantageService.executeFullFetchTask();
      logger.info('手动Alpha Vantage数据获取任务完成', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('手动Alpha Vantage数据获取任务失败', { error: errorMessage });
      throw error;
    }
  }

  /**
   * 手动触发Finnhub数据获取任务
   */
  public async triggerFinnhubFetch(): Promise<any> {
    logger.info('手动触发Finnhub数据获取任务');
    
    try {
      const result = await finnhubService.executeFullFetchTask();
      logger.info('手动Finnhub数据获取任务完成', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('手动Finnhub数据获取任务失败', { error: errorMessage });
      throw error;
    }
  }

  /**
   * 手动触发Polygon数据获取任务
   */
  public async triggerPolygonFetch(): Promise<any> {
    logger.info('手动触发Polygon数据获取任务');
    
    try {
      const result = await polygonService.executeFullFetchTask();
      logger.info('手动Polygon数据获取任务完成', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('手动Polygon数据获取任务失败', { error: errorMessage });
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  public getTaskStatus(): Array<{ name: string; running: boolean; nextRun?: Date }> {
    const status: Array<{ name: string; running: boolean; nextRun?: Date }> = [];
    
    this.tasks.forEach((task, name) => {
      status.push({
        name,
        running: task.getStatus() === 'scheduled',
        // Note: node-cron doesn't provide nextRun info directly
        // This would need to be calculated based on cron expression
      });
    });
    
    return status;
  }

  /**
   * 停止特定任务
   */
  public stopTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      this.tasks.delete(taskName);
      logger.info(`已停止任务: ${taskName}`);
      return true;
    }
    return false;
  }

  /**
   * 检查cron表达式是否有效
   */
  public static validateCronExpression(expression: string): boolean {
    return cron.validate(expression);
  }
}

// 创建单例实例
export const schedulerService = new SchedulerService();
