/**
 * Filter Rule Service
 * Story 3.2: Intelligent Filter Rules
 * 
 * 负责规则的CRUD操作、版本管理和效果分析
 */

import {
  prisma,
  FilterRule,
  RuleVersion,
  RuleType,
  RuleStatus,
  ListType,
  SourceList,
} from '@tech-news-platform/database';
import { ruleEngine } from './rule-engine.service';

interface CreateRuleInput {
  name: string;
  description?: string;
  ruleType: RuleType;
  priority?: number;
  config: any;
  createdBy: string;
}

interface UpdateRuleInput {
  name?: string;
  description?: string;
  priority?: number;
  status?: RuleStatus;
  config?: any;
  updatedBy: string;
}

interface PublishRuleInput {
  changeLog?: string;
  publishedBy: string;
}

interface GetRulesQuery {
  type?: RuleType;
  status?: RuleStatus;
  page?: number;
  limit?: number;
  sortBy?: 'priority' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export class FilterRuleService {
  /**
   * 获取规则列表
   */
  async getRules(query: GetRulesQuery = {}) {
    const {
      type,
      status,
      page = 1,
      limit = 20,
      sortBy = 'priority',
      sortOrder = 'desc',
    } = query;

    const where: any = {};
    if (type) {
      where.ruleType = type;
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.filterRule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updater: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              versions: true,
              analytics: true,
            },
          },
        },
      }),
      prisma.filterRule.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取单个规则详情
   */
  async getRule(ruleId: string) {
    const rule = await prisma.filterRule.findUnique({
      where: { id: ruleId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        publisher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          orderBy: {
            version: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!rule) {
      throw new Error('规则不存在');
    }

    return rule;
  }

  /**
   * 创建新规则
   */
  async createRule(input: CreateRuleInput): Promise<FilterRule> {
    const rule = await prisma.filterRule.create({
      data: {
        name: input.name,
        description: input.description,
        ruleType: input.ruleType,
        priority: input.priority || 0,
        config: input.config,
        createdBy: input.createdBy,
        status: RuleStatus.DRAFT,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return rule;
  }

  /**
   * 更新规则
   */
  async updateRule(ruleId: string, input: UpdateRuleInput): Promise<FilterRule> {
    // 检查规则是否存在
    const existingRule = await prisma.filterRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule) {
      throw new Error('规则不存在');
    }

    // 如果更新了配置，增加版本号
    const shouldIncrementVersion = input.config && 
      JSON.stringify(input.config) !== JSON.stringify(existingRule.config);

    const updateData: any = {
      updatedBy: input.updatedBy,
    };

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.status) updateData.status = input.status;
    if (input.config) {
      updateData.config = input.config;
      if (shouldIncrementVersion) {
        updateData.version = existingRule.version + 1;
        // 如果配置变更，取消发布状态
        updateData.isPublished = false;
        updateData.publishedAt = null;
        updateData.publishedBy = null;
      }
    }

    const updated = await prisma.filterRule.update({
      where: { id: ruleId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * 删除规则
   */
  async deleteRule(ruleId: string): Promise<void> {
    // 检查规则是否存在
    const rule = await prisma.filterRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new Error('规则不存在');
    }

    // 如果规则是激活状态，建议先停用
    if (rule.status === RuleStatus.ACTIVE) {
      throw new Error('无法删除激活的规则，请先停用');
    }

    await prisma.filterRule.delete({
      where: { id: ruleId },
    });
  }

  /**
   * 发布规则版本
   */
  async publishRule(ruleId: string, input: PublishRuleInput): Promise<{
    rule: FilterRule;
    version: RuleVersion;
  }> {
    const rule = await prisma.filterRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new Error('规则不存在');
    }

    // 创建版本快照
    const version = await prisma.ruleVersion.create({
      data: {
        ruleId: rule.id,
        version: rule.version,
        config: rule.config,
        changeLog: input.changeLog,
        createdBy: input.publishedBy,
      },
    });

    // 更新规则发布状态
    const updatedRule = await prisma.filterRule.update({
      where: { id: ruleId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: input.publishedBy,
        status: RuleStatus.ACTIVE,
      },
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      rule: updatedRule,
      version,
    };
  }

  /**
   * 回滚规则到指定版本
   */
  async rollbackRule(ruleId: string, targetVersion: number, userId: string): Promise<FilterRule> {
    // 获取目标版本
    const version = await prisma.ruleVersion.findUnique({
      where: {
        ruleId_version: {
          ruleId,
          version: targetVersion,
        },
      },
    });

    if (!version) {
      throw new Error('目标版本不存在');
    }

    // 回滚到目标版本的配置
    const updatedRule = await prisma.filterRule.update({
      where: { id: ruleId },
      data: {
        config: version.config,
        version: targetVersion,
        updatedBy: userId,
        // 回滚后需要重新发布
        isPublished: false,
        publishedAt: null,
        publishedBy: null,
        status: RuleStatus.DRAFT,
      },
    });

    return updatedRule;
  }

  /**
   * 获取规则版本历史
   */
  async getRuleVersions(ruleId: string) {
    const [rule, versions] = await Promise.all([
      prisma.filterRule.findUnique({
        where: { id: ruleId },
        select: {
          id: true,
          name: true,
          version: true,
          config: true,
          isPublished: true,
        },
      }),
      prisma.ruleVersion.findMany({
        where: { ruleId },
        orderBy: {
          version: 'desc',
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    if (!rule) {
      throw new Error('规则不存在');
    }

    return {
      current: rule,
      versions,
    };
  }

  /**
   * 测试规则效果
   */
  async testRule(input: {
    ruleConfig: any;
    ruleType: RuleType;
    contentIds?: string[];
    limit?: number;
  }) {
    const result = await ruleEngine.testRule(
      input.ruleConfig,
      input.ruleType,
      input.contentIds,
      input.limit
    );

    return result;
  }

  /**
   * 获取规则效果分析
   */
  async getRuleAnalytics(ruleId: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = { ruleId };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const analytics = await prisma.ruleAnalytics.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });

    // 计算汇总统计
    const summary = analytics.reduce(
      (acc, item) => {
        acc.totalAffected += item.affectedCount;
        acc.totalBoosted += item.boostedCount;
        acc.totalPenalty += item.penaltyCount;
        acc.totalBlocked += item.blockedCount;

        if (item.avgScoreBefore && item.avgScoreAfter) {
          acc.avgScoreDelta += item.avgScoreAfter - item.avgScoreBefore;
        }

        if (item.top10HitRate) {
          acc.avgTop10HitRate += item.top10HitRate;
          acc.hitRateCount++;
        }

        return acc;
      },
      {
        totalAffected: 0,
        totalBoosted: 0,
        totalPenalty: 0,
        totalBlocked: 0,
        avgScoreDelta: 0,
        avgTop10HitRate: 0,
        hitRateCount: 0,
      }
    );

    if (summary.hitRateCount > 0) {
      summary.avgTop10HitRate /= summary.hitRateCount;
    }

    return {
      summary,
      timeline: analytics,
    };
  }

  /**
   * 创建或更新规则分析记录
   */
  async recordRuleAnalytics(ruleId: string, data: {
    date: Date;
    affectedCount: number;
    boostedCount: number;
    penaltyCount: number;
    blockedCount: number;
    avgScoreBefore?: number;
    avgScoreAfter?: number;
    top10HitRate?: number;
    details?: any;
  }) {
    return await prisma.ruleAnalytics.upsert({
      where: {
        ruleId_date: {
          ruleId,
          date: data.date,
        },
      },
      create: {
        ruleId,
        ...data,
      },
      update: data,
    });
  }

  // ==================== Source List Management ====================

  /**
   * 获取来源列表（白名单/黑名单）
   */
  async getSourceLists(listType?: ListType, page: number = 1, limit: number = 50) {
    const where: any = {};
    if (listType) {
      where.listType = listType;
    }

    const [items, total] = await Promise.all([
      prisma.sourceList.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              type: true,
              url: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.sourceList.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 添加来源到白名单/黑名单
   */
  async addSourceToList(input: {
    listType: ListType;
    sourceId?: string;
    sourceName: string;
    sourceDomain?: string;
    weight?: number;
    reason?: string;
    createdBy: string;
  }): Promise<SourceList> {
    return await prisma.sourceList.create({
      data: {
        listType: input.listType,
        sourceId: input.sourceId,
        sourceName: input.sourceName,
        sourceDomain: input.sourceDomain,
        weight: input.weight || 1.0,
        reason: input.reason,
        createdBy: input.createdBy,
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * 更新来源列表项
   */
  async updateSourceList(listId: string, input: {
    weight?: number;
    reason?: string;
    isActive?: boolean;
  }): Promise<SourceList> {
    return await prisma.sourceList.update({
      where: { id: listId },
      data: input,
      include: {
        source: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * 删除来源列表项
   */
  async removeSourceFromList(listId: string): Promise<void> {
    await prisma.sourceList.delete({
      where: { id: listId },
    });
  }

  /**
   * 批量添加来源到列表
   */
  async batchAddSourcesToList(input: {
    listType: ListType;
    sourceIds: string[];
    weight?: number;
    reason?: string;
    createdBy: string;
  }): Promise<{ successCount: number; failedCount: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const sourceId of input.sourceIds) {
      try {
        // 获取来源信息
        const source = await prisma.source.findUnique({
          where: { id: sourceId },
        });

        if (!source) {
          failedCount++;
          continue;
        }

        await this.addSourceToList({
          listType: input.listType,
          sourceId: source.id,
          sourceName: source.name,
          sourceDomain: source.url || undefined,
          weight: input.weight,
          reason: input.reason,
          createdBy: input.createdBy,
        });

        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    return { successCount, failedCount };
  }
}

export const filterRuleService = new FilterRuleService();

