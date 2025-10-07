// 科技新闻聚合平台 - RSS源种子数据
// 预配置知名科技媒体的RSS源

import { db } from '../client';
import { SourceType, SourceStatus } from '../generated';

export const defaultRSSSources = [
  // 国际知名科技媒体
  {
    name: 'TechCrunch',
    type: SourceType.RSS,
    url: 'https://techcrunch.com/feed/',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Leading technology media property, dedicated to obsessively profiling startups',
      category: 'startup',
      language: 'en',
      updateFrequency: 'hourly'
    }
  },
  {
    name: 'MIT Technology Review',
    type: SourceType.RSS,
    url: 'https://www.technologyreview.com/feed/',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'MIT\'s magazine of emerging technology and its impact',
      category: 'research',
      language: 'en',
      updateFrequency: 'daily'
    }
  },
  {
    name: 'Ars Technica',
    type: SourceType.RSS,
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Technology news and information',
      category: 'tech',
      language: 'en',
      updateFrequency: 'hourly'
    }
  },
  {
    name: 'Wired',
    type: SourceType.RSS,
    url: 'https://www.wired.com/feed/rss',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Ideas, breakthroughs, and the people behind them',
      category: 'tech',
      language: 'en',
      updateFrequency: 'hourly'
    }
  },
  {
    name: 'The Verge',
    type: SourceType.RSS,
    url: 'https://www.theverge.com/rss/index.xml',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Technology, science, art, and culture',
      category: 'tech',
      language: 'en',
      updateFrequency: 'hourly'
    }
  },
  {
    name: 'Hacker News',
    type: SourceType.RSS,
    url: 'https://hnrss.org/frontpage',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Social news website focusing on computer science and entrepreneurship',
      category: 'programming',
      language: 'en',
      updateFrequency: 'hourly'
    }
  },
  {
    name: 'VentureBeat',
    type: SourceType.RSS,
    url: 'https://venturebeat.com/feed/',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Technology news and events',
      category: 'startup',
      language: 'en',
      updateFrequency: 'hourly'
    }
  },
  {
    name: 'Engadget',
    type: SourceType.RSS,
    url: 'https://www.engadget.com/rss.xml',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Technology news and reviews',
      category: 'tech',
      language: 'en',
      updateFrequency: 'hourly'
    }
  },
  {
    name: 'IEEE Spectrum',
    type: SourceType.RSS,
    url: 'https://spectrum.ieee.org/rss/fulltext',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Technology, engineering, and science news',
      category: 'research',
      language: 'en',
      updateFrequency: 'daily'
    }
  },
  {
    name: 'TechMeme',
    type: SourceType.RSS,
    url: 'https://www.techmeme.com/feed.xml',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Technology news aggregator',
      category: 'tech',
      language: 'en',
      updateFrequency: 'hourly'
    }
  },

  // 中文科技媒体
  {
    name: '36氪',
    type: SourceType.RSS,
    url: 'https://36kr.com/feed',
    status: SourceStatus.ACTIVE,
    config: {
      description: '中国领先的科技媒体，报道最新的互联网科技新闻',
      category: 'startup',
      language: 'zh',
      updateFrequency: 'hourly'
    }
  },
  {
    name: '虎嗅网',
    type: SourceType.RSS,
    url: 'https://www.huxiu.com/rss/0.xml',
    status: SourceStatus.ACTIVE,
    config: {
      description: '个性化商业资讯与观点交流平台',
      category: 'business',
      language: 'zh',
      updateFrequency: 'hourly'
    }
  },
  {
    name: 'InfoQ中国',
    type: SourceType.RSS,
    url: 'https://www.infoq.cn/feed',
    status: SourceStatus.ACTIVE,
    config: {
      description: '软件开发领域的知识与创新传播者',
      category: 'programming',
      language: 'zh',
      updateFrequency: 'daily'
    }
  },
  // AI和机器学习专门源
  {
    name: 'AI News - MIT Technology Review',
    type: SourceType.RSS,
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Artificial Intelligence news from MIT Technology Review',
      category: 'ai',
      language: 'en',
      updateFrequency: 'daily'
    }
  },
  {
    name: 'OpenAI Blog',
    type: SourceType.RSS,
    url: 'https://openai.com/blog/rss.xml',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Latest updates from OpenAI',
      category: 'ai',
      language: 'en',
      updateFrequency: 'weekly'
    }
  },
  {
    name: 'Google AI Blog',
    type: SourceType.RSS,
    url: 'https://ai.googleblog.com/feeds/posts/default',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Latest news from Google AI',
      category: 'ai',
      language: 'en',
      updateFrequency: 'weekly'
    }
  },

  // 开发者和编程
  {
    name: 'GitHub Blog',
    type: SourceType.RSS,
    url: 'https://github.blog/feed/',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Updates, ideas, and inspiration from GitHub',
      category: 'programming',
      language: 'en',
      updateFrequency: 'weekly'
    }
  },
  {
    name: 'Stack Overflow Blog',
    type: SourceType.RSS,
    url: 'https://stackoverflow.blog/feed/',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'Essays, opinions, and advice on the act of computer programming',
      category: 'programming',
      language: 'en',
      updateFrequency: 'weekly'
    }
  },
  {
    name: 'Dev.to',
    type: SourceType.RSS,
    url: 'https://dev.to/feed',
    status: SourceStatus.ACTIVE,
    config: {
      description: 'A constructive and inclusive social network for software developers',
      category: 'programming',
      language: 'en',
      updateFrequency: 'hourly'
    }
  }
];

/**
 * 种子RSS源到数据库
 */
export async function seedRSSSources() {
  console.log('🌱 开始种子RSS源数据...');

  try {
    // 检查是否已经有RSS源数据
    const existingCount = await db.source.count({
      where: { type: SourceType.RSS }
    });

    if (existingCount > 0) {
      console.log(`ℹ️  数据库中已存在 ${existingCount} 个RSS源，跳过种子数据`);
      return;
    }

    // 批量创建RSS源
    const createdSources = await db.source.createMany({
      data: defaultRSSSources,
      skipDuplicates: true
    });

    console.log(`✅ 成功创建 ${createdSources.count} 个RSS源`);
    
    // 显示创建的源列表
    const sources = await db.source.findMany({
      where: { type: SourceType.RSS },
      select: { name: true, url: true, status: true }
    });

    console.log('\n📋 已创建的RSS源:');
    sources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.name} (${source.status})`);
      console.log(`   ${source.url}`);
    });

  } catch (error) {
    console.error('❌ 种子RSS源数据失败:', error);
    throw error;
  }
}

/**
 * 清理所有RSS源数据（仅用于开发/测试）
 */
export async function clearRSSSources() {
  console.log('🧹 清理RSS源数据...');
  
  try {
    // 先删除相关的内容
    const deletedContent = await db.content.deleteMany({
      where: {
        source: {
          type: SourceType.RSS
        }
      }
    });
    console.log(`🗑️  已删除 ${deletedContent.count} 条相关内容`);

    // 再删除RSS源
    const deletedSources = await db.source.deleteMany({
      where: { type: SourceType.RSS }
    });
    
    console.log(`✅ 已删除 ${deletedSources.count} 个RSS源`);
  } catch (error) {
    console.error('❌ 清理RSS源数据失败:', error);
    throw error;
  }
}
