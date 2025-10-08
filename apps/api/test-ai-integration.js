/**
 * AI服务集成测试脚本
 * 测试Gemini和Claude AI服务的集成
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
 * 获取AI服务状态
 */
async function getAIStatus() {
  try {
    console.log('\n📊 获取AI服务状态...');
    const response = await fetch(`${API_BASE_URL}/api/ai/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`获取状态失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ AI服务状态:', JSON.stringify(data.data, null, 2));
    return data.data;
  } catch (error) {
    console.error('❌ 获取AI服务状态失败:', error.message);
    return null;
  }
}

/**
 * 测试文本生成
 */
async function testGenerateText() {
  try {
    console.log('\n🤖 测试文本生成...');
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: '请用一句话介绍人工智能的发展趋势',
        options: {
          maxTokens: 100,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`文本生成失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 文本生成成功:');
    console.log('   提供商:', data.data.provider);
    console.log('   生成内容:', data.data.text);
    return data.data;
  } catch (error) {
    console.error('❌ 文本生成失败:', error.message);
    return null;
  }
}

/**
 * 测试摘要生成
 */
async function testGenerateSummary() {
  try {
    console.log('\n📝 测试摘要生成...');
    const testContent = `
    人工智能（AI）技术正在快速发展，特别是在自然语言处理、计算机视觉和机器学习领域。
    大型语言模型如GPT、Claude等已经能够理解和生成人类语言，在多个行业应用中展现出巨大潜力。
    同时，AI技术也面临着数据隐私、算法偏见、就业影响等挑战。
    未来，AI技术将继续向更智能、更安全、更可靠的方向发展。
    `;

    const response = await fetch(`${API_BASE_URL}/api/ai/summarize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: testContent,
        options: {
          maxTokens: 200,
          temperature: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`摘要生成失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 摘要生成成功:');
    console.log('   提供商:', data.data.provider);
    console.log('   摘要:', data.data.summary);
    return data.data;
  } catch (error) {
    console.error('❌ 摘要生成失败:', error.message);
    return null;
  }
}

/**
 * 测试内容分析
 */
async function testAnalyzeContent() {
  try {
    console.log('\n🔍 测试内容分析...');
    const testContent = `
    苹果公司今日宣布推出新的AI芯片，该芯片将大幅提升iPhone的性能。
    新芯片采用5纳米工艺制造，集成了神经网络处理单元，能够支持更复杂的AI应用。
    分析师认为这将推动苹果股价上涨，预计涨幅可能达到10%。
    该消息发布后，苹果股票（AAPL）在盘后交易中上涨了3%。
    `;

    const response = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: testContent,
        options: {
          maxTokens: 500,
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      throw new Error(`内容分析失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 内容分析成功:');
    console.log('   提供商:', data.data.provider);
    console.log('   分析结果:', JSON.stringify(data.data.analysis, null, 2));
    return data.data;
  } catch (error) {
    console.error('❌ 内容分析失败:', error.message);
    return null;
  }
}

/**
 * 测试批量处理
 */
async function testBatchProcess() {
  try {
    console.log('\n📦 测试批量处理...');
    const testContents = [
      'OpenAI发布了新的GPT模型，性能大幅提升。',
      '特斯拉股价今日上涨5%，创历史新高。',
      '微软宣布投资AI技术，计划投入100亿美元。'
    ];

    const response = await fetch(`${API_BASE_URL}/api/ai/batch-process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: testContents,
        options: {
          maxTokens: 300,
          temperature: 0.4
        }
      })
    });

    if (!response.ok) {
      throw new Error(`批量处理失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 批量处理成功:');
    console.log('   提供商:', data.data.provider);
    console.log('   处理数量:', data.data.totalProcessed);
    console.log('   分析结果:', data.data.analyses.map((analysis, index) => ({
      index: index + 1,
      summary: analysis.summary,
      importanceScore: analysis.importanceScore,
      sentiment: analysis.sentiment
    })));
    return data.data;
  } catch (error) {
    console.error('❌ 批量处理失败:', error.message);
    return null;
  }
}

/**
 * 测试提供商切换
 */
async function testSwitchProvider() {
  try {
    console.log('\n🔄 测试提供商切换...');
    const response = await fetch(`${API_BASE_URL}/api/ai/switch-provider`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: '测试切换功能'
      })
    });

    if (!response.ok) {
      throw new Error(`提供商切换失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 提供商切换成功:');
    console.log('   当前提供商:', data.data.currentProvider);
    console.log('   健康状态:', data.data.isHealthy);
    return data.data;
  } catch (error) {
    console.error('❌ 提供商切换失败:', error.message);
    return null;
  }
}

/**
 * 获取性能指标
 */
async function getPerformanceMetrics() {
  try {
    console.log('\n📈 获取性能指标...');
    const response = await fetch(`${API_BASE_URL}/api/ai/performance-metrics`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`获取性能指标失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 性能指标:', JSON.stringify(data.data, null, 2));
    return data.data;
  } catch (error) {
    console.error('❌ 获取性能指标失败:', error.message);
    return null;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始AI服务集成测试...\n');

  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ 测试终止：登录失败');
    return;
  }

  // 获取AI服务状态
  await getAIStatus();

  // 测试文本生成
  await testGenerateText();

  // 测试摘要生成
  await testGenerateSummary();

  // 测试内容分析
  await testAnalyzeContent();

  // 测试批量处理
  await testBatchProcess();

  // 测试提供商切换
  await testSwitchProvider();

  // 获取性能指标
  await getPerformanceMetrics();

  console.log('\n🎉 AI服务集成测试完成！');
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
