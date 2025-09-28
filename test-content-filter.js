// 测试内容过滤功能
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// 测试内容示例
const testContents = [
  {
    title: 'Machine Learning Model Optimization at Scale: From Theory to Production',
    description: 'A comprehensive guide explores the strategies, tools, and best practices for optimizing machine learning models at scale',
    content: 'In today\'s data-driven world, machine learning models are no longer academic curiosities but critical components powering everything from recommendation systems to autonomous vehicles...'
  },
  {
    title: 'Apple Announces New iPhone 15 with Revolutionary Camera Technology',
    description: 'Apple unveils its latest smartphone featuring advanced AI-powered photography and improved battery life',
    content: 'Apple today announced the iPhone 15, featuring breakthrough camera technology and enhanced performance...'
  },
  {
    title: 'Tesla Reports Record Q3 Earnings, Stock Surges 12%',
    description: 'Electric vehicle maker Tesla exceeded analyst expectations with strong quarterly results',
    content: 'Tesla Inc. reported record third-quarter earnings, beating Wall Street estimates...'
  },
  {
    title: 'How to Build a React App with TypeScript and Node.js',
    description: 'Step-by-step tutorial for creating a full-stack application using modern web technologies',
    content: 'This tutorial will guide you through building a complete React application with TypeScript backend...'
  },
  {
    title: 'Google Invests $2B in AI Startup Anthropic',
    description: 'Tech giant Google makes major investment in artificial intelligence company focused on safe AI development',
    content: 'Google has announced a $2 billion investment in Anthropic, an AI safety company...'
  }
];

async function testContentFilter() {
  try {
    console.log('🧪 测试内容过滤功能...\n');

    // 测试批量过滤
    const response = await axios.post(`${API_BASE}/content-filter/batch-test`, {
      contents: testContents
    });

    const { results, statistics } = response.data.data;

    console.log('📊 过滤统计:');
    console.log(`总内容数: ${statistics.total}`);
    console.log(`过滤掉: ${statistics.filtered} (${statistics.filterRate.toFixed(1)}%)`);
    console.log(`保留: ${statistics.kept}`);
    console.log('过滤原因:', statistics.reasons);
    console.log('\n');

    console.log('📝 详细结果:');
    results.forEach((result, index) => {
      const status = result.filterResult.shouldFilter ? '❌ 过滤' : '✅ 保留';
      console.log(`${index + 1}. ${status}: ${result.title}`);
      console.log(`   原因: ${result.filterResult.reason}`);
      console.log(`   包含分数: ${(result.filterResult.includeScore * 100).toFixed(1)}%`);
      console.log(`   排除分数: ${(result.filterResult.excludeScore * 100).toFixed(1)}%`);
      console.log('');
    });

  } catch (error) {
    if (error.response) {
      console.error('❌ API错误:', error.response.data);
    } else {
      console.error('❌ 请求失败:', error.message);
    }
  }
}

// 运行测试
testContentFilter();
