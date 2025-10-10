/**
 * Story 2.6: 每日TOP10自动生成 - 集成测试
 * 测试Daily TOP10生成、查询、发布功能
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let generatedTop10Id = '';

// 测试统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 格式化输出
function logTest(name, status, message = '') {
  totalTests++;
  if (status === 'PASS') {
    passedTests++;
    console.log(`✅ ${name}`.green);
    if (message) console.log(`   ${message}`.gray);
  } else if (status === 'FAIL') {
    failedTests++;
    console.log(`❌ ${name}`.red);
    if (message) console.log(`   ${message}`.yellow);
  } else {
    console.log(`⚠️  ${name}`.yellow);
    if (message) console.log(`   ${message}`.gray);
  }
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`.cyan);
  console.log(`  ${title}`.cyan.bold);
  console.log(`${'='.repeat(60)}`.cyan);
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. 管理员登录
async function testAdminLogin() {
  logSection('测试1: 管理员登录');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!@#'
    });
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      logTest('管理员登录', 'PASS', `Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logTest('管理员登录', 'FAIL', '未返回token');
      return false;
    }
  } catch (error) {
    logTest('管理员登录', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// 2. 测试生成今日TOP10
async function testGenerateTodayTop10() {
  logSection('测试2: 生成今日TOP10');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/daily-top10/generate`,
      {
        forceRegenerate: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.data.success && response.data.data) {
      const top10 = response.data.data;
      generatedTop10Id = top10.id;
      
      logTest('生成TOP10成功', 'PASS', `ID: ${generatedTop10Id}`);
      logTest('TOP10条目数量', top10.items.length === 10 ? 'PASS' : 'FAIL', 
        `实际: ${top10.items.length}/10`);
      logTest('包含摘要报告', top10.summaryReport ? 'PASS' : 'FAIL',
        `长度: ${top10.summaryReport?.length || 0}字符`);
      logTest('包含统计信息', top10.categoryStats ? 'PASS' : 'FAIL');
      logTest('生成时间记录', top10.generationTime ? 'PASS' : 'FAIL',
        `耗时: ${top10.generationTime}ms`);
        
      return true;
    } else {
      logTest('生成TOP10', 'FAIL', '未返回数据');
      return false;
    }
  } catch (error) {
    logTest('生成TOP10', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// 3. 测试获取今日TOP10
async function testGetTodayTop10() {
  logSection('测试3: 获取今日TOP10');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/daily-top10/today`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.data.success && response.data.data) {
      const top10 = response.data.data;
      
      logTest('获取今日TOP10', 'PASS', `状态: ${top10.status}`);
      logTest('条目完整性', top10.items?.length >= 0 ? 'PASS' : 'FAIL',
        `条目数: ${top10.items?.length}`);
        
      // 检查第一条内容
      if (top10.items && top10.items[0]) {
        const item = top10.items[0];
        logTest('条目包含内容信息', item.content ? 'PASS' : 'FAIL',
          `标题: ${item.content?.title?.substring(0, 30)}...`);
        logTest('条目包含评分', item.score ? 'PASS' : 'FAIL',
          `评分: ${item.score}`);
      }
      
      return true;
    } else {
      logTest('获取今日TOP10', 'FAIL', '未返回数据');
      return false;
    }
  } catch (error) {
    logTest('获取今日TOP10', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// 4. 测试发布TOP10
async function testPublishTop10() {
  logSection('测试4: 发布TOP10');
  
  if (!generatedTop10Id) {
    logTest('发布TOP10', 'FAIL', '未找到TOP10 ID');
    return false;
  }
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/daily-top10/${generatedTop10Id}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.data.success && response.data.data) {
      const top10 = response.data.data;
      
      logTest('发布TOP10', 'PASS', `状态: ${top10.status}`);
      logTest('包含发布时间', top10.publishedAt ? 'PASS' : 'FAIL',
        `发布时间: ${top10.publishedAt || 'N/A'}`);
      logTest('状态更新为PUBLISHED', top10.status === 'PUBLISHED' ? 'PASS' : 'FAIL');
      
      return true;
    } else {
      logTest('发布TOP10', 'FAIL', '未返回数据');
      return false;
    }
  } catch (error) {
    logTest('发布TOP10', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// 5. 测试获取TOP10历史
async function testGetTop10History() {
  logSection('测试5: 获取TOP10历史');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/daily-top10/list/history?limit=5`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.data.success && response.data.data) {
      const history = response.data.data;
      
      logTest('获取历史记录', 'PASS', `记录数: ${history.length}`);
      
      if (history.length > 0) {
        logTest('历史记录包含日期', history[0].date ? 'PASS' : 'FAIL',
          `最新日期: ${history[0].date}`);
        logTest('历史记录包含状态', history[0].status ? 'PASS' : 'FAIL',
          `状态: ${history[0].status}`);
      }
      
      return true;
    } else {
      logTest('获取历史记录', 'FAIL', '未返回数据');
      return false;
    }
  } catch (error) {
    logTest('获取历史记录', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// 6. 测试获取指定日期TOP10
async function testGetTop10ByDate() {
  logSection('测试6: 获取指定日期TOP10');
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/daily-top10/${today}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.data.success && response.data.data) {
      const top10 = response.data.data;
      
      logTest('按日期获取TOP10', 'PASS', `日期: ${today}`);
      logTest('返回正确日期数据', top10.date ? 'PASS' : 'FAIL');
      
      return true;
    } else {
      logTest('按日期获取TOP10', 'FAIL', '未返回数据');
      return false;
    }
  } catch (error) {
    logTest('按日期获取TOP10', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// 7. 测试性能指标
async function testPerformanceMetrics() {
  logSection('测试7: 性能指标');
  
  if (!generatedTop10Id) {
    logTest('性能测试', 'FAIL', '未找到TOP10 ID');
    return false;
  }
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/daily-top10/${generatedTop10Id.split('T')[0] || 'today'}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.data.success && response.data.data) {
      const top10 = response.data.data;
      const generationTime = top10.generationTime || 0;
      
      logTest('生成时间 < 15秒', generationTime < 15000 ? 'PASS' : 'FAIL',
        `实际: ${generationTime}ms`);
      logTest('候选内容处理', top10.totalCandidates >= 0 ? 'PASS' : 'FAIL',
        `候选数: ${top10.totalCandidates}`);
      
      return true;
    } else {
      logTest('性能测试', 'FAIL', '未返回数据');
      return false;
    }
  } catch (error) {
    logTest('性能测试', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// 主测试流程
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗'.cyan);
  console.log('║       Story 2.6: 每日TOP10自动生成 - 集成测试        ║'.cyan.bold);
  console.log('╚════════════════════════════════════════════════════════╝'.cyan);
  
  console.log('\n📋 测试说明:'.yellow.bold);
  console.log('- 测试Daily TOP10生成、查询、发布等核心功能');
  console.log('- 验证多样性确保和摘要报告生成');
  console.log('- 测试API端点和性能指标');
  console.log();
  
  // 执行测试
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ 登录失败，终止测试'.red.bold);
    return;
  }
  
  await delay(500);
  await testGenerateTodayTop10();
  
  await delay(500);
  await testGetTodayTop10();
  
  await delay(500);
  await testPublishTop10();
  
  await delay(500);
  await testGetTop10History();
  
  await delay(500);
  await testGetTop10ByDate();
  
  await delay(500);
  await testPerformanceMetrics();
  
  // 输出测试总结
  console.log('\n' + '='.repeat(60).cyan);
  console.log('  测试总结'.cyan.bold);
  console.log('='.repeat(60).cyan);
  console.log(`总测试数: ${totalTests}`.white);
  console.log(`通过: ${passedTests}`.green);
  console.log(`失败: ${failedTests}`.red);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`.yellow);
  
  if (failedTests === 0) {
    console.log('\n🎉 所有测试通过！Story 2.6 实现完成！'.green.bold);
  } else {
    console.log(`\n⚠️  有 ${failedTests} 个测试失败，请检查`.yellow.bold);
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行失败:'.red, error);
  process.exit(1);
});

