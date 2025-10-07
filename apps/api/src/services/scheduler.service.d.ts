export declare class SchedulerService {
    private tasks;
    /**
     * 启动所有定时任务
     */
    startAll(): void;
    /**
     * 停止所有定时任务
     */
    stopAll(): void;
    /**
     * 调度RSS源抓取任务
     */
    private scheduleRSSFetch;
    /**
     * 调度Alpha Vantage数据获取任务
     */
    private scheduleAlphaVantageFetch;
    /**
     * 调度清理任务
     */
    private scheduleCleanup;
    /**
     * 执行清理操作
     */
    private performCleanup;
    /**
     * 手动触发RSS抓取任务
     */
    triggerRSSFetch(): Promise<any>;
    /**
     * 手动触发Alpha Vantage数据获取任务
     */
    triggerAlphaVantageFetch(): Promise<any>;
    /**
     * 获取任务状态
     */
    getTaskStatus(): Array<{
        name: string;
        running: boolean;
        nextRun?: Date;
    }>;
    /**
     * 停止特定任务
     */
    stopTask(taskName: string): boolean;
    /**
     * 检查cron表达式是否有效
     */
    static validateCronExpression(expression: string): boolean;
}
export declare const schedulerService: SchedulerService;
