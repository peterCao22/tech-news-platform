/**
 * Story 4.3: 历史内容分析与趋势 - 后端API集成测试
 * 
 * 测试内容：
 * 1. 个人vs平台对比分析
 * 2. 每日阅读记录
 * 3. 关键词趋势
 * 4. 分类趋势
 * 5. 趋势报告
 * 6. 公司追踪
 * 7. 关注公司动态
 * 8. 趋势聚合（管理员）
 */

const axios = require('axios');
require('dotenv').config({ path: '../../.env' });

const API_BASE_URL = 'http://127.0.0.1:3001/api';

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: [],
};

function logTest(name, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
  testResults.details.push({ name, passed, message });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Story 4.3: 历史内容分析与趋势 - 后端API集成测试');
  console.log('='.repeat(60));
  console.log('');

  let token, userId, adminToken;

  // ==================== 测试1: 用户登录 ====================
  console.log('\n【测试 1: 用户登录】');
  try {
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'user@mkbl.com',
      password: 'Wm@123456',
    });

    token = loginRes.data.token || loginRes.data.data?.token;
    userId = loginRes.data.user?.id || loginRes.data.data?.user?.id;

    if (token && userId) {
      logTest('用户登录成功', true);
      console.log(`   Token: ${token.substring(0, 20)}...`);
      console.log(`   User ID: ${userId}`);
    } else {
      logTest('用户登录失败', false, '无法获取token或userId');
      return;
    }
  } catch (error) {
    logTest('用户登录失败', false, error.message);
    return;
  }

  // ==================== 测试2: 管理员登录 ====================
  console.log('\n【测试 2: 管理员登录】');
  try {
    const adminLoginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@mkbl.com',
      password: 'Wm@123456',
    });

    adminToken = adminLoginRes.data.token || adminLoginRes.data.data?.token;

    if (adminToken) {
      logTest('管理员登录成功', true);
    } else {
      logTest('管理员登录失败', false, '无法获取token');
    }
  } catch (error) {
    logTest('管理员登录失败', false, error.message);
  }

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const adminConfig = {
    headers: { Authorization: `Bearer ${adminToken}` },
  };

  // ==================== 测试3: 个人vs平台对比分析 (7天) ====================
  console.log('\n【测试 3: 个人vs平台对比分析 (7天)】');
  try {
    const res = await axios.get(`${API_BASE_URL}/history/personal-vs-platform`, {
      params: { period: '7d' },
      ...config,
    });

    if (res.data.success && res.data.data) {
      const { myTop10, platformTop10, analysis } = res.data.data;
      logTest('获取7天对比分析成功', true);
      console.log(`   我的TOP10: ${myTop10.length} 条`);
      console.log(`   平台TOP10: ${platformTop10.length} 条`);
      console.log(`   兴趣匹配度: ${analysis.matchScore}`);
      console.log(`   重叠内容: ${analysis.overlap}`);
    } else {
      logTest('获取7天对比分析失败', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('获取7天对比分析失败', false, error.response?.data?.message || error.message);
  }

  // ==================== 测试4: 个人vs平台对比分析 (30天) ====================
  console.log('\n【测试 4: 个人vs平台对比分析 (30天)】');
  try {
    const res = await axios.get(`${API_BASE_URL}/history/personal-vs-platform`, {
      params: { period: '30d' },
      ...config,
    });

    if (res.data.success && res.data.data) {
      logTest('获取30天对比分析成功', true);
    } else {
      logTest('获取30天对比分析失败', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('获取30天对比分析失败', false, error.response?.data?.message || error.message);
  }

  // ==================== 测试5: 每日阅读记录 ====================
  console.log('\n【测试 5: 每日阅读记录】');
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`${API_BASE_URL}/history/daily-reading`, {
      params: { date: today },
      ...config,
    });

    if (res.data.success && res.data.data) {
      const { totalCount, items } = res.data.data;
      logTest('获取每日阅读记录成功', true);
      console.log(`   总数: ${totalCount}`);
      console.log(`   返回: ${items.length} 条`);
    } else {
      logTest('获取每日阅读记录失败', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('获取每日阅读记录失败', false, error.response?.data?.message || error.message);
  }

  // ==================== 测试6: 关键词趋势 (7天) ====================
  console.log('\n【测试 6: 关键词趋势 (7天)】');
  try {
    const res = await axios.get(`${API_BASE_URL}/history/trends/keywords`, {
      params: { period: '7d', limit: 20 },
      ...config,
    });

    if (res.data.success && res.data.data) {
      const { trends } = res.data.data;
      logTest('获取关键词趋势成功', true);
      console.log(`   趋势数: ${trends.length}`);
      if (trends.length > 0) {
        console.log(`   Top 3:`);
        trends.slice(0, 3).forEach((t, i) => {
          console.log(`     ${i + 1}. ${t.keyword}: ${t.currentCount} (${t.trend})`);
        });
      }
    } else {
      logTest('获取关键词趋势失败', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('获取关键词趋势失败', false, error.response?.data?.message || error.message);
  }

  // ==================== 测试7: 分类趋势 (30天) ====================
  console.log('\n【测试 7: 分类趋势 (30天)】');
  try {
    const res = await axios.get(`${API_BASE_URL}/history/trends/categories`, {
      params: { period: '30d', limit: 10 },
      ...config,
    });

    if (res.data.success && res.data.data) {
      const { trends } = res.data.data;
      logTest('获取分类趋势成功', true);
      console.log(`   趋势数: ${trends.length}`);
      if (trends.length > 0) {
        console.log(`   Top 3:`);
        trends.slice(0, 3).forEach((t, i) => {
          console.log(`     ${i + 1}. ${t.category}: ${t.currentCount} (${t.trend})`);
        });
      }
    } else {
      logTest('获取分类趋势失败', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('获取分类趋势失败', false, error.response?.data?.message || error.message);
  }

  // ==================== 测试8: 完整趋势报告 ====================
  console.log('\n【测试 8: 完整趋势报告】');
  try {
    const res = await axios.get(`${API_BASE_URL}/history/trends/report`, {
      params: { period: '7d' },
      ...config,
    });

    if (res.data.success && res.data.data) {
      const { keywordTrends, categoryTrends, summary } = res.data.data;
      logTest('获取完整趋势报告成功', true);
      console.log(`   关键词趋势: ${keywordTrends.length}`);
      console.log(`   分类趋势: ${categoryTrends.length}`);
      console.log(`   上升关键词: ${summary.risingKeywords}`);
      console.log(`   下降关键词: ${summary.fallingKeywords}`);
    } else {
      logTest('获取完整趋势报告失败', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('获取完整趋势报告失败', false, error.response?.data?.message || error.message);
  }

  // ==================== 测试9: 公司新闻追踪 ====================
  console.log('\n【测试 9: 公司新闻追踪】');
  try {
    const res = await axios.get(`${API_BASE_URL}/history/company/Tesla`, {
      params: { period: '30d' },
      ...config,
    });

    if (res.data.success && res.data.data) {
      const { company, stats, news } = res.data.data;
      logTest('追踪公司新闻成功', true);
      console.log(`   公司: ${company.name}`);
      console.log(`   新闻总数: ${stats.totalCount}`);
      console.log(`   平均评分: ${stats.avgScore}`);
    } else {
      logTest('追踪公司新闻失败', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('追踪公司新闻失败', false, error.response?.data?.message || error.message);
  }

  // ==================== 测试10: 关注公司动态 ====================
  console.log('\n【测试 10: 关注公司动态】');
  try {
    const res = await axios.get(`${API_BASE_URL}/history/following-companies`, {
      params: { period: '7d' },
      ...config,
    });

    if (res.data.success && res.data.data) {
      const { companies } = res.data.data;
      logTest('获取关注公司动态成功', true);
      console.log(`   关注公司数: ${companies.length}`);
      companies.forEach((c) => {
        console.log(`   - ${c.company.name}: ${c.newsCount} 条新闻 (${c.unreadCount} 未读)`);
      });
    } else {
      logTest('获取关注公司动态失败', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('获取关注公司动态失败', false, error.response?.data?.message || error.message);
  }

  // ==================== 测试11: 手动触发趋势聚合（管理员） ====================
  console.log('\n【测试 11: 手动触发趋势聚合（管理员）】');
  if (adminToken) {
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const res = await axios.post(
        `${API_BASE_URL}/history/trends/aggregate`,
        { date: yesterday },
        adminConfig
      );

      if (res.data.success && res.data.data) {
        const { keywordCount, categoryCount } = res.data.data;
        logTest('手动触发趋势聚合成功', true);
        console.log(`   聚合日期: ${res.data.data.date}`);
        console.log(`   关键词数: ${keywordCount}`);
        console.log(`   分类数: ${categoryCount}`);
      } else {
        logTest('手动触发趋势聚合失败', false, '响应格式不正确');
      }
    } catch (error) {
      logTest('手动触发趋势聚合失败', false, error.response?.data?.message || error.message);
    }
  } else {
    logTest('手动触发趋势聚合失败', false, '没有管理员token');
  }

  // ==================== 测试总结 ====================
  console.log('\n' + '='.repeat(60));
  console.log('测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${testResults.total}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));
}

// 运行测试
runTests().catch((error) => {
  console.error('测试执行出错:', error);
  process.exit(1);
});

