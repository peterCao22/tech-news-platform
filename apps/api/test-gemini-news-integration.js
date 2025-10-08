/**
 * Gemini新闻获取集成测试脚本
 * 测试Gemini AI新闻获取功能
 */

const fetch = require('node-fetch');

// 配置
const API_BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'admin@technews.com',
  password: 'admin123'
};

let authToken = '';

/**
 * 登录获取认证令牌
 */
async function login() {
  try {
    console.log('🔐 正在登录...');
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER)
    });

    if (!response.ok) {
      throw new Error(`登录失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.token;
    console.log('✅ 登录成功');
    return true;
  } catch (error) {
    console.error('❌ 登录失败:', error.message);
    return false;
  }
}

/**
 * 测试获取Gemini新闻
 */
async function testGetGeminiNews() {
  try {
    console.log('\n📰 测试获取Gemini新闻...');
    const response = await fetch(`${API_BASE_URL}/api/gemini-news/news?limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`获取新闻失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 获取Gemini新闻成功:');
    console.log('   总数:', data.data.total);
    console.log('   类型:', data.data.type);
    if (data.data.newsItems && data.data.newsItems.length > 0) {
      console.log('   示例新闻:', data.data.newsItems[0].title);
    }
    return data.data;
  } catch (error) {
    console.error('❌ 获取Gemini新闻失败:', error.message);
    return null;
  }
}

/**
 * 测试获取科技新闻
 */
async function testGetTechNews() {
  try {
    console.log('\n🔬 测试获取科技新闻...');
    const response = await fetch(`${API_BASE_URL}/api/gemini-news/tech-news?limit=3`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`获取科技新闻失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 获取科技新闻成功:');
    console.log('   总数:', data.data.total);
    if (data.data.newsItems && data.data.newsItems.length > 0) {
      console.log('   示例新闻:', data.data.newsItems[0].title);
    }
    return data.data;
  } catch (error) {
    console.error('❌ 获取科技新闻失败:', error.message);
    return null;
  }
}

/**
 * 测试获取AI新闻
 */
async function testGetAINews() {
  try {
    console.log('\n🤖 测试获取AI新闻...');
    const response = await fetch(`${API_BASE_URL}/api/gemini-news/ai-news?limit=3`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`获取AI新闻失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 获取AI新闻成功:');
    console.log('   总数:', data.data.total);
    if (data.data.newsItems && data.data.newsItems.length > 0) {
      console.log('   示例新闻:', data.data.newsItems[0].title);
    }
    return data.data;
  } catch (error) {
    console.error('❌ 获取AI新闻失败:', error.message);
    return null;
  }
}

/**
 * 测试获取股票新闻
 */
async function testGetStockNews() {
  try {
    console.log('\n📈 测试获取股票新闻...');
    const response = await fetch(`${API_BASE_URL}/api/gemini-news/stock-news?limit=3`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`获取股票新闻失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 获取股票新闻成功:');
    console.log('   总数:', data.data.total);
    if (data.data.newsItems && data.data.newsItems.length > 0) {
      console.log('   示例新闻:', data.data.newsItems[0].title);
    }
    return data.data;
  } catch (error) {
    console.error('❌ 获取股票新闻失败:', error.message);
    return null;
  }
}

/**
 * 测试手动触发查询
 */
async function testTriggerQuery() {
  try {
    console.log('\n🚀 测试手动触发查询...');
    const response = await fetch(`${API_BASE_URL}/api/gemini-news/trigger-query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'tech_news',
        force: true
      })
    });

    if (!response.ok) {
      throw new Error(`触发查询失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 手动触发查询成功:');
    console.log('   查询类型:', data.data.queryType);
    console.log('   获取数量:', data.data.totalFetched);
    console.log('   保存数量:', data.data.totalSaved);
    console.log('   错误数量:', data.data.errors.length);
    return data.data;
  } catch (error) {
    console.error('❌ 手动触发查询失败:', error.message);
    return null;
  }
}

/**
 * 测试获取查询历史
 */
async function testGetQueryHistory() {
  try {
    console.log('\n📊 测试获取查询历史...');
    const response = await fetch(`${API_BASE_URL}/api/gemini-news/query-history?limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`获取查询历史失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 获取查询历史成功:');
    console.log('   历史记录数:', data.data.total);
    if (data.data.history && data.data.history.length > 0) {
      console.log('   最新查询:', data.data.history[0].queryType, data.data.history[0].queryTime);
    }
    return data.data;
  } catch (error) {
    console.error('❌ 获取查询历史失败:', error.message);
    return null;
  }
}

/**
 * 测试获取查询统计
 */
async function testGetQueryStats() {
  try {
    console.log('\n📈 测试获取查询统计...');
    const response = await fetch(`${API_BASE_URL}/api/gemini-news/query-stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`获取查询统计失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 获取查询统计成功:');
    console.log('   总查询数:', data.data.totalQueries);
    console.log('   成功查询数:', data.data.successfulQueries);
    console.log('   失败查询数:', data.data.failedQueries);
    console.log('   平均响应时间:', data.data.averageResponseTime.toFixed(2) + 'ms');
    return data.data;
  } catch (error) {
    console.error('❌ 获取查询统计失败:', error.message);
    return null;
  }
}

/**
 * 测试获取服务状态
 */
async function testGetServiceStatus() {
  try {
    console.log('\n🔍 测试获取服务状态...');
    const response = await fetch(`${API_BASE_URL}/api/gemini-news/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`获取服务状态失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 获取服务状态成功:');
    console.log('   服务状态:', data.data.serviceStatus);
    console.log('   统计信息:', JSON.stringify(data.data.stats, null, 2));
    return data.data;
  } catch (error) {
    console.error('❌ 获取服务状态失败:', error.message);
    return null;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始Gemini新闻获取集成测试...\n');

  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ 测试终止：登录失败');
    return;
  }

  // 测试获取Gemini新闻
  await testGetGeminiNews();

  // 测试获取科技新闻
  await testGetTechNews();

  // 测试获取AI新闻
  await testGetAINews();

  // 测试获取股票新闻
  await testGetStockNews();

  // 测试手动触发查询
  await testTriggerQuery();

  // 测试获取查询历史
  await testGetQueryHistory();

  // 测试获取查询统计
  await testGetQueryStats();

  // 测试获取服务状态
  await testGetServiceStatus();

  console.log('\n🎉 Gemini新闻获取集成测试完成！');
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
