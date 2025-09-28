// 内容过滤服务 - 基于关键词和规则过滤不需要的内容

import { logger } from '../utils/logger';

export interface FilterRule {
  type: 'include' | 'exclude';
  keywords: string[];
  weight: number; // 权重，用于计算匹配度
}

export interface ContentFilterConfig {
  // 包含规则 - 科技新闻和金融类
  includeRules: FilterRule[];
  // 排除规则 - IT开发、编程、机器学习等
  excludeRules: FilterRule[];
  // 最小匹配阈值
  minIncludeScore: number;
  maxExcludeScore: number;
}

export class ContentFilterService {
  private config: ContentFilterConfig;

  constructor() {
    this.config = {
      // 包含规则 - 我们想要的内容
      includeRules: [
        {
          type: 'include',
          keywords: [
            // === 科技新闻 ===
            '科技新闻', '技术突破', '创新技术', '新发明', '专利申请', '科研成果',
            'breakthrough', 'technological innovation', 'patent filing', 'discovery', 'scientific result',
            '新产品发布', '产品迭代', '产品升级', 'product launch', 'new release', 'product update',
            '技术大会', 'conference', 'summit', 'expo',

            // === 公司新闻 ===
            '融资', '投资', 'Pre-A', 'A轮融资', 'B轮融资', 'C轮融资', 
            'funding round', 'investment', 'IPO', 'initial public offering',
            '收购', '合并', '并购', 'acquisition', 'merger',
            '财报', '业绩报告', '季度财报', 'annual report',
            'earnings', 'quarterly results', 'revenue', 'profit',

            // === 行业趋势 ===
            '市场趋势', '行业动态', '产业升级', '市场预测', '市场研究',
            'market trend', 'industry report', 'sector analysis', 'market forecast',
            '白皮书', 'bluebook', 'research report', 'analysis',

            // === 金融科技 ===
            '金融科技', 'fintech', '数字货币', '加密货币', '虚拟货币', 
            'cryptocurrency', 'bitcoin', 'ethereum', 'stablecoin',
            '区块链应用', 'blockchain technology', 'web3', '去中心化', 'DeFi',
            '数字支付', '电子支付', '支付系统', 'mobile payment', 'digital wallet',

            // === 消费科技 ===
            '智能手机', '可折叠手机', 'wearable device', '智能手表', '智能眼镜',
            'smartphone', 'smartwatch', 'wearables', 'AR glasses', 'VR headset',
            '电动汽车', '新能源汽车', 'EV', 'electric vehicle', 'charging station',
            '自动驾驶', 'autonomous driving', '无人驾驶', 'self-driving car',
            '人工智能应用', 'AI应用', 'AI assistant', '智能助手',

            // === 企业科技 ===
            '云计算服务', '云原生', 'cloud computing', 'cloud service', 'SaaS',
            '企业软件', 'enterprise solution', 'ERP', 'CRM', 'workflow automation',
            '数据安全', 'cybersecurity', '网络攻击', '勒索软件', 'ransomware',
            '隐私保护', 'data privacy', 'GDPR', 'compliance',

            // === 人工智能 & 新兴技术 ===
            '人工智能', '大模型', '生成式AI', '生成式人工智能', 
            'AI application', 'AI model', 'foundation model', 'Generative AI', 'LLM',
            '机器学习', '深度学习', 'machine learning', 'deep learning',
            '机器人', '人形机器人', '工业机器人', 'service robot',
            'robotics', 'humanoid robot', 'automation robot',
            '半导体', '芯片', '集成电路', 'IC设计', 'GPU', 'CPU',
            'semiconductor', 'chip', 'fab', 'chip design', 'TSMC', 'Intel', 'Nvidia',
            '量子计算', 'quantum computing', '量子芯片',

            // === 绿色科技 / 新能源（与投资热点相关）===
            '新能源', '光伏', '风能', '氢能', '储能',
            'renewable energy', 'solar power', 'wind energy', 'hydrogen energy',
            'energy storage', 'battery technology', 'solid state battery'
          ],
          weight: 1.0
        }
      ],
      
      // 排除规则 - 我们不想要的内容
      excludeRules: [
        {
          type: 'exclude',
          keywords: [
            // 编程和开发
            'programming', '编程', 'coding', '代码', 'code',
            'developer', '开发者', '程序员', 'programmer',
            'javascript', 'python', 'react', 'node.js', 'typescript',
            'frontend', '前端', 'backend', '后端', 'fullstack',
            'API', 'database', '数据库', 'framework', '框架',
            'library', '库', 'package', '包管理',
            
            // 机器学习和AI技术
            'machine learning', '机器学习', 'deep learning', '深度学习',
            'neural network', '神经网络', 'model training', '模型训练',
            'algorithm', '算法', 'optimization', '优化',
            'tensorflow', 'pytorch', 'scikit-learn',
            'data science', '数据科学', 'MLOps',
            
            // 开发工具和技术
            'docker', 'kubernetes', 'devops', 'CI/CD',
            'git', 'github', 'version control', '版本控制',
            'testing', '测试', 'debugging', '调试',
            'deployment', '部署', 'monitoring', '监控',
            
            // 技术教程和指南
            'tutorial', '教程', 'guide', '指南', 'how to',
            'best practices', '最佳实践', 'tips', '技巧',
            'configuration', '配置', 'setup', '设置',
            
            // 开源项目
            'open source', '开源', 'repository', '仓库',
            'contribution', '贡献', 'pull request', 'issue',
            
            // 技术架构
            'architecture', '架构', 'microservices', '微服务',
            'scalability', '可扩展性', 'performance', '性能优化',
            'infrastructure', '基础设施'
          ],
          weight: 1.0
        }
      ],
      
      minIncludeScore: 0.1, // 至少10%匹配度才包含（更宽松）
      maxExcludeScore: 0.3  // 超过30%排除匹配度就过滤掉（更宽松）
    };
  }

  /**
   * 检查内容是否应该被过滤掉
   */
  shouldFilterContent(title: string, description?: string, content?: string): {
    shouldFilter: boolean;
    reason: string;
    includeScore: number;
    excludeScore: number;
  } {
    const text = this.combineText(title, description, content);
    const includeScore = this.calculateScore(text, this.config.includeRules);
    const excludeScore = this.calculateScore(text, this.config.excludeRules);

    let shouldFilter = false;
    let reason = '';

    // 如果排除分数太高，直接过滤
    if (excludeScore > this.config.maxExcludeScore) {
      shouldFilter = true;
      reason = `技术开发内容，排除分数: ${(excludeScore * 100).toFixed(1)}%`;
    }
    // 如果包含分数太低，也过滤
    else if (includeScore < this.config.minIncludeScore) {
      shouldFilter = true;
      reason = `不符合科技新闻标准，包含分数: ${(includeScore * 100).toFixed(1)}%`;
    }
    // 如果排除分数高于包含分数，也过滤
    else if (excludeScore > includeScore) {
      shouldFilter = true;
      reason = `技术内容占主导，排除分数(${(excludeScore * 100).toFixed(1)}%) > 包含分数(${(includeScore * 100).toFixed(1)}%)`;
    }
    else {
      reason = `符合科技新闻标准，包含分数: ${(includeScore * 100).toFixed(1)}%，排除分数: ${(excludeScore * 100).toFixed(1)}%`;
    }

    return {
      shouldFilter,
      reason,
      includeScore,
      excludeScore
    };
  }

  /**
   * 合并文本内容
   */
  private combineText(title: string, description?: string, content?: string): string {
    const parts = [title];
    if (description) parts.push(description);
    if (content) {
      // 只取内容的前500个字符，避免处理过长的文本
      parts.push(content.substring(0, 500));
    }
    return parts.join(' ').toLowerCase();
  }

  /**
   * 计算匹配分数
   */
  private calculateScore(text: string, rules: FilterRule[]): number {
    let totalScore = 0;
    let matchCount = 0;

    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          totalScore += rule.weight;
          matchCount++;
        }
      }
    }

    // 返回匹配关键词的比例
    const totalKeywords = rules.reduce((sum, rule) => sum + rule.keywords.length, 0);
    return totalKeywords > 0 ? matchCount / totalKeywords : 0;
  }

  /**
   * 批量过滤内容
   */
  filterContentBatch(contents: Array<{
    title: string;
    description?: string;
    content?: string;
  }>): Array<{
    index: number;
    shouldFilter: boolean;
    reason: string;
    includeScore: number;
    excludeScore: number;
  }> {
    return contents.map((content, index) => ({
      index,
      ...this.shouldFilterContent(content.title, content.description, content.content)
    }));
  }

  /**
   * 获取过滤统计信息
   */
  getFilterStats(results: ReturnType<typeof this.filterContentBatch>): {
    total: number;
    filtered: number;
    kept: number;
    filterRate: number;
    reasons: Record<string, number>;
  } {
    const total = results.length;
    const filtered = results.filter(r => r.shouldFilter).length;
    const kept = total - filtered;
    const filterRate = total > 0 ? (filtered / total) * 100 : 0;

    // 统计过滤原因
    const reasons: Record<string, number> = {};
    results.forEach(result => {
      if (result.shouldFilter) {
        const reasonKey = result.reason.split('，')[0]; // 取原因的第一部分
        reasons[reasonKey] = (reasons[reasonKey] || 0) + 1;
      }
    });

    return {
      total,
      filtered,
      kept,
      filterRate,
      reasons
    };
  }

  /**
   * 更新过滤配置
   */
  updateConfig(newConfig: Partial<ContentFilterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('内容过滤配置已更新', { config: this.config });
  }
}

export const contentFilterService = new ContentFilterService();
