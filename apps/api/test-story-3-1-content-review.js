/**
 * Story 3.1: 内容审核工作台界面 - 集成测试
 * 测试Content Review API的所有端点
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testContentIds = [];
let reviewableContentId = '';

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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. 管理员登录
async function testAdminLogin() {
  logSection('测试1: 管理员登录');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@mkbl.com',
      password: 'Wm@123456'
    });

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      logTest('管理员登录', 'PASS', `Token: ${authToken.substring(0, 20)}...`);
    } else {
      logTest('管理员登录', 'FAIL', '未返回token');
    }
  } catch (error) {
    logTest('管理员登录', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 2. 准备测试数据 - 获取一些待审核的内容
async function prepareTestData() {
  logSection('测试2: 准备测试数据');
  
  try {
    // 直接从审核接口获取测试数据
    const response = await axios.get(`${BASE_URL}/api/content-review`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 10 }
    });

    if (response.data.success && response.data.data.items && response.data.data.items.length > 0) {
      testContentIds = response.data.data.items.map(item => item.id);
      reviewableContentId = testContentIds[0];
      logTest('获取测试内容', 'PASS', `获取了${testContentIds.length}条内容`);
      console.log(`   测试内容ID: ${reviewableContentId}`.gray);
    } else {
      logTest('获取测试内容', 'FAIL', '没有可用的内容');
    }
  } catch (error) {
    logTest('获取测试内容', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 3. 测试获取审核列表（无筛选）
async function testGetReviewList() {
  logSection('测试3: 获取审核列表');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/content-review`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    });

    if (response.data.success) {
      const { items, total, page, totalPages, stats } = response.data.data;
      logTest('获取审核列表', 'PASS', 
        `返回${items.length}条内容，共${total}条，第${page}/${totalPages}页`);
      
      if (stats) {
        console.log(`   状态统计: 待审核=${stats.pendingCount}, 已通过=${stats.approvedCount}, 已拒绝=${stats.rejectedCount}`.gray);
      }
    } else {
      logTest('获取审核列表', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('获取审核列表', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 4. 测试按状态筛选
async function testFilterByStatus() {
  logSection('测试4: 按状态筛选');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/content-review`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        status: 'PENDING_REVIEW,APPROVED',
        limit: 10
      }
    });

    if (response.data.success) {
      const { items } = response.data.data;
      logTest('按状态筛选', 'PASS', `返回${items.length}条内容`);
      
      // 验证返回的内容确实符合筛选条件
      const validStatuses = items.every(item => 
        ['PENDING_REVIEW', 'APPROVED'].includes(item.reviewStatus)
      );
      
      if (validStatuses) {
        logTest('状态筛选验证', 'PASS', '所有返回内容状态正确');
      } else {
        logTest('状态筛选验证', 'FAIL', '存在不符合筛选条件的内容');
      }
    } else {
      logTest('按状态筛选', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('按状态筛选', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 5. 测试获取内容详情
async function testGetContentDetail() {
  logSection('测试5: 获取内容详情');
  
  if (!reviewableContentId) {
    logTest('获取内容详情', 'FAIL', '没有可用的测试内容ID');
    return;
  }
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/content-review/${reviewableContentId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      const content = response.data.data;
      logTest('获取内容详情', 'PASS', `标题: ${content.title?.substring(0, 50)}`);
      
      // 验证必需字段
      const hasRequiredFields = content.id && content.title && content.reviewStatus;
      if (hasRequiredFields) {
        logTest('详情字段验证', 'PASS', `状态: ${content.reviewStatus}`);
      } else {
        logTest('详情字段验证', 'FAIL', '缺少必需字段');
      }
      
      // 验证是否包含AI评分
      if (content.contentScore) {
        logTest('AI评分数据', 'PASS', `总分: ${content.contentScore.totalScore}`);
      } else {
        logTest('AI评分数据', 'WARN', '该内容没有AI评分');
      }
    } else {
      logTest('获取内容详情', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('获取内容详情', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 6. 测试更新审核状态 - 批准
async function testApproveContent() {
  logSection('测试6: 批准内容');
  
  if (!reviewableContentId) {
    logTest('批准内容', 'FAIL', '没有可用的测试内容ID');
    return;
  }
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/content-review/${reviewableContentId}/status`,
      {
        action: 'APPROVE',
        notes: '测试批准操作'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      const content = response.data.data;
      logTest('批准内容', 'PASS', `状态已更新为: ${content.reviewStatus}`);
      
      // 验证状态是否正确更新
      if (content.reviewStatus === 'APPROVED') {
        logTest('状态更新验证', 'PASS', '状态正确更新为APPROVED');
      } else {
        logTest('状态更新验证', 'FAIL', `状态为${content.reviewStatus}，期望APPROVED`);
      }
      
      // 验证是否记录了审核信息
      if (content.reviewedBy && content.reviewedAt) {
        logTest('审核信息记录', 'PASS', `审核人: ${content.reviewer?.name || content.reviewedBy}`);
      } else {
        logTest('审核信息记录', 'FAIL', '未记录审核人或时间');
      }
    } else {
      logTest('批准内容', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('批准内容', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 7. 测试批量更新状态
async function testBatchUpdate() {
  logSection('测试7: 批量更新状态');
  
  if (testContentIds.length < 3) {
    logTest('批量更新', 'FAIL', '测试内容不足（至少需要3条）');
    return;
  }
  
  const batchIds = testContentIds.slice(0, 3);
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/content-review/batch-update`,
      {
        contentIds: batchIds,
        action: 'APPROVE',
        notes: '批量测试批准'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      const { successCount, failedCount, results } = response.data.data;
      logTest('批量更新', 'PASS', 
        `成功: ${successCount}, 失败: ${failedCount}, 总计: ${batchIds.length}`);
      
      if (successCount === batchIds.length) {
        logTest('批量更新完整性', 'PASS', '所有内容都成功更新');
      } else {
        logTest('批量更新完整性', 'WARN', `有${failedCount}条更新失败`);
      }
    } else {
      logTest('批量更新', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('批量更新', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 8. 测试更新内容详情
async function testUpdateContentDetails() {
  logSection('测试8: 更新内容详情');
  
  if (!reviewableContentId) {
    logTest('更新内容详情', 'FAIL', '没有可用的测试内容ID');
    return;
  }
  
  try {
    const updates = {
      title: `测试标题更新 - ${Date.now()}`,
      description: '这是测试更新的描述内容',
      category: 'Technology',
      tags: ['test', 'review', 'update']
    };

    const response = await axios.patch(
      `${BASE_URL}/api/content-review/${reviewableContentId}`,
      updates,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      const content = response.data.data;
      logTest('更新内容详情', 'PASS', `已更新内容: ${content.id}`);
      
      // 验证更新是否生效
      if (content.title === updates.title) {
        logTest('标题更新验证', 'PASS', '标题已正确更新');
      } else {
        logTest('标题更新验证', 'FAIL', '标题更新未生效');
      }
      
      // 验证是否记录了编辑信息
      if (content.lastEditedBy && content.lastEditedAt) {
        logTest('编辑信息记录', 'PASS', `编辑人: ${content.editor?.name || content.lastEditedBy}`);
      } else {
        logTest('编辑信息记录', 'FAIL', '未记录编辑人或时间');
      }
    } else {
      logTest('更新内容详情', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('更新内容详情', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 9. 测试获取审核日志
async function testGetAuditLog() {
  logSection('测试9: 获取审核日志');
  
  if (!reviewableContentId) {
    logTest('获取审核日志', 'FAIL', '没有可用的测试内容ID');
    return;
  }
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/content-review/${reviewableContentId}/audit-log`,
      { 
        headers: { Authorization: `Bearer ${authToken}` },
        params: { limit: 20 }
      }
    );

    if (response.data.success) {
      const { logs } = response.data.data;
      logTest('获取审核日志', 'PASS', `返回${logs.length}条日志记录`);
      
      if (logs.length > 0) {
        const latestLog = logs[0];
        logTest('日志内容验证', 'PASS', 
          `最新操作: ${latestLog.action} by ${latestLog.user?.name || 'Unknown'}`);
        
        // 验证日志是否包含状态变更
        if (latestLog.oldStatus && latestLog.newStatus) {
          logTest('状态变更记录', 'PASS', 
            `${latestLog.oldStatus} → ${latestLog.newStatus}`);
        } else {
          logTest('状态变更记录', 'WARN', '某些日志没有记录状态变更');
        }
      } else {
        logTest('日志内容验证', 'WARN', '该内容还没有审核日志');
      }
    } else {
      logTest('获取审核日志', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('获取审核日志', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 10. 测试获取统计数据
async function testGetStats() {
  logSection('测试10: 获取统计数据');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/content-review/stats/summary`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      const stats = response.data.data;
      logTest('获取统计数据', 'PASS', `总审核数: ${stats.totalReviewed}`);
      
      console.log(`   审核通过率: ${stats.approvalRate.toFixed(2)}%`.gray);
      console.log(`   状态分布: 待审核=${stats.byStatus.pending}, 已通过=${stats.byStatus.approved}`.gray);
      
      if (stats.byReviewer && stats.byReviewer.length > 0) {
        logTest('审核员统计', 'PASS', `${stats.byReviewer.length}位审核员`);
        console.log(`   Top审核员: ${stats.byReviewer[0].userName} (${stats.byReviewer[0].reviewCount}条)`.gray);
      } else {
        logTest('审核员统计', 'WARN', '暂无审核员数据');
      }
      
      if (stats.byCategory && Object.keys(stats.byCategory).length > 0) {
        logTest('分类统计', 'PASS', `${Object.keys(stats.byCategory).length}个分类`);
        const categories = Object.entries(stats.byCategory)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);
        categories.forEach(([cat, count]) => {
          console.log(`     ${cat}: ${count}条`.gray);
        });
      } else {
        logTest('分类统计', 'WARN', '暂无分类数据');
      }
    } else {
      logTest('获取统计数据', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('获取统计数据', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 11. 测试权限控制 - 普通用户无法访问
async function testPermissionControl() {
  logSection('测试11: 权限控制');
  
  try {
    // 尝试用普通用户登录
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user123'
    });

    if (loginResponse.data.success) {
      const userToken = loginResponse.data.data.token;
      
      // 尝试访问审核接口
      try {
        await axios.get(`${BASE_URL}/api/content-review`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        
        logTest('普通用户访问限制', 'FAIL', '普通用户不应能访问审核接口');
      } catch (error) {
        if (error.response?.status === 403) {
          logTest('普通用户访问限制', 'PASS', '正确拒绝了普通用户访问');
        } else {
          logTest('普通用户访问限制', 'FAIL', `期望403，但得到${error.response?.status}`);
        }
      }
    } else {
      logTest('普通用户登录', 'WARN', '普通用户登录失败，跳过权限测试');
    }
  } catch (error) {
    logTest('权限控制测试', 'WARN', '无法执行权限测试: ' + error.message);
  }
}

// 12. 测试拒绝内容
async function testRejectContent() {
  logSection('测试12: 拒绝内容');
  
  if (testContentIds.length < 2) {
    logTest('拒绝内容', 'FAIL', '没有足够的测试内容');
    return;
  }
  
  const rejectContentId = testContentIds[1];
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/content-review/${rejectContentId}/status`,
      {
        action: 'REJECT',
        notes: '测试拒绝操作 - 内容质量不符合要求'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      const content = response.data.data;
      logTest('拒绝内容', 'PASS', `状态已更新为: ${content.reviewStatus}`);
      
      if (content.reviewStatus === 'REJECTED') {
        logTest('拒绝状态验证', 'PASS', '状态正确更新为REJECTED');
      } else {
        logTest('拒绝状态验证', 'FAIL', `状态为${content.reviewStatus}，期望REJECTED`);
      }
      
      if (content.reviewNotes) {
        logTest('拒绝原因记录', 'PASS', `原因: ${content.reviewNotes.substring(0, 50)}`);
      } else {
        logTest('拒绝原因记录', 'WARN', '未记录拒绝原因');
      }
    } else {
      logTest('拒绝内容', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('拒绝内容', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 13. 测试发布内容
async function testPublishContent() {
  logSection('测试13: 发布内容');
  
  if (!reviewableContentId) {
    logTest('发布内容', 'FAIL', '没有可用的测试内容ID');
    return;
  }
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/content-review/${reviewableContentId}/status`,
      {
        action: 'PUBLISH',
        notes: '测试发布操作'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      const content = response.data.data;
      logTest('发布内容', 'PASS', `状态已更新为: ${content.reviewStatus}`);
      
      if (content.reviewStatus === 'PUBLISHED') {
        logTest('发布状态验证', 'PASS', '状态正确更新为PUBLISHED');
      } else {
        logTest('发布状态验证', 'FAIL', `状态为${content.reviewStatus}，期望PUBLISHED`);
      }
    } else {
      logTest('发布内容', 'FAIL', '返回失败');
    }
  } catch (error) {
    logTest('发布内容', 'FAIL', error.response?.data?.error || error.message);
  }
}

// 主测试流程
async function runAllTests() {
  console.log('\n' + '='.repeat(60).rainbow);
  console.log('  Story 3.1: Content Review Workbench - 集成测试'.rainbow.bold);
  console.log('='.repeat(60).rainbow);
  console.log(`  测试时间: ${new Date().toLocaleString('zh-CN')}`.gray);
  console.log('='.repeat(60).rainbow);

  await testAdminLogin();
  await delay(500);

  if (!authToken) {
    console.log('\n❌ 无法继续测试：登录失败\n'.red.bold);
    return;
  }

  await prepareTestData();
  await delay(500);

  await testGetReviewList();
  await delay(500);

  await testFilterByStatus();
  await delay(500);

  await testGetContentDetail();
  await delay(500);

  await testApproveContent();
  await delay(500);

  await testBatchUpdate();
  await delay(500);

  await testUpdateContentDetails();
  await delay(500);

  await testGetAuditLog();
  await delay(500);

  await testGetStats();
  await delay(500);

  await testPermissionControl();
  await delay(500);

  await testRejectContent();
  await delay(500);

  await testPublishContent();
  await delay(500);

  // 测试总结
  logSection('测试总结');
  console.log(`总测试数: ${totalTests}`.cyan);
  console.log(`✅ 通过: ${passedTests}`.green);
  console.log(`❌ 失败: ${failedTests}`.red);
  console.log(`📊 通过率: ${((passedTests / totalTests) * 100).toFixed(2)}%`.yellow);

  if (failedTests === 0) {
    console.log('\n🎉 所有测试通过！'.green.bold);
  } else {
    console.log(`\n⚠️  有${failedTests}个测试失败，请检查日志\n`.yellow.bold);
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行失败:'.red, error.message);
  process.exit(1);
});

