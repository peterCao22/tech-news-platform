/**
 * Story 4.4: User Behavior Analytics - API 集成测试
 * 测试行为追踪、阅读历史和参与度统计API
 * 
 * 运行方式：node apps/api/test-story-4-4-behavior-api.js
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

// 测试配置
const config = {
  email: 'admin@mkbl.com',
  password: 'Wm@123456',
};

let authToken = '';
let userId = '';
let testContentIds = []; // 用于测试的内容ID

// ============================================
// 辅助函数
// ============================================

function log(title, data = null) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function success(message) {
  console.log(`✅ ${message}`);
}

function error(message, err) {
  console.log(`❌ ${message}`);
  if (err?.response?.data) {
    console.log('错误详情:', JSON.stringify(err.response.data, null, 2));
  } else if (err?.message) {
    console.log('错误信息:', err.message);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// 测试用例
// ============================================

/**
 * Test 1: 用户登录
 */
async function test1_login() {
  log('Test 1: 用户登录');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: config.email,
      password: config.password,
    });

    authToken = response.data.token || response.data.data?.token;
    userId = response.data.user?.id || response.data.data?.user?.id;

    if (!authToken || !userId) {
      throw new Error('登录响应格式不正确');
    }

    success(`登录成功: ${config.email}`);
    console.log(`User ID: ${userId}`);
    console.log(`Token: ${authToken.substring(0, 20)}...`);
  } catch (err) {
    error('登录失败', err);
    throw err;
  }
}

/**
 * Test 2: 获取测试内容ID
 */
async function test2_getTestContents() {
  log('Test 2: 获取测试内容');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/content`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 5 },
    });

    const contents = response.data.data || response.data.items || response.data;
    
    if (!Array.isArray(contents) || contents.length === 0) {
      throw new Error('没有找到测试内容');
    }

    testContentIds = contents.map((c) => c.id).slice(0, 3);
    
    success(`获取到 ${testContentIds.length} 个测试内容`);
    console.log('Content IDs:', testContentIds);
  } catch (err) {
    error('获取测试内容失败', err);
    throw err;
  }
}

/**
 * Test 3: 批量追踪用户行为
 */
async function test3_trackBehaviors() {
  log('Test 3: 批量追踪用户行为');
  
  try {
    const events = [
      {
        eventType: 'VIEW',
        contentId: testContentIds[0],
        deviceType: 'desktop',
        timestamp: new Date().toISOString(),
      },
      {
        eventType: 'CLICK',
        contentId: testContentIds[0],
        deviceType: 'desktop',
      },
      {
        eventType: 'READ',
        contentId: testContentIds[0],
        duration: 120,
        scrollDepth: 0.8,
        deviceType: 'desktop',
      },
      {
        eventType: 'VIEW',
        contentId: testContentIds[1],
        deviceType: 'mobile',
      },
      {
        eventType: 'READ',
        contentId: testContentIds[1],
        duration: 60,
        scrollDepth: 0.5,
        deviceType: 'mobile',
      },
    ];

    const response = await axios.post(
      `${API_BASE_URL}/behavior/track`,
      { events },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success(`批量追踪成功: ${response.data.data.tracked} 个事件`);
  } catch (err) {
    error('批量追踪失败', err);
    throw err;
  }
}

/**
 * Test 4: 更新阅读历史
 */
async function test4_updateReadingHistory() {
  log('Test 4: 更新阅读历史');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/behavior/${testContentIds[0]}/reading`,
      {
        duration: 180,
        scrollDepth: 0.9,
        isCompleted: true,
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success('更新阅读历史成功');
    console.log('阅读次数:', response.data.data.readCount);
    console.log('总时长:', response.data.data.totalDuration, '秒');
    console.log('最大滚动深度:', (response.data.data.maxScrollDepth * 100).toFixed(1), '%');
  } catch (err) {
    error('更新阅读历史失败', err);
    throw err;
  }
}

/**
 * Test 5: 收藏内容
 */
async function test5_bookmarkContent() {
  log('Test 5: 收藏内容');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/behavior/${testContentIds[0]}/bookmark`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success('收藏成功');
    console.log('已收藏:', response.data.data.isBookmarked);
  } catch (err) {
    error('收藏失败', err);
    throw err;
  }
}

/**
 * Test 6: 点赞内容
 */
async function test6_likeContent() {
  log('Test 6: 点赞内容');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/behavior/${testContentIds[1]}/like`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success('点赞成功');
    console.log('已点赞:', response.data.data.isLiked);
  } catch (err) {
    error('点赞失败', err);
    throw err;
  }
}

/**
 * Test 7: 分享内容
 */
async function test7_shareContent() {
  log('Test 7: 分享内容');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/behavior/${testContentIds[2]}/share`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success('分享成功');
    console.log('已分享:', response.data.data.isShared);
  } catch (err) {
    error('分享失败', err);
    throw err;
  }
}

/**
 * Test 8: 获取行为历史
 */
async function test8_getBehaviorHistory() {
  log('Test 8: 获取行为历史');
  
  try {
    // 等待一下，确保数据写入完成
    await sleep(1000);

    const response = await axios.get(
      `${API_BASE_URL}/behavior/history`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { page: 1, limit: 10 },
      }
    );

    success(`查询到 ${response.data.data.length} 条行为记录`);
    console.log('总记录数:', response.data.pagination.total);
    
    if (response.data.data.length > 0) {
      console.log('\n最新的3条记录:');
      response.data.data.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.eventType} - ${item.content?.title || 'N/A'}`);
        if (item.duration) {
          console.log(`     时长: ${item.duration}秒`);
        }
      });
    }
  } catch (err) {
    error('获取行为历史失败', err);
    throw err;
  }
}

/**
 * Test 9: 筛选行为历史（按事件类型）
 */
async function test9_filterBehaviorHistory() {
  log('Test 9: 筛选行为历史（READ事件）');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/behavior/history`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          eventType: 'READ',
          page: 1,
          limit: 5,
        },
      }
    );

    success(`查询到 ${response.data.data.length} 条READ事件`);
  } catch (err) {
    error('筛选行为历史失败', err);
    throw err;
  }
}

/**
 * Test 10: 获取阅读历史
 */
async function test10_getReadingHistory() {
  log('Test 10: 获取阅读历史');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/behavior/reading-history`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { page: 1, limit: 10 },
      }
    );

    success(`查询到 ${response.data.data.length} 条阅读历史`);
    console.log('总记录数:', response.data.pagination.total);
    
    if (response.data.data.length > 0) {
      console.log('\n阅读历史详情:');
      response.data.data.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.content?.title || 'N/A'}`);
        console.log(`     阅读次数: ${item.readCount} | 时长: ${item.totalDuration}秒`);
        console.log(`     收藏: ${item.isBookmarked ? '✓' : '✗'} | 点赞: ${item.isLiked ? '✓' : '✗'} | 分享: ${item.isShared ? '✓' : '✗'}`);
      });
    }
  } catch (err) {
    error('获取阅读历史失败', err);
    throw err;
  }
}

/**
 * Test 11: 获取收藏列表
 */
async function test11_getBookmarks() {
  log('Test 11: 获取收藏列表');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/behavior/reading-history`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { isBookmarked: true, page: 1, limit: 10 },
      }
    );

    success(`查询到 ${response.data.data.length} 个收藏`);
    
    if (response.data.data.length > 0) {
      response.data.data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.content?.title || 'N/A'}`);
      });
    }
  } catch (err) {
    error('获取收藏列表失败', err);
    throw err;
  }
}

/**
 * Test 12: 获取用户参与度统计
 */
async function test12_getUserEngagement() {
  log('Test 12: 获取用户参与度统计');
  
  try {
    // 等待统计更新
    await sleep(2000);

    const response = await axios.get(
      `${API_BASE_URL}/behavior/engagement`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!response.data.data) {
      console.log('⚠️  用户参与度统计记录尚未生成（这是正常的）');
      return;
    }

    const engagement = response.data.data;

    success('获取参与度统计成功');
    console.log('\n📊 总体统计:');
    console.log(`   浏览: ${engagement.totalViews} | 阅读: ${engagement.totalReads} | 点击: ${engagement.totalClicks}`);
    console.log(`   分享: ${engagement.totalShares} | 收藏: ${engagement.totalBookmarks} | 点赞: ${engagement.totalLikes}`);
    console.log(`   总阅读时长: ${(engagement.totalReadingTime / 60).toFixed(1)}分钟`);
    console.log(`   连续活跃: ${engagement.dailyActiveStreak}天`);
  } catch (err) {
    error('获取参与度统计失败', err);
    throw err;
  }
}

/**
 * Test 13: 获取行为统计（ALL）
 */
async function test13_getBehaviorStats() {
  log('Test 13: 获取多维度行为统计');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/behavior/stats`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { period: 'all' },
      }
    );

    const stats = response.data.data;

    success('获取行为统计成功');
    
    console.log('\n📊 行为统计:');
    console.log(`   浏览: ${stats.totalViews} | 阅读: ${stats.totalReads} | 点击: ${stats.totalClicks}`);
    console.log(`   分享: ${stats.totalShares} | 收藏: ${stats.totalBookmarks} | 点赞: ${stats.totalLikes}`);
    console.log(`   总阅读时长: ${(stats.totalReadingTime / 60).toFixed(1)}分钟`);

    if (Object.keys(stats.categoryDistribution).length > 0) {
      console.log('\n📂 分类偏好分布:');
      const sortedCategories = Object.entries(stats.categoryDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      sortedCategories.forEach(([category, count]) => {
        console.log(`   ${category}: ${count}次`);
      });
    }

    if (stats.topContents.length > 0) {
      console.log('\n🔥 热门内容 TOP 3:');
      stats.topContents.slice(0, 3).forEach((content, index) => {
        console.log(`   ${index + 1}. ${content.title}`);
        console.log(`      浏览: ${content.views}次 | 时长: ${content.duration}秒`);
      });
    }
  } catch (err) {
    error('获取行为统计失败', err);
    throw err;
  }
}

/**
 * Test 14: 测试时间段筛选
 */
async function test14_getStatsByPeriod() {
  log('Test 14: 按时间段获取统计');
  
  try {
    const periods = ['day', 'week', 'month'];
    
    for (const period of periods) {
      const response = await axios.get(
        `${API_BASE_URL}/behavior/stats`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { period },
        }
      );

      const stats = response.data.data;
      console.log(`\n${period.toUpperCase()}统计:`);
      console.log(`   浏览: ${stats.totalViews} | 阅读: ${stats.totalReads}`);
    }

    success('时间段筛选测试完成');
  } catch (err) {
    error('时间段筛选测试失败', err);
    throw err;
  }
}

/**
 * Test 15: 更新每日活跃连续天数
 */
async function test15_updateDailyActive() {
  log('Test 15: 更新每日活跃连续天数');
  
  try {
    await axios.post(
      `${API_BASE_URL}/behavior/daily-active`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success('更新活跃状态成功');

    // 获取更新后的参与度
    const response = await axios.get(
      `${API_BASE_URL}/behavior/engagement`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.data) {
      console.log('连续活跃天数:', response.data.data.dailyActiveStreak);
    }
  } catch (err) {
    error('更新活跃状态失败', err);
    throw err;
  }
}

/**
 * Test 16: 取消收藏
 */
async function test16_unbookmarkContent() {
  log('Test 16: 取消收藏');
  
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/behavior/${testContentIds[0]}/bookmark`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success('取消收藏成功');
    console.log('已收藏:', response.data.data.isBookmarked);
  } catch (err) {
    error('取消收藏失败', err);
    throw err;
  }
}

/**
 * Test 17: 取消点赞
 */
async function test17_unlikeContent() {
  log('Test 17: 取消点赞');
  
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/behavior/${testContentIds[1]}/like`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success('取消点赞成功');
    console.log('已点赞:', response.data.data.isLiked);
  } catch (err) {
    error('取消点赞失败', err);
    throw err;
  }
}

// ============================================
// 主测试流程
// ============================================

async function runAllTests() {
  console.log('\n🚀 开始 Story 4.4 API 集成测试');
  console.log('测试目标: 验证行为追踪、阅读历史和参与度统计API');
  console.log('API地址:', API_BASE_URL);

  let passedTests = 0;
  let failedTests = 0;
  const totalTests = 17;

  const tests = [
    { name: 'Test 1: 用户登录', fn: test1_login },
    { name: 'Test 2: 获取测试内容', fn: test2_getTestContents },
    { name: 'Test 3: 批量追踪行为', fn: test3_trackBehaviors },
    { name: 'Test 4: 更新阅读历史', fn: test4_updateReadingHistory },
    { name: 'Test 5: 收藏内容', fn: test5_bookmarkContent },
    { name: 'Test 6: 点赞内容', fn: test6_likeContent },
    { name: 'Test 7: 分享内容', fn: test7_shareContent },
    { name: 'Test 8: 获取行为历史', fn: test8_getBehaviorHistory },
    { name: 'Test 9: 筛选行为历史', fn: test9_filterBehaviorHistory },
    { name: 'Test 10: 获取阅读历史', fn: test10_getReadingHistory },
    { name: 'Test 11: 获取收藏列表', fn: test11_getBookmarks },
    { name: 'Test 12: 获取参与度统计', fn: test12_getUserEngagement },
    { name: 'Test 13: 多维度统计', fn: test13_getBehaviorStats },
    { name: 'Test 14: 时间段筛选', fn: test14_getStatsByPeriod },
    { name: 'Test 15: 更新活跃天数', fn: test15_updateDailyActive },
    { name: 'Test 16: 取消收藏', fn: test16_unbookmarkContent },
    { name: 'Test 17: 取消点赞', fn: test17_unlikeContent },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      passedTests++;
    } catch (err) {
      failedTests++;
      console.log(`\n❌ ${test.name} 失败`);
    }
  }

  // 测试总结
  log('📊 测试总结');
  console.log(`总测试数: ${totalTests}`);
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！Phase 2 & 3 API验证成功！');
    console.log('\n✨ 验证结果:');
    console.log('   ✅ 批量行为追踪API正常');
    console.log('   ✅ 阅读历史更新API正常');
    console.log('   ✅ 收藏/点赞/分享API正常');
    console.log('   ✅ 行为历史查询API正常');
    console.log('   ✅ 阅读历史查询API正常');
    console.log('   ✅ 参与度统计API正常');
    console.log('   ✅ 多维度行为统计API正常');
    console.log('\n🚀 Phase 2 & 3 完成！可以继续开发 Phase 4: 隐式偏好引擎');
  } else {
    console.log('\n⚠️  部分测试失败，需要修复后再继续');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch((err) => {
  console.error('\n❌ 测试执行失败:', err);
  process.exit(1);
});

