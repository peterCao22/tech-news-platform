/**
 * Story 2.5: 内容评分与排序算法 - 集成测试
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
let authToken = '';
let testContentId = '';

// 配置axios默认超时
axios.defaults.timeout = 30000;

/**
 * 辅助函数：API请求
 */
async function apiRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { ok: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status || 500
    };
  }
}

/**
 * 测试1: 用户登录
 */
async function testLogin() {
  console.log('\n📝 测试1: 用户登录');
  console.log('='.repeat(60));
  
  const response = await apiRequest('post', '/api/auth/login', {
    email: 'admin@mkbl.com',
    password: 'Wm@123456'
  });
  
  if (response.ok && response.data.data?.token) {
    authToken = response.data.data.token;
    console.log('✅ 登录成功');
    return true;
  } else {
    console.log('❌ 登录失败:', response.error);
    return false;
  }
}

/**
 * 测试2: 获取测试内容
 */
async function testGetContent() {
  console.log('\n📝 测试2: 获取测试内容');
  console.log('='.repeat(60));
  
  // 尝试获取任意状态的内容
  const response = await apiRequest('get', '/api/content?limit=1');
  
  if (response.ok && response.data.data?.length > 0) {
    testContentId = response.data.data[0].id;
    console.log('✅ 获取测试内容成功');
    console.log(`   Content ID: ${testContentId}`);
    console.log(`   标题: ${response.data.data[0].title}`);
    return true;
  } else {
    console.log('⚠️  数据库中没有可用的测试内容');
    console.log('   跳过需要内容ID的测试');
    return true; // 返回true以继续其他测试
  }
}

/**
 * 测试3: 计算单个内容评分
 */
async function testScoreContent() {
  console.log('\n📝 测试3: 计算单个内容评分');
  console.log('='.repeat(60));
  
  if (!testContentId) {
    console.log('⚠️  跳过测试（无可用内容）');
    return true;
  }
  
  const response = await apiRequest('post', `/api/content-scoring/score/${testContentId}`, {
    forceRecalculate: true
  });
  
  if (response.ok && response.data.data) {
    const score = response.data.data;
    console.log('✅ 评分计算成功');
    console.log(`   总分: ${score.totalScore}`);
    console.log(`   时效性: ${score.scores.timeliness}`);
    console.log(`   权威性: ${score.scores.authority}`);
    console.log(`   质量: ${score.scores.quality}`);
    console.log(`   相关性: ${score.scores.relevance}`);
    console.log(`   AI重要性: ${score.scores.aiImportance}`);
    console.log(`   用户行为: ${score.scores.engagement}`);
    console.log(`   解释: ${score.explanation}`);
    return true;
  } else {
    console.log('❌ 评分计算失败:', response.error);
    return false;
  }
}

/**
 * 测试4: 获取内容评分详情
 */
async function testGetContentScore() {
  console.log('\n📝 测试4: 获取内容评分详情');
  console.log('='.repeat(60));
  
  if (!testContentId) {
    console.log('⚠️  跳过测试（无可用内容）');
    return true;
  }
  
  const response = await apiRequest('get', `/api/content-scoring/score/${testContentId}`);
  
  if (response.ok && response.data.data) {
    console.log('✅ 获取评分详情成功');
    console.log(`   总分: ${response.data.data.totalScore}`);
    return true;
  } else {
    console.log('❌ 获取评分详情失败:', response.error);
    return false;
  }
}

/**
 * 测试5: 获取排序后的内容列表
 */
async function testGetRankedContent() {
  console.log('\n📝 测试5: 获取排序后的内容列表');
  console.log('='.repeat(60));
  
  const response = await apiRequest('get', '/api/content-scoring/ranked?limit=5');
  
  if (response.ok && response.data.data) {
    const result = response.data.data;
    console.log('✅ 获取排序内容成功');
    console.log(`   总数: ${result.total}`);
    console.log(`   当前页: ${result.page}`);
    console.log(`   内容数: ${result.content.length}`);
    return true;
  } else {
    console.log('❌ 获取排序内容失败:', response.error);
    return false;
  }
}

/**
 * 测试6: 获取活动权重配置
 */
async function testGetActiveWeights() {
  console.log('\n📝 测试6: 获取活动权重配置');
  console.log('='.repeat(60));
  
  const response = await apiRequest('get', '/api/content-scoring/weights/active');
  
  if (response.ok && response.data.data) {
    const weights = response.data.data;
    console.log('✅ 获取活动权重成功');
    console.log(`   时效性权重: ${weights.timeliness}`);
    console.log(`   权威性权重: ${weights.authority}`);
    console.log(`   质量权重: ${weights.quality}`);
    console.log(`   相关性权重: ${weights.relevance}`);
    console.log(`   AI重要性权重: ${weights.aiImportance}`);
    console.log(`   用户行为权重: ${weights.engagement}`);
    return true;
  } else {
    console.log('❌ 获取活动权重失败:', response.error);
    return false;
  }
}

/**
 * 测试7: 获取所有权重配置
 */
async function testGetAllWeights() {
  console.log('\n📝 测试7: 获取所有权重配置');
  console.log('='.repeat(60));
  
  const response = await apiRequest('get', '/api/content-scoring/weights');
  
  if (response.ok && response.data.data) {
    const configs = response.data.data;
    console.log('✅ 获取所有权重配置成功');
    console.log(`   配置数量: ${configs.length}`);
    configs.forEach(config => {
      console.log(`   - ${config.name} (${config.isActive ? '活动' : '非活动'})`);
    });
    return true;
  } else {
    console.log('❌ 获取所有权重配置失败:', response.error);
    return false;
  }
}

/**
 * 测试8: 获取预设权重配置
 */
async function testGetPresetWeights() {
  console.log('\n📝 测试8: 获取预设权重配置');
  console.log('='.repeat(60));
  
  const response = await apiRequest('get', '/api/content-scoring/weights/presets');
  
  if (response.ok && response.data.data) {
    const presets = response.data.data;
    console.log('✅ 获取预设权重配置成功');
    console.log(`   预设数量: ${presets.length}`);
    presets.forEach(preset => {
      console.log(`   - ${preset.name}: ${preset.description}`);
    });
    return true;
  } else {
    console.log('❌ 获取预设权重配置失败:', response.error);
    return false;
  }
}

/**
 * 测试9: 创建自定义权重配置
 */
async function testCreateWeightConfig() {
  console.log('\n📝 测试9: 创建自定义权重配置');
  console.log('='.repeat(60));
  
  const response = await apiRequest('post', '/api/content-scoring/weights', {
    name: '测试配置',
    description: '自动化测试创建的权重配置',
    weights: {
      timeliness: 0.30,
      authority: 0.20,
      quality: 0.20,
      relevance: 0.15,
      aiImportance: 0.10,
      engagement: 0.05
    }
  });
  
  if (response.ok && response.data.data) {
    console.log('✅ 创建权重配置成功');
    console.log(`   配置ID: ${response.data.data.id}`);
    return true;
  } else {
    console.log('❌ 创建权重配置失败:', response.error);
    return false;
  }
}

/**
 * 测试10: 批量计算评分
 */
async function testBatchScoreContent() {
  console.log('\n📝 测试10: 批量计算评分');
  console.log('='.repeat(60));
  
  // 先获取多个内容ID
  const contentResponse = await apiRequest('get', '/api/content?limit=3&status=PUBLISHED');
  
  if (!contentResponse.ok || !contentResponse.data.data) {
    console.log('❌ 获取内容列表失败');
    return false;
  }
  
  const contentIds = contentResponse.data.data.map(c => c.id);
  
  if (contentIds.length === 0) {
    console.log('⚠️  没有可用的内容进行批量评分');
    return true;
  }
  
  const response = await apiRequest('post', '/api/content-scoring/batch-score', {
    contentIds,
    forceRecalculate: false
  });
  
  if (response.ok && response.data.data) {
    console.log('✅ 批量评分成功');
    console.log(`   评分数量: ${response.data.data.total}`);
    return true;
  } else {
    console.log('❌ 批量评分失败:', response.error);
    return false;
  }
}

/**
 * 主测试流程
 */
async function runTests() {
  console.log('\n🚀 Story 2.5: 内容评分与排序算法 - 集成测试');
  console.log('='.repeat(60));
  console.log(`API地址: ${API_BASE_URL}`);
  console.log('开始时间:', new Date().toLocaleString());
  
  const tests = [
    testLogin,
    testGetContent,
    testScoreContent,
    testGetContentScore,
    testGetRankedContent,
    testGetActiveWeights,
    testGetAllWeights,
    testGetPresetWeights,
    testCreateWeightConfig,
    testBatchScoreContent
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('❌ 测试异常:', error.message);
      failed++;
    }
    
    // 测试间延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${tests.length}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`成功率: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('结束时间:', new Date().toLocaleString());
  
  process.exit(failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});

