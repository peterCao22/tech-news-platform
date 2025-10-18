/**
 * Content Template Service
 * 内容模板管理服务
 * Story 3.3: Manual Content Management
 */

import { prisma, ContentTemplate } from '@tech-news-platform/database';

interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: string;
  template: Record<string, any>;
  createdBy: string;
}

interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  template?: Record<string, any>;
  isActive?: boolean;
}

interface GetTemplatesQuery {
  category?: string;
  isActive?: boolean;
  createdBy?: string;
}

class ContentTemplateService {
  /**
   * 创建内容模板
   */
  async createTemplate(input: CreateTemplateInput): Promise<ContentTemplate> {
    try {
      const template = await prisma.contentTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          category: input.category,
          template: input.template,
          createdBy: input.createdBy,
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

      return template;
    } catch (error: any) {
      console.error('[Content Template] Create error:', error);
      throw new Error(`创建模板失败: ${error.message}`);
    }
  }

  /**
   * 获取模板列表
   */
  async getTemplates(query: GetTemplatesQuery = {}): Promise<ContentTemplate[]> {
    try {
      const where: any = {};

      if (query.category) {
        where.category = query.category;
      }

      if (query.isActive !== undefined) {
        where.isActive = query.isActive;
      }

      if (query.createdBy) {
        where.createdBy = query.createdBy;
      }

      const templates = await prisma.contentTemplate.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return templates;
    } catch (error: any) {
      console.error('[Content Template] Get templates error:', error);
      throw new Error(`获取模板列表失败: ${error.message}`);
    }
  }

  /**
   * 获取单个模板
   */
  async getTemplate(templateId: string): Promise<ContentTemplate | null> {
    try {
      const template = await prisma.contentTemplate.findUnique({
        where: { id: templateId },
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

      return template;
    } catch (error: any) {
      console.error('[Content Template] Get template error:', error);
      throw new Error(`获取模板失败: ${error.message}`);
    }
  }

  /**
   * 更新模板
   */
  async updateTemplate(
    templateId: string,
    input: UpdateTemplateInput
  ): Promise<ContentTemplate> {
    try {
      const template = await prisma.contentTemplate.update({
        where: { id: templateId },
        data: input,
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

      return template;
    } catch (error: any) {
      console.error('[Content Template] Update error:', error);
      throw new Error(`更新模板失败: ${error.message}`);
    }
  }

  /**
   * 删除模板（软删除 - 设置为不活跃）
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await prisma.contentTemplate.update({
        where: { id: templateId },
        data: { isActive: false },
      });
    } catch (error: any) {
      console.error('[Content Template] Delete error:', error);
      throw new Error(`删除模板失败: ${error.message}`);
    }
  }

  /**
   * 永久删除模板
   */
  async permanentDeleteTemplate(templateId: string): Promise<void> {
    try {
      await prisma.contentTemplate.delete({
        where: { id: templateId },
      });
    } catch (error: any) {
      console.error('[Content Template] Permanent delete error:', error);
      throw new Error(`永久删除模板失败: ${error.message}`);
    }
  }

  /**
   * 应用模板到内容
   */
  applyTemplate(template: ContentTemplate, baseData: Record<string, any> = {}): Record<string, any> {
    try {
      const templateData = template.template as Record<string, any>;
      
      // 合并模板默认值和基础数据
      const result: Record<string, any> = {
        ...templateData.defaultValues || {},
        ...baseData,
      };

      // 应用模板字段
      if (template.category && !result.category) {
        result.category = template.category;
      }

      if (templateData.tags && (!result.tags || result.tags.length === 0)) {
        result.tags = templateData.tags;
      }

      return result;
    } catch (error: any) {
      console.error('[Content Template] Apply template error:', error);
      throw new Error(`应用模板失败: ${error.message}`);
    }
  }

  /**
   * 获取预定义模板
   */
  getBuiltInTemplates() {
    return [
      {
        name: 'AI技术新闻',
        description: 'AI和机器学习相关技术新闻',
        category: 'AI',
        template: {
          category: 'AI',
          tags: ['AI', '机器学习', '人工智能'],
          defaultValues: {
            reviewStatus: 'PENDING_REVIEW',
          },
        },
      },
      {
        name: '股票市场新闻',
        description: '股票和金融市场相关新闻',
        category: 'FINANCE',
        template: {
          category: 'FINANCE',
          tags: ['股票', '金融', '市场'],
          defaultValues: {
            reviewStatus: 'PENDING_REVIEW',
          },
        },
      },
      {
        name: '科技公司动态',
        description: '科技公司最新动态和发展',
        category: 'TECH_COMPANY',
        template: {
          category: 'TECH_COMPANY',
          tags: ['科技公司', '企业动态'],
          defaultValues: {
            reviewStatus: 'PENDING_REVIEW',
          },
        },
      },
      {
        name: '产品发布',
        description: '新产品和服务发布信息',
        category: 'PRODUCT',
        template: {
          category: 'PRODUCT',
          tags: ['产品发布', '新品'],
          defaultValues: {
            reviewStatus: 'PENDING_REVIEW',
          },
        },
      },
    ];
  }

  /**
   * 初始化内置模板
   */
  async initializeBuiltInTemplates(userId: string): Promise<void> {
    try {
      const builtInTemplates = this.getBuiltInTemplates();

      for (const template of builtInTemplates) {
        // 检查是否已存在
        const existing = await prisma.contentTemplate.findFirst({
          where: {
            name: template.name,
            createdBy: userId,
          },
        });

        if (!existing) {
          await this.createTemplate({
            ...template,
            createdBy: userId,
          });
        }
      }

      console.log('[Content Template] Built-in templates initialized');
    } catch (error: any) {
      console.error('[Content Template] Initialize built-in templates error:', error);
    }
  }
}

export default new ContentTemplateService();

