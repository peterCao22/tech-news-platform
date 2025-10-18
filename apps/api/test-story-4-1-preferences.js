/**
 * Story 4.1: User Preferences - Integration Tests
 * 用户个性化偏好管理 - 集成测试
 * 
 * 测试范围：
 * - 基础偏好管理 (2个端点)
 * - 兴趣管理 (5个端点)
 * - 关注列表管理 (4个端点)
 * - 信息源权重管理 (2个端点)
 * - 偏好导入导出 (2个端点)
 * - 偏好模板管理 (2个端点)
 * - 个性化内容 (2个端点)
 * 
 * 总计: 19个API端点
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 测试上下文
const testContext = {
  token: null,
  userId: null,
  interestIds: [],
  followingIds: [],
  sourceIds: []
};

/**
 * 打印测试结果
 */
function logTest(testName, success, details = '') {
  totalTests++;
  if (success) {
    passedTests++;
    console.log(`✅ ${testName}`);
  } else {
    failedTests++;
    console.log(`❌ ${testName}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
}

/**
 * 测试: 用户登录
 */
async function testLogin() {
  console.log('\n📝 Test 1: 用户登录');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@mkbl.com',
      password: 'Wm@123456'
    });

    testContext.token = response.data.token || response.data.data?.token;
    testContext.userId = response.data.user?.id || response.data.data?.user?.id;

    logTest('用户登录成功', true, `Token获取成功, UserId: ${testContext.userId}`);
  } catch (error) {
    logTest('用户登录失败', false, error.response?.data?.message || error.message);
    process.exit(1);
  }
}

/**
 * 测试: 获取用户偏好 (首次)
 */
async function testGetPreferences() {
  console.log('\n📝 Test 2: 获取用户偏好 (首次，应自动创建)');
  try {
    const response = await axios.get(`${API_BASE_URL}/preferences`, {
      headers: { Authorization: `Bearer ${testContext.token}` }
    });

    const preference = response.data.data;
    
    logTest(
      '获取用户偏好成功',
      preference !== null,
      `偏好ID: ${preference.id}, 语言: ${preference.preferredLanguage}`
    );
  } catch (error) {
    logTest('获取用户偏好失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 更新用户偏好
 */
async function testUpdatePreferences() {
  console.log('\n📝 Test 3: 更新用户偏好');
  try {
    const response = await axios.put(
      `${API_BASE_URL}/preferences`,
      {
        contentTypes: ['news', 'analysis', 'technical'],
        preferredLanguage: 'zh-CN',
        timezone: 'Asia/Shanghai',
        itemsPerPage: 30,
        defaultSortBy: 'score',
        emailNotifications: true,
        notificationFrequency: 'daily'
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    const preference = response.data.data;
    
    logTest(
      '更新用户偏好成功',
      preference.itemsPerPage === 30,
      `新设置 - 每页: ${preference.itemsPerPage} 条`
    );
  } catch (error) {
    logTest('更新用户偏好失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 添加兴趣领域
 */
async function testAddInterests() {
  console.log('\n📝 Test 4: 添加兴趣领域');
  try {
    // 添加单个兴趣
    const response1 = await axios.post(
      `${API_BASE_URL}/preferences/interests`,
      {
        category: 'technology_field',
        name: 'AI',
        weight: 1.5
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    testContext.interestIds.push(response1.data.data.id);

    // 添加另一个兴趣
    const response2 = await axios.post(
      `${API_BASE_URL}/preferences/interests`,
      {
        category: 'technology_field',
        name: 'Blockchain',
        weight: 1.2
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    testContext.interestIds.push(response2.data.data.id);

    logTest(
      '添加兴趣成功',
      testContext.interestIds.length === 2,
      `已添加 ${testContext.interestIds.length} 个兴趣: AI (1.5x), Blockchain (1.2x)`
    );
  } catch (error) {
    logTest('添加兴趣失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 批量添加兴趣
 */
async function testBatchAddInterests() {
  console.log('\n📝 Test 5: 批量添加兴趣');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/preferences/interests/batch`,
      {
        interests: [
          { category: 'technology_field', name: 'Quantum Computing', weight: 1.0 },
          { category: 'topic', name: 'Machine Learning', weight: 1.3 },
          { category: 'topic', name: 'Cloud Computing', weight: 1.2 }
        ]
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    const results = response.data.data;
    
    logTest(
      '批量添加兴趣成功',
      results.success === 3 && results.failed === 0,
      `成功: ${results.success}, 失败: ${results.failed}`
    );
  } catch (error) {
    logTest('批量添加兴趣失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 获取兴趣列表
 */
async function testGetInterests() {
  console.log('\n📝 Test 6: 获取兴趣列表');
  try {
    const response = await axios.get(`${API_BASE_URL}/preferences/interests`, {
      headers: { Authorization: `Bearer ${testContext.token}` }
    });

    const interests = response.data.data;
    
    logTest(
      '获取兴趣列表成功',
      Array.isArray(interests) && interests.length >= 5,
      `共 ${interests.length} 个兴趣领域`
    );
  } catch (error) {
    logTest('获取兴趣列表失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 更新兴趣权重
 */
async function testUpdateInterest() {
  console.log('\n📝 Test 7: 更新兴趣权重');
  try {
    if (testContext.interestIds.length === 0) {
      logTest('更新兴趣权重跳过', false, '没有可更新的兴趣ID');
      return;
    }

    const interestId = testContext.interestIds[0];
    const response = await axios.put(
      `${API_BASE_URL}/preferences/interests/${interestId}`,
      {
        weight: 1.8,
        isActive: true
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    const interest = response.data.data;
    
    logTest(
      '更新兴趣权重成功',
      interest.weight === 1.8,
      `新权重: ${interest.weight}x`
    );
  } catch (error) {
    logTest('更新兴趣权重失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 添加关注
 */
async function testAddFollowings() {
  console.log('\n📝 Test 8: 添加关注');
  try {
    // 添加公司关注
    const response1 = await axios.post(
      `${API_BASE_URL}/preferences/followings`,
      {
        followType: 'COMPANY',
        name: 'NVIDIA',
        identifier: 'NVDA',
        weight: 2.0,
        notifyOnNews: true,
        notifyOnPrice: false
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    testContext.followingIds.push(response1.data.data.id);

    // 添加股票关注
    const response2 = await axios.post(
      `${API_BASE_URL}/preferences/followings`,
      {
        followType: 'STOCK',
        name: 'Microsoft',
        identifier: 'MSFT',
        weight: 1.8,
        notifyOnNews: true,
        notifyOnPrice: true
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    testContext.followingIds.push(response2.data.data.id);

    logTest(
      '添加关注成功',
      testContext.followingIds.length === 2,
      `已添加 ${testContext.followingIds.length} 个关注: NVIDIA (2.0x), Microsoft (1.8x)`
    );
  } catch (error) {
    logTest('添加关注失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 获取关注列表
 */
async function testGetFollowings() {
  console.log('\n📝 Test 9: 获取关注列表');
  try {
    const response = await axios.get(`${API_BASE_URL}/preferences/followings`, {
      headers: { Authorization: `Bearer ${testContext.token}` }
    });

    const followings = response.data.data;
    
    logTest(
      '获取关注列表成功',
      Array.isArray(followings) && followings.length >= 2,
      `共 ${followings.length} 个关注项`
    );
  } catch (error) {
    logTest('获取关注列表失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 更新关注
 */
async function testUpdateFollowing() {
  console.log('\n📝 Test 10: 更新关注');
  try {
    if (testContext.followingIds.length === 0) {
      logTest('更新关注跳过', false, '没有可更新的关注ID');
      return;
    }

    const followingId = testContext.followingIds[0];
    const response = await axios.put(
      `${API_BASE_URL}/preferences/followings/${followingId}`,
      {
        weight: 2.5,
        notifyOnNews: true
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    const following = response.data.data;
    
    logTest(
      '更新关注成功',
      following.weight === 2.5,
      `新权重: ${following.weight}x`
    );
  } catch (error) {
    logTest('更新关注失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 获取信息源列表 (准备数据)
 */
async function testGetSources() {
  console.log('\n📝 Test 11: 获取信息源列表 (准备数据)');
  try {
    const response = await axios.get(`${API_BASE_URL}/sources?limit=5`, {
      headers: { Authorization: `Bearer ${testContext.token}` }
    });

    const sources = response.data.items || response.data.data || [];
    testContext.sourceIds = sources.map(s => s.id);
    
    logTest(
      '获取信息源列表成功',
      testContext.sourceIds.length > 0,
      `获取到 ${testContext.sourceIds.length} 个信息源`
    );
  } catch (error) {
    logTest('获取信息源列表失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 设置信息源权重
 */
async function testSetSourceWeight() {
  console.log('\n📝 Test 12: 设置信息源权重');
  try {
    if (testContext.sourceIds.length === 0) {
      logTest('设置信息源权重跳过', false, '没有可用的信息源ID');
      return;
    }

    const sourceId = testContext.sourceIds[0];
    const response = await axios.put(
      `${API_BASE_URL}/preferences/source-weights/${sourceId}`,
      {
        weight: 1.5,
        reason: '高质量的AI新闻来源'
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    const sourceWeight = response.data.data;
    
    logTest(
      '设置信息源权重成功',
      sourceWeight.weight === 1.5,
      `权重: ${sourceWeight.weight}x, 原因: ${sourceWeight.reason}`
    );
  } catch (error) {
    logTest('设置信息源权重失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 获取信息源权重列表
 */
async function testGetSourceWeights() {
  console.log('\n📝 Test 13: 获取信息源权重列表');
  try {
    const response = await axios.get(`${API_BASE_URL}/preferences/source-weights`, {
      headers: { Authorization: `Bearer ${testContext.token}` }
    });

    const sourceWeights = response.data.data;
    
    logTest(
      '获取信息源权重列表成功',
      Array.isArray(sourceWeights),
      `共 ${sourceWeights.length} 个信息源权重配置`
    );
  } catch (error) {
    logTest('获取信息源权重列表失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 导出偏好
 */
async function testExportPreferences() {
  console.log('\n📝 Test 14: 导出偏好');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/preferences/export`,
      {},
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    const exportData = response.data.data;
    
    logTest(
      '导出偏好成功',
      exportData.version && exportData.preferences,
      `版本: ${exportData.version}, 导出时间: ${exportData.exportedAt}`
    );
  } catch (error) {
    logTest('导出偏好失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 导入偏好
 */
async function testImportPreferences() {
  console.log('\n📝 Test 15: 导入偏好');
  try {
    const mockImportData = {
      version: '1.0',
      preferences: {
        basic: {
          contentTypes: ['news', 'analysis'],
          preferredLanguage: 'en-US'
        },
        interests: [
          { category: 'topic', name: 'Robotics', weight: 1.3 }
        ]
      }
    };

    const response = await axios.post(
      `${API_BASE_URL}/preferences/import`,
      {
        data: mockImportData,
        overwrite: false
      },
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    logTest(
      '导入偏好成功',
      response.data.success === true,
      response.data.message
    );
  } catch (error) {
    logTest('导入偏好失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 获取偏好模板列表
 */
async function testGetTemplates() {
  console.log('\n📝 Test 16: 获取偏好模板列表');
  try {
    const response = await axios.get(`${API_BASE_URL}/preferences/templates`, {
      headers: { Authorization: `Bearer ${testContext.token}` }
    });

    const templates = response.data.data;
    
    logTest(
      '获取偏好模板列表成功',
      Array.isArray(templates),
      `共 ${templates.length} 个偏好模板`
    );
  } catch (error) {
    logTest('获取偏好模板列表失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 获取个性化内容
 */
async function testGetPersonalizedContent() {
  console.log('\n📝 Test 17: 获取个性化内容');
  try {
    const response = await axios.get(
      `${API_BASE_URL}/preferences/content/personalized?page=1&limit=10`,
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    const result = response.data.data;
    const items = result.items || [];
    
    logTest(
      '获取个性化内容成功',
      Array.isArray(items),
      `获取到 ${items.length} 条个性化内容`
    );

    // 检查是否有个性化评分
    if (items.length > 0 && items[0].personalizedScore !== undefined) {
      console.log(`   示例内容评分: 基础 ${items[0].baseScore} → 个性化 ${items[0].personalizedScore.toFixed(1)}`);
    }
  } catch (error) {
    logTest('获取个性化内容失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 获取个性化TOP10
 */
async function testGetPersonalizedTop10() {
  console.log('\n📝 Test 18: 获取个性化TOP10');
  try {
    const response = await axios.get(
      `${API_BASE_URL}/preferences/daily-top10/personalized`,
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    const result = response.data.data;
    const items = result.items || [];
    
    logTest(
      '获取个性化TOP10成功',
      Array.isArray(items),
      `生成日期: ${result.date}, 共 ${items.length} 条`
    );

    // 显示前3条
    if (items.length > 0) {
      console.log(`   TOP 1: ${items[0].content.title.substring(0, 50)}...`);
      console.log(`          评分: ${items[0].personalizedScore.toFixed(1)} (${items[0].personalizedReason})`);
    }
  } catch (error) {
    logTest('获取个性化TOP10失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 测试: 删除兴趣 (清理)
 */
async function testDeleteInterest() {
  console.log('\n📝 Test 19: 删除兴趣 (清理)');
  try {
    if (testContext.interestIds.length === 0) {
      logTest('删除兴趣跳过', true, '没有可删除的兴趣ID');
      return;
    }

    const interestId = testContext.interestIds[0];
    await axios.delete(
      `${API_BASE_URL}/preferences/interests/${interestId}`,
      {
        headers: { Authorization: `Bearer ${testContext.token}` }
      }
    );

    logTest('删除兴趣成功', true, `已删除兴趣ID: ${interestId}`);
  } catch (error) {
    logTest('删除兴趣失败', false, error.response?.data?.message || error.message);
  }
}

/**
 * 主测试流程
 */
async function runTests() {
  console.log('🚀 Story 4.1: User Preferences - API Integration Tests');
  console.log('='.repeat(60));

  try {
    await testLogin();
    await testGetPreferences();
    await testUpdatePreferences();
    await testAddInterests();
    await testBatchAddInterests();
    await testGetInterests();
    await testUpdateInterest();
    await testAddFollowings();
    await testGetFollowings();
    await testUpdateFollowing();
    await testGetSources();
    await testSetSourceWeight();
    await testGetSourceWeights();
    await testExportPreferences();
    await testImportPreferences();
    await testGetTemplates();
    await testGetPersonalizedContent();
    await testGetPersonalizedTop10();
    await testDeleteInterest();

    // 测试总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));
    console.log(`总测试数: ${totalTests}`);
    console.log(`✅ 通过: ${passedTests}`);
    console.log(`❌ 失败: ${failedTests}`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests === 0) {
      console.log('\n🎉 所有测试通过！');
    } else {
      console.log('\n⚠️  部分测试失败，请检查日志');
    }
  } catch (error) {
    console.error('\n💥 测试执行出错:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();

