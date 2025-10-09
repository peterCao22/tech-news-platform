/**
 * Story 2.4: 智能内容去重与相似度检测 - 集成测试
 */

require('dotenv').config({ path: '../../.env' });
const fetch = require('node-fetch');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TEST_CONFIG = {
  email: 'admin@mkbl.com',
  password: 'Wm@123456'
};

let authToken = '';
let testContentIds = [];

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return { status: response.status, ok: response.ok, data };
}

async function testLogin() {
  console.log('\n📝 测试1: 用户登录');
  console.log('='.repeat(60));

  try {
    const response = await apiRequest('/api/auth/login', 'POST', {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    });

    if (response.ok && response.data.data?.token) {
      authToken = response.data.data.token;
      console.log('✅ 登录成功');
      return true;
    } else {
      console.log('❌ 登录失败');
      return false;
    }
  } catch (error) {
    console.log('❌ 登录异常:', error.message);
    return false;
  }
}

async function getTestContent() {
  console.log('\n📝 测试2: 获取测试内容');
  console.log('='.repeat(60));

  try {
    const response = await apiRequest('/api/content?limit=5');

    if (response.ok && response.data.data?.length > 0) {
      testContentIds = response.data.data.slice(0, 3).map(c => c.id);
      console.log('✅ 获取测试内容成功');
      console.log(`   找到${testContentIds.length}条内容`);
      return true;
    } else {
      console.log('❌ 没有可用的测试内容');
      return false;
    }
  } catch (error) {
    console.log('❌ 获取内容异常:', error.message);
    return false;
  }
}

async function testDetectDuplicates() {
  console.log('\n📝 测试3: 检测重复内容');
  console.log('='.repeat(60));

  try {
    console.log(`   正在检测内容: ${testContentIds[0].substring(0, 12)}...`);

    const startTime = Date.now();
    const response = await apiRequest('/api/deduplication/detect', 'POST', {
      contentId: testContentIds[0]
    });
    const duration = Date.now() - startTime;

    if (response.ok && response.data.success) {
      const result = response.data.data;
      console.log('✅ 检测完成');
      console.log(`   响应时间: ${duration}ms`);
      console.log(`   发现重复: ${result.duplicatesFound}条`);
      
      if (result.duplicates && result.duplicates.length > 0) {
        console.log('\n   相似内容:');
        result.duplicates.slice(0, 3).forEach((dup, idx) => {
          console.log(`   ${idx + 1}. 相似度: ${dup.overallSimilarity.toFixed(1)}%`);
          console.log(`      标题相似度: ${dup.titleSimilarity.toFixed(1)}%`);
          console.log(`      内容相似度: ${dup.contentSimilarity.toFixed(1)}%`);
        });
      }
      return true;
    } else {
      console.log('❌ 检测失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 检测异常:', error.message);
    return false;
  }
}

async function testSimilarityCalculation() {
  console.log('\n📝 测试4: 计算相似度');
  console.log('='.repeat(60));

  if (testContentIds.length < 2) {
    console.log('⚠️  跳过（需要至少2条内容）');
    return true;
  }

  try {
    const response = await apiRequest('/api/deduplication/similarity', 'POST', {
      contentId1: testContentIds[0],
      contentId2: testContentIds[1]
    });

    if (response.ok && response.data.success) {
      const sim = response.data.data;
      console.log('✅ 相似度计算完成');
      console.log(`   总体相似度: ${sim.overallSimilarity.toFixed(1)}%`);
      console.log(`   标题相似度: ${sim.titleSimilarity.toFixed(1)}%`);
      console.log(`   内容相似度: ${sim.contentSimilarity.toFixed(1)}%`);
      console.log(`   检测方法: ${sim.detectionMethod}`);
      console.log(`   判定为重复: ${sim.isDuplicate ? '是' : '否'}`);
      return true;
    } else {
      console.log('❌ 计算失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 计算异常:', error.message);
    return false;
  }
}

async function testGetReport() {
  console.log('\n📝 测试5: 获取去重报告');
  console.log('='.repeat(60));

  try {
    const response = await apiRequest('/api/deduplication/report');

    if (response.ok && response.data.success) {
      const report = response.data.data;
      console.log('✅ 获取报告成功');
      console.log(`\n   📊 去重统计:`);
      console.log(`   - 总内容数: ${report.totalContent}`);
      console.log(`   - 重复记录数: ${report.totalDuplicates}`);
      console.log(`   - 待审核: ${report.pendingReview}`);
      console.log(`   - 已确认: ${report.confirmed}`);
      console.log(`   - 已合并: ${report.merged}`);
      console.log(`   - 误报: ${report.falsePositives}`);
      return true;
    } else {
      console.log('❌ 获取报告失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 获取报告异常:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Story 2.4: 智能内容去重与相似度检测 - 集成测试');
  console.log('='.repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}`);

  const results = { total: 0, passed: 0, failed: 0 };

  const tests = [
    { name: '登录', fn: testLogin },
    { name: '获取测试内容', fn: getTestContent },
    { name: '检测重复内容', fn: testDetectDuplicates },
    { name: '计算相似度', fn: testSimilarityCalculation },
    { name: '获取去重报告', fn: testGetReport }
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
      if (['登录', '获取测试内容'].includes(test.name)) {
        console.log(`\n⛔ 关键测试失败，停止后续测试`);
        break;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${results.total}`);
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`通过率: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 所有测试通过！Story 2.4 功能验证成功！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查上述错误信息');
  }

  console.log('\n💡 提示:');
  console.log('   - 确保 API 服务正在运行');
  console.log('   - 确保 AI 服务(Claude/Gemini)已配置');
  console.log('   - 相似度检测需要AI调用，耗时较长');
}

runTests().catch(error => {
  console.error('\n💥 测试执行失败:', error);
  process.exit(1);
});

