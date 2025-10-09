/**
 * 评分权重管理服务
 * Story 2.5: 内容评分与排序算法
 */

import { logger } from '../utils/logger';
import { ScoringWeights } from './content-scoring.service';

/**
 * 权重配置接口
 */
export interface WeightConfig {
  id: string;
  name: string;
  description?: string;
  weights: ScoringWeights;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A/B测试配置接口
 */
export interface ABTestConfig {
  id: string;
  name: string;
  description?: string;
  weightConfigAId: string;
  weightConfigBId: string;
  startDate: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  winnerConfigId?: string;
  metricsA?: ABTestMetrics;
  metricsB?: ABTestMetrics;
}

/**
 * A/B测试指标
 */
export interface ABTestMetrics {
  impressions: number;      // 曝光数
  clicks: number;           // 点击数
  shares: number;           // 分享数
  bookmarks: number;        // 收藏数
  avgTimeSpent: number;     // 平均停留时间(秒)
  conversionRate: number;   // 转化率
}

/**
 * 评分权重管理服务
 */
export class ScoringWeightManagerService {
  // 默认权重配置
  private defaultWeights: ScoringWeights = {
    timeliness: 0.20,
    authority: 0.25,
    quality: 0.20,
    relevance: 0.15,
    aiImportance: 0.15,
    engagement: 0.05
  };

  // 内存存储（生产环境应使用数据库）
  private weightConfigs: Map<string, WeightConfig> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private activeConfigId: string = 'default';

  constructor() {
    this.initializeDefaultConfig();
  }

  /**
   * 初始化默认配置
   */
  private initializeDefaultConfig(): void {
    const defaultConfig: WeightConfig = {
      id: 'default',
      name: '默认权重配置',
      description: '平衡各维度的标准权重配置',
      weights: this.defaultWeights,
      isActive: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.weightConfigs.set('default', defaultConfig);
    logger.info('默认权重配置已初始化');
  }

  /**
   * 获取当前活动的权重配置
   */
  getActiveWeights(): ScoringWeights {
    const activeConfig = this.weightConfigs.get(this.activeConfigId);
    if (!activeConfig) {
      logger.warn('未找到活动权重配置，使用默认配置');
      return this.defaultWeights;
    }
    return activeConfig.weights;
  }

  /**
   * 获取权重配置
   */
  getWeightConfig(id: string): WeightConfig | undefined {
    return this.weightConfigs.get(id);
  }

  /**
   * 获取所有权重配置
   */
  getAllWeightConfigs(): WeightConfig[] {
    return Array.from(this.weightConfigs.values());
  }

  /**
   * 创建权重配置
   */
  createWeightConfig(
    name: string,
    weights: ScoringWeights,
    description?: string
  ): WeightConfig {
    // 验证权重总和为1
    this.validateWeights(weights);

    const id = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const config: WeightConfig = {
      id,
      name,
      description,
      weights,
      isActive: false,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.weightConfigs.set(id, config);
    logger.info('权重配置已创建', { id, name });

    return config;
  }

  /**
   * 更新权重配置
   */
  updateWeightConfig(
    id: string,
    updates: Partial<Omit<WeightConfig, 'id' | 'createdAt'>>
  ): WeightConfig {
    const config = this.weightConfigs.get(id);
    if (!config) {
      throw new Error(`权重配置不存在: ${id}`);
    }

    // 如果更新权重，验证总和
    if (updates.weights) {
      this.validateWeights(updates.weights);
    }

    const updated: WeightConfig = {
      ...config,
      ...updates,
      updatedAt: new Date()
    };

    this.weightConfigs.set(id, updated);
    logger.info('权重配置已更新', { id });

    return updated;
  }

  /**
   * 激活权重配置
   */
  activateWeightConfig(id: string): void {
    const config = this.weightConfigs.get(id);
    if (!config) {
      throw new Error(`权重配置不存在: ${id}`);
    }

    // 停用当前活动配置
    const currentActive = this.weightConfigs.get(this.activeConfigId);
    if (currentActive) {
      currentActive.isActive = false;
    }

    // 激活新配置
    config.isActive = true;
    this.activeConfigId = id;

    logger.info('权重配置已激活', { id, name: config.name });
  }

  /**
   * 删除权重配置
   */
  deleteWeightConfig(id: string): void {
    const config = this.weightConfigs.get(id);
    if (!config) {
      throw new Error(`权重配置不存在: ${id}`);
    }

    if (config.isDefault) {
      throw new Error('无法删除默认配置');
    }

    if (config.isActive) {
      throw new Error('无法删除活动配置，请先激活其他配置');
    }

    this.weightConfigs.delete(id);
    logger.info('权重配置已删除', { id });
  }

  /**
   * 重置为默认权重
   */
  resetToDefault(): void {
    this.activateWeightConfig('default');
    logger.info('已重置为默认权重配置');
  }

  /**
   * 验证权重配置
   */
  private validateWeights(weights: ScoringWeights): void {
    const sum = 
      weights.timeliness +
      weights.authority +
      weights.quality +
      weights.relevance +
      weights.aiImportance +
      weights.engagement;

    // 允许0.01的误差
    if (Math.abs(sum - 1.0) > 0.01) {
      throw new Error(`权重总和必须为1.0，当前为: ${sum.toFixed(3)}`);
    }

    // 验证每个权重在0-1之间
    Object.entries(weights).forEach(([key, value]) => {
      if (value < 0 || value > 1) {
        throw new Error(`权重 ${key} 必须在0-1之间，当前为: ${value}`);
      }
    });
  }

  /**
   * 创建A/B测试
   */
  createABTest(
    name: string,
    weightConfigAId: string,
    weightConfigBId: string,
    description?: string
  ): ABTestConfig {
    // 验证配置存在
    if (!this.weightConfigs.has(weightConfigAId)) {
      throw new Error(`权重配置A不存在: ${weightConfigAId}`);
    }
    if (!this.weightConfigs.has(weightConfigBId)) {
      throw new Error(`权重配置B不存在: ${weightConfigBId}`);
    }

    const id = `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const test: ABTestConfig = {
      id,
      name,
      description,
      weightConfigAId,
      weightConfigBId,
      startDate: new Date(),
      status: 'ACTIVE',
      metricsA: this.initializeMetrics(),
      metricsB: this.initializeMetrics()
    };

    this.abTests.set(id, test);
    logger.info('A/B测试已创建', { id, name });

    return test;
  }

  /**
   * 获取A/B测试
   */
  getABTest(id: string): ABTestConfig | undefined {
    return this.abTests.get(id);
  }

  /**
   * 获取所有A/B测试
   */
  getAllABTests(): ABTestConfig[] {
    return Array.from(this.abTests.values());
  }

  /**
   * 更新A/B测试指标
   */
  updateABTestMetrics(
    testId: string,
    variant: 'A' | 'B',
    metrics: Partial<ABTestMetrics>
  ): void {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B测试不存在: ${testId}`);
    }

    const currentMetrics = variant === 'A' ? test.metricsA! : test.metricsB!;
    const updated = { ...currentMetrics, ...metrics };

    if (variant === 'A') {
      test.metricsA = updated;
    } else {
      test.metricsB = updated;
    }

    logger.debug('A/B测试指标已更新', { testId, variant });
  }

  /**
   * 完成A/B测试
   */
  completeABTest(testId: string, winnerVariant: 'A' | 'B'): void {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B测试不存在: ${testId}`);
    }

    test.status = 'COMPLETED';
    test.endDate = new Date();
    test.winnerConfigId = winnerVariant === 'A' ? test.weightConfigAId : test.weightConfigBId;

    logger.info('A/B测试已完成', {
      testId,
      winner: winnerVariant,
      configId: test.winnerConfigId
    });
  }

  /**
   * 应用A/B测试获胜配置
   */
  applyABTestWinner(testId: string): void {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B测试不存在: ${testId}`);
    }

    if (test.status !== 'COMPLETED' || !test.winnerConfigId) {
      throw new Error('A/B测试未完成或未确定获胜者');
    }

    this.activateWeightConfig(test.winnerConfigId);
    logger.info('A/B测试获胜配置已应用', {
      testId,
      configId: test.winnerConfigId
    });
  }

  /**
   * 取消A/B测试
   */
  cancelABTest(testId: string): void {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B测试不存在: ${testId}`);
    }

    test.status = 'CANCELLED';
    test.endDate = new Date();

    logger.info('A/B测试已取消', { testId });
  }

  /**
   * 分析A/B测试结果
   */
  analyzeABTest(testId: string): {
    winner: 'A' | 'B' | 'TIE';
    confidence: number;
    recommendation: string;
  } {
    const test = this.abTests.get(testId);
    if (!test || !test.metricsA || !test.metricsB) {
      throw new Error(`A/B测试不存在或缺少指标: ${testId}`);
    }

    const scoreA = this.calculateTestScore(test.metricsA);
    const scoreB = this.calculateTestScore(test.metricsB);

    const diff = Math.abs(scoreA - scoreB);
    const confidence = Math.min(diff * 100, 99);

    let winner: 'A' | 'B' | 'TIE';
    let recommendation: string;

    if (diff < 0.05) {
      winner = 'TIE';
      recommendation = '两个配置表现相近，建议继续测试或选择更简单的配置';
    } else if (scoreA > scoreB) {
      winner = 'A';
      recommendation = `配置A表现更好，建议应用该配置（提升${(diff * 100).toFixed(1)}%）`;
    } else {
      winner = 'B';
      recommendation = `配置B表现更好，建议应用该配置（提升${(diff * 100).toFixed(1)}%）`;
    }

    logger.info('A/B测试分析完成', {
      testId,
      winner,
      confidence: confidence.toFixed(1),
      scoreA: scoreA.toFixed(3),
      scoreB: scoreB.toFixed(3)
    });

    return { winner, confidence, recommendation };
  }

  /**
   * 计算测试评分
   */
  private calculateTestScore(metrics: ABTestMetrics): number {
    // 综合评分公式
    const ctr = metrics.impressions > 0 ? metrics.clicks / metrics.impressions : 0;
    const shareRate = metrics.clicks > 0 ? metrics.shares / metrics.clicks : 0;
    const bookmarkRate = metrics.clicks > 0 ? metrics.bookmarks / metrics.clicks : 0;
    const timeScore = Math.min(metrics.avgTimeSpent / 60, 1); // 归一化到0-1，60秒为满分

    return (
      ctr * 0.3 +
      shareRate * 0.25 +
      bookmarkRate * 0.25 +
      timeScore * 0.1 +
      metrics.conversionRate * 0.1
    );
  }

  /**
   * 初始化指标
   */
  private initializeMetrics(): ABTestMetrics {
    return {
      impressions: 0,
      clicks: 0,
      shares: 0,
      bookmarks: 0,
      avgTimeSpent: 0,
      conversionRate: 0
    };
  }

  /**
   * 获取预设权重配置模板
   */
  getPresetConfigs(): WeightConfig[] {
    return [
      {
        id: 'timeliness_focused',
        name: '时效性优先',
        description: '强调最新资讯，适合快速获取实时信息',
        weights: {
          timeliness: 0.40,
          authority: 0.20,
          quality: 0.15,
          relevance: 0.10,
          aiImportance: 0.10,
          engagement: 0.05
        },
        isActive: false,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'authority_focused',
        name: '权威性优先',
        description: '强调来源权威性，适合专业研究',
        weights: {
          timeliness: 0.15,
          authority: 0.40,
          quality: 0.20,
          relevance: 0.10,
          aiImportance: 0.10,
          engagement: 0.05
        },
        isActive: false,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'quality_focused',
        name: '质量优先',
        description: '强调内容质量，适合深度阅读',
        weights: {
          timeliness: 0.10,
          authority: 0.20,
          quality: 0.40,
          relevance: 0.15,
          aiImportance: 0.10,
          engagement: 0.05
        },
        isActive: false,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ai_focused',
        name: 'AI推荐优先',
        description: '依赖AI重要性评分，适合AI驱动筛选',
        weights: {
          timeliness: 0.15,
          authority: 0.20,
          quality: 0.15,
          relevance: 0.15,
          aiImportance: 0.30,
          engagement: 0.05
        },
        isActive: false,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'engagement_focused',
        name: '用户行为优先',
        description: '基于用户互动数据，适合社交驱动',
        weights: {
          timeliness: 0.15,
          authority: 0.15,
          quality: 0.15,
          relevance: 0.15,
          aiImportance: 0.15,
          engagement: 0.25
        },
        isActive: false,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

// 导出单例
export const scoringWeightManager = new ScoringWeightManagerService();

