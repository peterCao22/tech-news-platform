// 内容过滤服务单元测试
// 测试基于关键词的智能内容过滤功能

import { describe, beforeEach, it, expect } from '@jest/globals';
import { ContentFilterService } from '../../services/content-filter.service';

describe('ContentFilterService', () => {
  let contentFilterService: ContentFilterService;

  beforeEach(() => {
    contentFilterService = new ContentFilterService();
  });

  describe('shouldFilterContent', () => {
    it('应该保留包含科技新闻关键词的内容', () => {
      const result = contentFilterService.shouldFilterContent(
        '腾讯发布并开源新一代生图模型"混元图像3.0"',
        '腾讯公司今日宣布发布新一代人工智能生图模型',
        ''
      );

      expect(result.shouldFilter).toBe(false);
      expect(result.includeScore).toBeGreaterThanOrEqual(0.1); // 至少10%
      expect(result.reason).toContain('符合科技新闻标准');
    });

    it('应该保留包含加密货币关键词的内容', () => {
      const result = contentFilterService.shouldFilterContent(
        '加密货币价格走低，以太坊与比特币现货ETF创单周资金流出纪录',
        '加密货币市场出现波动，比特币和以太坊价格下跌',
        ''
      );

      expect(result.shouldFilter).toBe(false);
      expect(result.includeScore).toBeGreaterThanOrEqual(0.1);
      expect(result.reason).toContain('符合科技新闻标准');
    });

    it('应该保留包含融资投资关键词的内容', () => {
      const result = contentFilterService.shouldFilterContent(
        '"乐享科技"完成2亿元"天使++"轮融资',
        '科技公司获得新一轮投资，用于产品研发',
        ''
      );

      expect(result.shouldFilter).toBe(false);
      expect(result.includeScore).toBeGreaterThanOrEqual(0.1);
      expect(result.reason).toContain('符合科技新闻标准');
    });

    it('应该过滤包含编程开发关键词的内容', () => {
      const result = contentFilterService.shouldFilterContent(
        'React 18新特性详解：并发渲染和自动批处理',
        '本文介绍React 18的新功能，包括并发渲染、自动批处理等开发者特性',
        'function Component() { return <div>Hello</div>; }'
      );

      expect(result.shouldFilter).toBe(true);
      expect(result.excludeScore).toBeGreaterThanOrEqual(0.2); // 检查排除分数
      expect(result.reason).toContain('不符合科技新闻标准');
    });

    it('应该过滤包含算法和数据结构的内容', () => {
      const result = contentFilterService.shouldFilterContent(
        '深度学习算法优化：从理论到实践',
        '本文讨论机器学习算法的优化方法和数据结构设计',
        ''
      );

      expect(result.shouldFilter).toBe(true);
      expect(result.excludeScore).toBeGreaterThan(0.3);
    });

    it('应该处理空内容', () => {
      const result = contentFilterService.shouldFilterContent('', '', '');

      expect(result.shouldFilter).toBe(true);
      expect(result.includeScore).toBe(0);
      expect(result.excludeScore).toBe(0);
      expect(result.reason).toContain('不符合科技新闻标准');
    });

    it('应该处理只有标题的内容', () => {
      const result = contentFilterService.shouldFilterContent(
        '人工智能技术突破',
        '',
        ''
      );

      expect(result.shouldFilter).toBe(false);
      expect(result.includeScore).toBeGreaterThan(0);
    });

    it('应该正确计算混合内容的分数', () => {
      // 包含既有包含关键词又有排除关键词的内容
      const result = contentFilterService.shouldFilterContent(
        '人工智能开发框架TensorFlow 2.0发布',
        '谷歌发布了新版本的机器学习框架，包含多项开发者功能改进',
        ''
      );

      // 应该根据包含和排除分数的平衡来决定
      expect(result.includeScore).toBeGreaterThan(0);
      expect(result.excludeScore).toBeGreaterThan(0);
    });
  });

  // 注意：calculateScore是私有方法，我们通过shouldFilterContent间接测试其功能

  describe('filterContentBatch', () => {
    it('应该批量过滤内容数组', () => {
      const contents = [
        {
          title: '腾讯发布新AI模型',
          description: '人工智能技术突破',
          content: '',
        },
        {
          title: 'React开发教程',
          description: '学习React组件开发',
          content: 'function App() { return <div>Hello</div>; }',
        },
        {
          title: '比特币价格分析',
          description: '加密货币市场动态',
          content: '',
        },
      ];

      const results = contentFilterService.filterContentBatch(contents);

      expect(results).toHaveLength(3);
      
      // 第一个应该保留（AI相关）
      expect(results[0].shouldFilter).toBe(false);
      
      // 第二个应该过滤（开发相关）
      expect(results[1].shouldFilter).toBe(true);
      
      // 第三个应该保留（加密货币相关）
      expect(results[2].shouldFilter).toBe(false);
    });

    it('应该处理空数组', () => {
      const results = contentFilterService.filterContentBatch([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('getFilterStats', () => {
    it('应该正确计算过滤统计信息', () => {
      const filterResults = [
        { index: 0, shouldFilter: false, includeScore: 0.2, excludeScore: 0.0, reason: 'Tech news' },
        { index: 1, shouldFilter: true, includeScore: 0.05, excludeScore: 0.4, reason: 'Development content' },
        { index: 2, shouldFilter: false, includeScore: 0.3, excludeScore: 0.1, reason: 'Finance news' },
        { index: 3, shouldFilter: true, includeScore: 0.0, excludeScore: 0.5, reason: 'Programming tutorial' },
      ];

      const stats = contentFilterService.getFilterStats(filterResults);

      expect(stats).toEqual({
        total: 4,
        filtered: 2,
        kept: 2,
        filterRate: 50,
        reasons: {
          'Development content': 1,
          'Programming tutorial': 1,
        },
      });
    });

    it('应该处理全部保留的情况', () => {
      const filterResults = [
        { index: 0, shouldFilter: false, includeScore: 0.2, excludeScore: 0.0, reason: 'Tech news' },
        { index: 1, shouldFilter: false, includeScore: 0.3, excludeScore: 0.0, reason: 'Finance news' },
      ];

      const stats = contentFilterService.getFilterStats(filterResults);

      expect(stats).toEqual({
        total: 2,
        filtered: 0,
        kept: 2,
        filterRate: 0,
        reasons: {},
      });
    });

    it('应该处理全部过滤的情况', () => {
      const filterResults = [
        { index: 0, shouldFilter: true, includeScore: 0.0, excludeScore: 0.4, reason: 'Development' },
        { index: 1, shouldFilter: true, includeScore: 0.0, excludeScore: 0.5, reason: 'Programming' },
      ];

      const stats = contentFilterService.getFilterStats(filterResults);

      expect(stats).toEqual({
        total: 2,
        filtered: 2,
        kept: 0,
        filterRate: 100,
        reasons: {
          'Development': 1,
          'Programming': 1,
        },
      });
    });

    it('应该处理空结果数组', () => {
      const stats = contentFilterService.getFilterStats([]);

      expect(stats).toEqual({
        total: 0,
        filtered: 0,
        kept: 0,
        filterRate: 0,
        reasons: {},
      });
    });
  });

  describe('边界情况测试', () => {
    it('应该处理极长的文本', () => {
      const longText = 'A'.repeat(10000) + '人工智能' + 'B'.repeat(10000);
      
      const result = contentFilterService.shouldFilterContent(
        longText,
        '',
        ''
      );

      expect(result.includeScore).toBeGreaterThan(0);
    });

    it('应该处理特殊字符', () => {
      const result = contentFilterService.shouldFilterContent(
        '人工智能@#$%^&*()技术突破！！！',
        '科技新闻：AI发展....',
        ''
      );

      expect(result.shouldFilter).toBe(false);
      expect(result.includeScore).toBeGreaterThan(0);
    });

    it('应该处理Unicode字符', () => {
      const result = contentFilterService.shouldFilterContent(
        '🤖 人工智能技术 🚀 突破性进展',
        'AI技术在各领域应用 💡',
        ''
      );

      expect(result.shouldFilter).toBe(false);
      expect(result.includeScore).toBeGreaterThan(0);
    });
  });

  describe('配置测试', () => {
    it('应该使用正确的阈值配置', () => {
      const config = (contentFilterService as any).config;

      expect(config.minIncludeScore).toBe(0.1); // 10%
      expect(config.maxExcludeScore).toBe(0.3); // 30%
    });

    it('应该包含预期的包含关键词', () => {
      const config = (contentFilterService as any).config;
      const includeKeywords = config.includeRules[0].keywords;

      expect(includeKeywords).toContain('人工智能');
      expect(includeKeywords).toContain('加密货币');
      expect(includeKeywords).toContain('融资');
      expect(includeKeywords).toContain('breakthrough');
      expect(includeKeywords).toContain('investment');
    });

    it('应该包含预期的排除关键词', () => {
      const config = (contentFilterService as any).config;
      const excludeKeywords = config.excludeRules[0].keywords;

      expect(excludeKeywords).toContain('编程');
      expect(excludeKeywords).toContain('代码');
      expect(excludeKeywords).toContain('开发者');
      expect(excludeKeywords).toContain('programming');
      expect(excludeKeywords).toContain('coding');
    });
  });
});
