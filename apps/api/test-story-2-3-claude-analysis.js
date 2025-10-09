/**
 * Story 2.3: Claude AI内容分析与摘要 - 集成测试
 * 
 * 测试内容：
 * 1. 单条内容分析
 * 2. 批量内容分析
 * 3. 分析状态查询
 * 4. 分析统计
 * 5. 摘要生成（快速接口）
 */

require('dotenv').config({ path: '../../.env' });
const fetch = require('node-fetch');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 测试配置
const TEST_CONFIG = {
  email: 'admin@mkbl.com',
  password: 'Wm@123456'
};

let authToken = '';
let testContentId = '';

/**
 * 工具函数：API 请求
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

/**
 * 测试1: 用户登录
 */
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
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ 登录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 登录异常:', error.message);
    return false;
  }
}

/**
 * 测试2: 获取测试内容ID
 */
async function getTestContentId() {
  console.log('\n📝 测试2: 获取测试内容');
  console.log('='.repeat(60));

  try {
    const response = await apiRequest('/api/content?limit=1');

    if (response.ok && response.data.data?.length > 0) {
      testContentId = response.data.data[0].id;
      console.log('✅ 获取测试内容成功');
      console.log(`   Content ID: ${testContentId}`);
      console.log(`   标题: ${response.data.data[0].title}`);
      return true;
    } else {
      console.log('❌ 没有可用的测试内容');
      console.log('   提示: 请先添加一些新闻内容到系统中');
      return false;
    }
  } catch (error) {
    console.log('❌ 获取内容异常:', error.message);
    return false;
  }
}

/**
 * 测试3: 单条内容分析
 */
async function testAnalyzeContent() {
  console.log('\n📝 测试3: 单条内容分析');
  console.log('='.repeat(60));

  try {
    console.log(`   正在分析内容: ${testContentId}`);
    console.log('   ⏳ 请稍候，AI分析需要一些时间...');

    const startTime = Date.now();
    const response = await apiRequest(
      `/api/claude-analysis/analyze/${testContentId}`,
      'POST'
    );
    const duration = Date.now() - startTime;

    if (response.ok && response.data.success) {
      const result = response.data.data;
      console.log('✅ 内容分析完成');
      console.log(`   响应时间: ${duration}ms`);
      console.log('\n   📊 分析结果:');
      console.log(`   - 摘要长度: ${result.summary?.length || 0} 字`);
      console.log(`   - 摘要: ${result.summary?.substring(0, 100) || 'N/A'}...`);
      console.log(`\n   - 关键信息:`);
      console.log(`     公司: ${result.keyInfo?.companies?.join(', ') || '无'}`);
      console.log(`     技术: ${result.keyInfo?.technologies?.join(', ') || '无'}`);
      console.log(`     股票代码: ${result.keyInfo?.stockCodes?.join(', ') || '无'}`);
      console.log(`     人物: ${result.keyInfo?.people?.join(', ') || '无'}`);
      console.log(`\n   - 重要性评分: ${result.importance?.score || 'N/A'}/10`);
      console.log(`     理由: ${result.importance?.reason || 'N/A'}`);
      console.log(`\n   - 情感分析: ${result.sentiment?.type || 'N/A'}`);
      console.log(`     置信度: ${result.sentiment?.confidence || 'N/A'}`);
      console.log(`     说明: ${result.sentiment?.explanation || 'N/A'}`);
      console.log(`\n   - 分类标签: ${result.categories?.join(', ') || '无'}`);
      console.log(`\n   - Token使用: ${result.tokensUsed || 0}`);
      console.log(`   - 成本: $${result.costUsd?.toFixed(6) || '0.000000'}`);
      return true;
    } else {
      console.log('❌ 内容分析失败');
      console.log(`   状态: ${response.status}`);
      console.log(`   错误: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 内容分析异常:', error.message);
    return false;
  }
}

/**
 * 测试4: 查询分析状态
 */
async function testAnalysisStatus() {
  console.log('\n📝 测试4: 查询分析状态');
  console.log('='.repeat(60));

  try {
    const response = await apiRequest(
      `/api/claude-analysis/status/${testContentId}`
    );

    if (response.ok && response.data.success) {
      const status = response.data.data;
      console.log('✅ 状态查询成功');
      console.log(`   Content ID: ${status.contentId}`);
      console.log(`   标题: ${status.title}`);
      console.log(`   已分析: ${status.hasAnalysis ? '是' : '否'}`);

      if (status.hasAnalysis) {
        console.log('\n   📊 分析信息:');
        console.log(`   - 摘要: ${status.analysis?.summary?.substring(0, 50) || 'N/A'}...`);
        console.log(`   - 重要性评分: ${status.analysis?.importance?.score || 'N/A'}/10`);
        console.log(`   - 情感: ${status.analysis?.sentiment?.type || 'N/A'}`);
        console.log(`   - 分类: ${status.analysis?.categories?.slice(0, 3).join(', ') || 'N/A'}`);
        console.log(`   - 分析时间: ${status.analysis?.analyzedAt || 'N/A'}`);
        console.log(`   - Token使用: ${status.analysis?.tokensUsed || 0}`);
        console.log(`   - 成本: $${status.analysis?.costUsd?.toFixed(6) || '0.000000'}`);
      }
      return true;
    } else {
      console.log('❌ 状态查询失败');
      console.log(`   错误: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 状态查询异常:', error.message);
    return false;
  }
}

/**
 * 测试5: 批量分析（小批量）
 */
async function testBatchAnalyze() {
  console.log('\n📝 测试5: 批量分析');
  console.log('='.repeat(60));

  try {
    // 获取3条未分析的内容
    const contentsResponse = await apiRequest('/api/content?limit=3');
    
    if (!contentsResponse.ok || !contentsResponse.data.data?.length) {
      console.log('⚠️  跳过批量分析测试（没有足够的内容）');
      return true;
    }

    const contentIds = contentsResponse.data.data.map(c => c.id).slice(0, 3);
    console.log(`   准备分析 ${contentIds.length} 条内容`);
    console.log('   ⏳ 请稍候，批量分析需要较长时间...');

    const startTime = Date.now();
    const response = await apiRequest(
      '/api/claude-analysis/batch',
      'POST',
      { contentIds }
    );
    const duration = Date.now() - startTime;

    if (response.ok && response.data.success) {
      const result = response.data.data;
      console.log('✅ 批量分析完成');
      console.log(`   总耗时: ${duration}ms (${(duration / 1000).toFixed(1)}秒)`);
      console.log(`\n   📊 分析汇总:`);
      console.log(`   - 总数: ${result.summary?.total || 0}`);
      console.log(`   - 成功: ${result.summary?.success || 0}`);
      console.log(`   - 失败: ${result.summary?.failed || 0}`);

      if (result.results && result.results.length > 0) {
        console.log('\n   详细结果:');
        result.results.forEach((r, idx) => {
          console.log(`   ${idx + 1}. ${r.success ? '✅' : '❌'} ${r.contentId.substring(0, 8)}... ${r.error || ''}`);
        });
      }
      return true;
    } else {
      console.log('❌ 批量分析失败');
      console.log(`   错误: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 批量分析异常:', error.message);
    return false;
  }
}

/**
 * 测试6: 获取分析统计
 */
async function testAnalysisStats() {
  console.log('\n📝 测试6: 分析统计');
  console.log('='.repeat(60));

  try {
    const response = await apiRequest('/api/claude-analysis/stats');

    if (response.ok && response.data.success) {
      const stats = response.data.data;
      console.log('✅ 统计查询成功');
      console.log(`\n   📊 统计数据:`);
      console.log(`   - 已分析内容总数: ${stats.totalAnalyzed || 0}`);
      console.log(`   - 平均重要性评分: ${stats.avgImportance?.toFixed(2) || 0}/10`);
      console.log(`\n   - 情感分布:`);
      console.log(`     正面: ${stats.sentimentDistribution?.positive || 0}`);
      console.log(`     中性: ${stats.sentimentDistribution?.neutral || 0}`);
      console.log(`     负面: ${stats.sentimentDistribution?.negative || 0}`);

      if (stats.topCategories && stats.topCategories.length > 0) {
        console.log(`\n   - 热门分类 (Top 5):`);
        stats.topCategories.slice(0, 5).forEach((cat, idx) => {
          console.log(`     ${idx + 1}. ${cat.category}: ${cat.count}次`);
        });
      }
      return true;
    } else {
      console.log('❌ 统计查询失败');
      console.log(`   错误: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 统计查询异常:', error.message);
    return false;
  }
}

/**
 * 测试7: 快速摘要生成
 */
async function testQuickSummary() {
  console.log('\n📝 测试7: 快速摘要生成');
  console.log('='.repeat(60));

  const testContent = `
人工智能技术在2024年取得了突破性进展。OpenAI发布的GPT-5模型在多个基准测试中超越了人类专家水平。
同时，谷歌、微软等科技巨头也在AI领域加大投资。业界普遍认为，AI将在未来几年深刻改变各个行业的工作方式。
股票市场对AI概念股反应热烈，NVIDIA股价今年已上涨超过200%。分析师预测，AI芯片市场规模将在2025年突破1000亿美元。
  `.trim();

  try {
    console.log('   测试内容长度:', testContent.length, '字');
    console.log('   ⏳ 正在生成摘要...');

    const startTime = Date.now();
    const response = await apiRequest(
      '/api/claude-analysis/summary',
      'POST',
      { content: testContent }
    );
    const duration = Date.now() - startTime;

    if (response.ok && response.data.success) {
      const summary = response.data.data.summary;
      console.log('✅ 摘要生成成功');
      console.log(`   响应时间: ${duration}ms`);
      console.log(`   摘要长度: ${summary.length} 字`);
      console.log(`   摘要内容: ${summary}`);
      return true;
    } else {
      console.log('❌ 摘要生成失败');
      console.log(`   错误: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 摘要生成异常:', error.message);
    return false;
  }
}

/**
 * 主测试流程
 */
async function runTests() {
  console.log('\n🧪 Story 2.3: Claude AI内容分析与摘要 - 集成测试');
  console.log('='.repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`测试账号: ${TEST_CONFIG.email}`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: '登录', fn: testLogin },
    { name: '获取测试内容', fn: getTestContentId },
    { name: '单条内容分析', fn: testAnalyzeContent },
    { name: '查询分析状态', fn: testAnalysisStatus },
    { name: '批量分析', fn: testBatchAnalyze },
    { name: '分析统计', fn: testAnalysisStats },
    { name: '快速摘要生成', fn: testQuickSummary }
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
      // 如果关键测试失败，停止后续测试
      if (['登录', '获取测试内容'].includes(test.name)) {
        console.log(`\n⛔ 关键测试失败，停止后续测试`);
        break;
      }
    }
  }

  // 输出测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${results.total}`);
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`通过率: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 所有测试通过！Story 2.3 功能验证成功！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查上述错误信息');
  }

  console.log('\n💡 提示:');
  console.log('   - 确保 API 服务正在运行 (pnpm dev)');
  console.log('   - 确保 CLAUDE_API_KEY 已配置在 .env 文件中');
  console.log('   - 确保数据库中有测试内容');
  console.log('   - Claude AI 调用需要时间，请耐心等待');
}

// 执行测试
runTests().catch(error => {
  console.error('\n💥 测试执行失败:', error);
  process.exit(1);
});

