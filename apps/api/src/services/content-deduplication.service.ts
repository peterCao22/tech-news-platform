/**
 * 内容去重与相似度检测服务
 * Story 2.4: 智能内容去重与相似度检测
 */

import { db } from '@tech-news-platform/database';
import { logger } from '../utils/logger';
import { aiServiceManager } from './ai/ai-service-manager';

/**
 * 相似度结果接口
 */
export interface SimilarityResult {
  contentId1: string;
  contentId2: string;
  titleSimilarity: number;       // 0-100
  contentSimilarity: number;     // 0-100
  overallSimilarity: number;     // 0-100
  detectionMethod: string;
  isDuplicate: boolean;          // 是否判定为重复
}

/**
 * 去重检测结果接口
 */
export interface DeduplicationResult {
  checked: number;
  duplicatesFound: number;
  duplicatePairs: SimilarityResult[];
}

/**
 * 去重报告接口
 */
export interface DeduplicationReport {
  totalContent: number;
  totalDuplicates: number;
  pendingReview: number;
  confirmed: number;
  merged: number;
  falsePositives: number;
}

/**
 * 内容去重服务类
 */
export class ContentDeduplicationService {
  // 相似度阈值配置
  private readonly THRESHOLDS = {
    EXACT_MATCH: 100,           // 完全相同
    AUTO_DUPLICATE: 90,         // 自动标记为重复
    NEEDS_REVIEW: 75,           // 需要人工审核
    SIMILAR: 60,                // 中度相似
  };

  // 权重配置
  private readonly WEIGHTS = {
    TITLE: 0.4,                 // 标题权重40%
    CONTENT: 0.6,               // 内容权重60%
  };

  /**
   * 检测单条内容的重复
   */
  async detectDuplicates(contentId: string): Promise<SimilarityResult[]> {
    try {
      logger.info('开始检测重复内容', { contentId });

      // 1. 获取目标内容
      const targetContent = await db.content.findUnique({
        where: { id: contentId },
        include: { source: true }
      });

      if (!targetContent) {
        throw new Error(`内容不存在: ${contentId}`);
      }

      // 2. 获取潜在重复内容（同一时间段内的内容）
      const timeWindow = new Date(targetContent.createdAt);
      timeWindow.setDate(timeWindow.getDate() - 7); // 7天内

      const candidates = await db.content.findMany({
        where: {
          id: { not: contentId },
          createdAt: { gte: timeWindow },
          status: { notIn: ['ARCHIVED', 'REJECTED'] }
        },
        include: { source: true },
        take: 100 // 限制检查数量
      });

      logger.debug(`找到${candidates.length}条候选内容`);

      // 3. 计算相似度
      const results: SimilarityResult[] = [];

      for (const candidate of candidates) {
        const similarity = await this.calculateSimilarity(
          {
            id: targetContent.id,
            title: targetContent.title,
            content: targetContent.content || targetContent.description || ''
          },
          {
            id: candidate.id,
            title: candidate.title,
            content: candidate.content || candidate.description || ''
          }
        );

        // 只保留相似度超过阈值的结果
        if (similarity.overallSimilarity >= this.THRESHOLDS.SIMILAR) {
          results.push(similarity);

          // 如果相似度很高，自动保存到数据库
          if (similarity.overallSimilarity >= this.THRESHOLDS.AUTO_DUPLICATE) {
            await this.saveDuplicationRecord(similarity, 'CONFIRMED');
          } else if (similarity.overallSimilarity >= this.THRESHOLDS.NEEDS_REVIEW) {
            await this.saveDuplicationRecord(similarity, 'PENDING');
          }
        }
      }

      // 按相似度降序排序
      results.sort((a, b) => b.overallSimilarity - a.overallSimilarity);

      logger.info('重复检测完成', {
        contentId,
        totalChecked: candidates.length,
        duplicatesFound: results.length
      });

      return results;
    } catch (error) {
      logger.error('重复检测失败', { contentId, error });
      throw error;
    }
  }

  /**
   * 批量检测重复内容
   */
  async batchDetect(contentIds: string[]): Promise<DeduplicationResult> {
    logger.info('开始批量检测', { total: contentIds.length });

    const allResults: SimilarityResult[] = [];
    let checked = 0;

    for (const contentId of contentIds) {
      try {
        const results = await this.detectDuplicates(contentId);
        allResults.push(...results);
        checked++;
      } catch (error) {
        logger.error('批量检测单项失败', { contentId, error });
      }

      // 添加延迟避免过载
      if (contentIds.indexOf(contentId) < contentIds.length - 1) {
        await this.delay(500);
      }
    }

    // 去除重复的检测结果
    const uniqueResults = this.deduplicateResults(allResults);

    return {
      checked,
      duplicatesFound: uniqueResults.length,
      duplicatePairs: uniqueResults
    };
  }

  /**
   * 计算两个内容的相似度
   */
  async calculateSimilarity(
    content1: { id: string; title: string; content: string },
    content2: { id: string; title: string; content: string }
  ): Promise<SimilarityResult> {
    // 1. 标题相似度（快速检测）
    const titleSim = this.calculateTitleSimilarity(content1.title, content2.title);

    // 2. 内容相似度
    let contentSim = 0;
    let detectionMethod = 'title_only';

    // 如果标题相似度高，进行内容检测
    if (titleSim >= this.THRESHOLDS.SIMILAR || content1.content.length > 100) {
      contentSim = await this.calculateContentSimilarity(
        content1.content,
        content2.content
      );
      detectionMethod = 'title_and_content';
    }

    // 3. 综合相似度
    const overallSim = this.calculateOverallSimilarity(titleSim, contentSim);

    return {
      contentId1: content1.id,
      contentId2: content2.id,
      titleSimilarity: titleSim,
      contentSimilarity: contentSim,
      overallSimilarity: overallSim,
      detectionMethod,
      isDuplicate: overallSim >= this.THRESHOLDS.AUTO_DUPLICATE
    };
  }

  /**
   * 计算标题相似度（Levenshtein距离）
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    // 标准化标题
    const t1 = title1.toLowerCase().trim();
    const t2 = title2.toLowerCase().trim();

    // 完全相同
    if (t1 === t2) {
      return 100;
    }

    // 计算编辑距离
    const distance = this.levenshteinDistance(t1, t2);
    const maxLength = Math.max(t1.length, t2.length);

    if (maxLength === 0) {
      return 0;
    }

    const similarity = (1 - distance / maxLength) * 100;
    return Math.max(0, Math.min(100, similarity));
  }

  /**
   * 计算内容语义相似度（使用AI）
   */
  private async calculateContentSimilarity(
    content1: string,
    content2: string
  ): Promise<number> {
    try {
      // 截取前1000字符进行比较（避免token过多）
      const text1 = content1.substring(0, 1000);
      const text2 = content2.substring(0, 1000);

      // 使用AI生成相似度分析
      const prompt = `请分析以下两篇新闻内容的语义相似度，返回0-100的相似度分数。

内容1：
${text1}

内容2：
${text2}

要求：
1. 只返回数字分数（0-100），不要任何解释
2. 如果内容完全相同或描述同一事件，返回90-100
3. 如果内容相关但不是同一事件，返回60-89
4. 如果内容无关，返回0-59

返回格式：只返回一个数字，如：85`;

      const response = await aiServiceManager.generateText(prompt, {
        maxTokens: 10,
        temperature: 0.1
      });

      // 提取数字
      const match = response.match(/\d+/);
      if (match) {
        const score = parseInt(match[0], 10);
        return Math.max(0, Math.min(100, score));
      }

      // 如果无法解析，返回默认值
      logger.warn('无法解析AI相似度响应', { response });
      return 50;
    } catch (error) {
      logger.error('内容相似度计算失败', { error });
      // 降级：使用简单文本比较
      return this.simpleSimilarity(content1, content2);
    }
  }

  /**
   * 计算综合相似度
   */
  private calculateOverallSimilarity(
    titleSim: number,
    contentSim: number
  ): number {
    return titleSim * this.WEIGHTS.TITLE + contentSim * this.WEIGHTS.CONTENT;
  }

  /**
   * Levenshtein距离算法
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // 删除
            dp[i][j - 1] + 1,    // 插入
            dp[i - 1][j - 1] + 1 // 替换
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * 简单文本相似度（降级方案）
   */
  private simpleSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    return (intersection.size / union.size) * 100;
  }

  /**
   * 保存重复记录到数据库
   */
  private async saveDuplicationRecord(
    similarity: SimilarityResult,
    status: 'PENDING' | 'CONFIRMED'
  ): Promise<void> {
    try {
      // 检查是否已存在记录
      const existing = await db.contentDuplication.findFirst({
        where: {
          OR: [
            { originalId: similarity.contentId1, duplicateId: similarity.contentId2 },
            { originalId: similarity.contentId2, duplicateId: similarity.contentId1 }
          ]
        }
      });

      if (existing) {
        // 更新现有记录
        await db.contentDuplication.update({
          where: { id: existing.id },
          data: {
            titleSimilarity: similarity.titleSimilarity,
            contentSimilarity: similarity.contentSimilarity,
            overallSimilarity: similarity.overallSimilarity,
            detectionMethod: similarity.detectionMethod,
            confidence: similarity.overallSimilarity / 100,
            status: status
          }
        });
      } else {
        // 创建新记录
        await db.contentDuplication.create({
          data: {
            originalId: similarity.contentId1,
            duplicateId: similarity.contentId2,
            titleSimilarity: similarity.titleSimilarity,
            contentSimilarity: similarity.contentSimilarity,
            overallSimilarity: similarity.overallSimilarity,
            detectionMethod: similarity.detectionMethod,
            confidence: similarity.overallSimilarity / 100,
            status: status
          }
        });
      }

      logger.debug('重复记录已保存', { 
        contentId1: similarity.contentId1,
        contentId2: similarity.contentId2,
        status
      });
    } catch (error) {
      logger.error('保存重复记录失败', { error });
    }
  }

  /**
   * 标记内容为重复
   */
  async markAsDuplicate(
    originalId: string,
    duplicateId: string,
    userId?: string
  ): Promise<void> {
    try {
      // 更新重复内容的duplicate_of字段
      await db.content.update({
        where: { id: duplicateId },
        data: { duplicateOf: originalId }
      });

      // 查找或创建重复记录
      const existing = await db.contentDuplication.findFirst({
        where: { originalId, duplicateId }
      });

      if (existing) {
        await db.contentDuplication.update({
          where: { id: existing.id },
          data: {
            status: 'CONFIRMED',
            reviewedBy: userId,
            reviewedAt: new Date()
          }
        });
      } else {
        await db.contentDuplication.create({
          data: {
            originalId,
            duplicateId,
            titleSimilarity: 100,
            contentSimilarity: 100,
            overallSimilarity: 100,
            confidence: 1.0,
            detectionMethod: 'manual',
            status: 'CONFIRMED',
            reviewedBy: userId,
            reviewedAt: new Date()
          }
        });
      }

      logger.info('内容已标记为重复', { originalId, duplicateId, userId });
    } catch (error) {
      logger.error('标记重复失败', { originalId, duplicateId, error });
      throw error;
    }
  }

  /**
   * 合并重复内容
   */
  async mergeDuplicates(
    originalId: string,
    duplicateIds: string[],
    userId?: string
  ): Promise<void> {
    try {
      logger.info('开始合并重复内容', { originalId, duplicateIds });

      for (const duplicateId of duplicateIds) {
        await this.markAsDuplicate(originalId, duplicateId, userId);
      }

      logger.info('重复内容合并完成', { originalId, count: duplicateIds.length });
    } catch (error) {
      logger.error('合并重复失败', { error });
      throw error;
    }
  }

  /**
   * 获取去重报告
   */
  async getDeduplicationReport(): Promise<DeduplicationReport> {
    try {
      const [totalContent, duplications] = await Promise.all([
        db.content.count({ where: { status: { not: 'DELETED' as any } } }),
        db.contentDuplication.findMany()
      ]);

      const statusCounts = {
        PENDING: 0,
        CONFIRMED: 0,
        MERGED: 0,
        FALSE_POSITIVE: 0
      };

      duplications.forEach(dup => {
        const status = dup.status as string;
        if (status in statusCounts) {
          statusCounts[status as keyof typeof statusCounts]++;
        }
      });

      return {
        totalContent,
        totalDuplicates: duplications.length,
        pendingReview: statusCounts.PENDING,
        confirmed: statusCounts.CONFIRMED,
        merged: statusCounts.MERGED,
        falsePositives: statusCounts.FALSE_POSITIVE
      };
    } catch (error) {
      logger.error('获取去重报告失败', { error });
      throw error;
    }
  }

  /**
   * 去除重复的检测结果
   */
  private deduplicateResults(results: SimilarityResult[]): SimilarityResult[] {
    const seen = new Set<string>();
    const unique: SimilarityResult[] = [];

    for (const result of results) {
      const key1 = `${result.contentId1}-${result.contentId2}`;
      const key2 = `${result.contentId2}-${result.contentId1}`;

      if (!seen.has(key1) && !seen.has(key2)) {
        seen.add(key1);
        unique.push(result);
      }
    }

    return unique;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const contentDeduplicationService = new ContentDeduplicationService();

