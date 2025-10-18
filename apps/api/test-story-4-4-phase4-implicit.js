/**
 * Story 4.4 Phase 4 测试脚本
 * 测试隐式偏好学习与推荐整合
 */

const axios = require('axios');

const API_BASE_URL = 'http://192.168.13.142:3001/api';

// 测试结果统计
let totalTests = 0;
let passedTests = 0;

// 存储登录信息
let authToken = '';
let userId = '';

// ===================================
// 工具函数
// ===================================

function log(message) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(message);
  console.log('='.repeat(60));
}

function success(message) {
  passedTests++;
  console.log(`✅ ${message}`);
}

function error(message, err) {
  console.error(`❌ ${message}`);
  if (err) {
    console.error('错误详情:', err.response?.data || err.message);
  }
}

// ===================================
// 测试用例
// ===================================

/**
 * Test 1: 用户登录
 */
async function testLogin() {
  totalTests++;
  log('Test 1: 用户登录');

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@mkbl.com',
      password: 'Wm@123456',
    });

    console.log('登录响应:', JSON.stringify(response.data, null, 2));

    // 尝试多种可能的响应格式
    if (response.data) {
      authToken = response.data.token || response.data.data?.token;
      userId = response.data.user?.id || response.data.data?.user?.id;
      
      if (!authToken || !userId) {
        error('登录失败: 响应格式不正确');
        console.log('期望的格式: { token: "...", user: { id: "..." } }');
        return;
      }
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      success(`登录成功: userId=${userId}`);
      console.log('用户信息:', response.data.user || response.data.data?.user);
    } else {
      error('登录失败: 响应格式不正确');
    }
  } catch (err) {
    error('登录失败', err);
  }
}

/**
 * Test 2: 创建一些测试行为数据
 */
async function testCreateBehaviorData() {
  totalTests++;
  log('Test 2: 创建测试行为数据');

  try {
    // 获取一些内容用于创建行为
    const contentResponse = await axios.get(`${API_BASE_URL}/content`, {
      params: {
        page: 1,
        limit: 5,
      },
    });

    const contents = contentResponse.data.data || [];
    
    if (contents.length === 0) {
      error('没有可用的内容来创建行为数据');
      return;
    }

    console.log(`找到 ${contents.length} 条内容`);

    // 创建多种类型的行为
    const behaviors = [];
    
    // 为每个内容创建不同类型的行为
    for (const content of contents) {
      // VIEW 行为
      behaviors.push({
        contentId: content.id,
        eventType: 'VIEW',
        timestamp: new Date().toISOString(),
      });

      // READ 行为 (高权重)
      behaviors.push({
        contentId: content.id,
        eventType: 'READ',
        duration: 180, // 3分钟
        scrollDepth: 0.8,
        timestamp: new Date().toISOString(),
      });

      // 对部分内容添加BOOKMARK或LIKE (超高权重)
      if (contents.indexOf(content) < 2) {
        behaviors.push({
          contentId: content.id,
          eventType: 'BOOKMARK',
          timestamp: new Date().toISOString(),
        });
      }

      if (contents.indexOf(content) === 0) {
        behaviors.push({
          contentId: content.id,
          eventType: 'SHARE',
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`准备创建 ${behaviors.length} 条行为记录`);

    // 批量追踪行为
    const response = await axios.post(
      `${API_BASE_URL}/behavior/track`,
      { behaviors }
    );

    if (response.data.success) {
      success(`成功创建行为数据: ${response.data.data.successCount} 条成功`);
      console.log('行为统计:', response.data.data);
    } else {
      error('创建行为数据失败');
    }
  } catch (err) {
    error('创建行为数据失败', err);
  }
}

/**
 * Test 3: 手动触发隐式偏好学习
 */
async function testLearnImplicitPreferences() {
  totalTests++;
  log('Test 3: 触发隐式偏好学习');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/behavior/learn-preferences`
    );

    if (response.data.success) {
      success('隐式偏好学习成功');
      console.log('响应:', response.data.message);
    } else {
      error('隐式偏好学习失败');
    }
  } catch (err) {
    error('隐式偏好学习失败', err);
  }
}

/**
 * Test 4: 获取用户的隐式偏好
 */
async function testGetImplicitPreferences() {
  totalTests++;
  log('Test 4: 获取用户的隐式偏好');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/behavior/implicit-preferences`
    );

    if (response.data.success) {
      const preferences = response.data.data;
      success(`成功获取隐式偏好: ${preferences.length} 条`);
      
      // 按类型分组显示
      const byType = preferences.reduce((acc, pref) => {
        if (!acc[pref.preferenceType]) acc[pref.preferenceType] = [];
        acc[pref.preferenceType].push(pref);
        return acc;
      }, {});

      for (const [type, prefs] of Object.entries(byType)) {
        console.log(`\n${type.toUpperCase()} 偏好 (${prefs.length}条):`);
        prefs.slice(0, 5).forEach(pref => {
          console.log(
            `  - ${pref.preferenceKey}: ` +
            `权重=${pref.weight.toFixed(3)}, ` +
            `置信度=${pref.confidence.toFixed(3)}, ` +
            `交互次数=${pref.interactionCount}`
          );
        });
      }
    } else {
      error('获取隐式偏好失败');
    }
  } catch (err) {
    error('获取隐式偏好失败', err);
  }
}

/**
 * Test 5: 获取特定类型的隐式偏好
 */
async function testGetImplicitPreferencesByType() {
  totalTests++;
  log('Test 5: 获取分类偏好');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/behavior/implicit-preferences`,
      { params: { type: 'category' } }
    );

    if (response.data.success) {
      const preferences = response.data.data;
      success(`成功获取分类偏好: ${preferences.length} 条`);
      
      console.log('Top 5 分类偏好:');
      preferences.slice(0, 5).forEach((pref, index) => {
        console.log(
          `${index + 1}. ${pref.preferenceKey} ` +
          `(权重: ${pref.weight.toFixed(3)}, 置信度: ${pref.confidence.toFixed(3)})`
        );
      });
    } else {
      error('获取分类偏好失败');
    }
  } catch (err) {
    error('获取分类偏好失败', err);
  }
}

/**
 * Test 6: 对比显式和隐式偏好
 */
async function testComparePreferences() {
  totalTests++;
  log('Test 6: 对比显式和隐式偏好');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/behavior/preference-comparison`
    );

    if (response.data.success) {
      const comparison = response.data.data;
      success('成功获取偏好对比');
      
      console.log('\n显式偏好 (用户主动设置):');
      console.log('  分类:', comparison.explicit.categories.map(c => c.key).join(', ') || '无');
      console.log('  公司:', comparison.explicit.companies.map(c => c.key).join(', ') || '无');
      console.log('  来源:', comparison.explicit.sources.map(c => c.key).join(', ') || '无');
      
      console.log('\n隐式偏好 (从行为学习):');
      console.log('  分类:', comparison.implicit.categories.slice(0, 5).map(c => c.key).join(', ') || '无');
      console.log('  公司:', comparison.implicit.companies.slice(0, 5).map(c => c.key).join(', ') || '无');
      console.log('  来源:', comparison.implicit.sources.slice(0, 5).map(c => c.key).join(', ') || '无');
      
      console.log('\n洞察 (Insights):');
      comparison.insights.forEach(insight => {
        console.log(`  💡 ${insight}`);
      });
    } else {
      error('偏好对比失败');
    }
  } catch (err) {
    error('偏好对比失败', err);
  }
}

/**
 * Test 7: 测试个性化推荐（整合隐式偏好）
 */
async function testPersonalizedRecommendation() {
  totalTests++;
  log('Test 7: 测试个性化推荐（含隐式偏好）');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/preferences/personalized-content`,
      {
        params: {
          page: 1,
          limit: 5,
        },
      }
    );

    if (response.data.success) {
      const contents = response.data.data.items || [];
      success(`成功获取个性化推荐: ${contents.length} 条`);
      
      console.log('\n个性化推荐内容:');
      contents.forEach((content, index) => {
        console.log(`\n${index + 1}. ${content.title}`);
        console.log(`   基础分: ${content.baseScore}, 个性化分: ${content.personalizedScore.toFixed(2)}`);
        console.log(`   分类: ${content.category}`);
        console.log('   调整原因:');
        
        if (content.scoreAdjustments && content.scoreAdjustments.length > 0) {
          content.scoreAdjustments.forEach(adj => {
            if (adj.adjustment > 0) {
              console.log(`     - ${adj.reason}: +${adj.adjustment.toFixed(2)} ${adj.details ? `(${adj.details})` : ''}`);
            }
          });
        } else {
          console.log('     - 无调整');
        }
      });
    } else {
      error('获取个性化推荐失败');
    }
  } catch (err) {
    error('获取个性化推荐失败', err);
  }
}

/**
 * Test 8: 测试个性化TOP10（整合隐式偏好）
 */
async function testPersonalizedTop10() {
  totalTests++;
  log('Test 8: 测试个性化TOP10（含隐式偏好）');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/preferences/daily-top10/personalized`
    );

    if (response.data.success) {
      const top10 = response.data.data || [];
      success(`成功获取个性化TOP10: ${top10.length} 条`);
      
      console.log('\n个性化TOP10内容:');
      top10.forEach((content, index) => {
        console.log(`\n${index + 1}. ${content.title}`);
        console.log(`   基础分: ${content.baseScore}, 个性化分: ${content.personalizedScore.toFixed(2)}`);
        console.log(`   分类: ${content.category}`);
        
        const implicitAdj = content.scoreAdjustments?.find(
          adj => adj.reason.includes('隐式偏好')
        );
        
        if (implicitAdj && implicitAdj.adjustment > 0) {
          console.log(`   ⭐ 隐式偏好加权: +${implicitAdj.adjustment.toFixed(2)}`);
          if (implicitAdj.details) {
            console.log(`      ${implicitAdj.details}`);
          }
        }
      });
    } else {
      error('获取个性化TOP10失败');
    }
  } catch (err) {
    error('获取个性化TOP10失败', err);
  }
}

/**
 * Test 9: 清除隐式偏好
 */
async function testClearImplicitPreferences() {
  totalTests++;
  log('Test 9: 清除隐式偏好');

  try {
    const response = await axios.delete(
      `${API_BASE_URL}/behavior/implicit-preferences`
    );

    if (response.data.success) {
      success(`成功清除隐式偏好: ${response.data.data.deleted} 条`);
      console.log('响应:', response.data.message);
    } else {
      error('清除隐式偏好失败');
    }
  } catch (err) {
    error('清除隐式偏好失败', err);
  }
}

/**
 * Test 10: 重新学习偏好（验证清除后重建）
 */
async function testRelearn() {
  totalTests++;
  log('Test 10: 重新学习偏好（验证重建）');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/behavior/learn-preferences`
    );

    if (response.data.success) {
      success('重新学习成功');
      
      // 验证偏好已重建
      const prefsResponse = await axios.get(
        `${API_BASE_URL}/behavior/implicit-preferences`
      );
      
      if (prefsResponse.data.success) {
        const count = prefsResponse.data.data.length;
        console.log(`偏好已重建: ${count} 条`);
      }
    } else {
      error('重新学习失败');
    }
  } catch (err) {
    error('重新学习失败', err);
  }
}

// ===================================
// 主测试流程
// ===================================

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Story 4.4 Phase 4: 隐式偏好引擎 - 集成测试             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  await testLogin();
  
  if (!authToken) {
    console.log('\n❌ 登录失败，终止测试');
    return;
  }

  await testCreateBehaviorData();
  await testLearnImplicitPreferences();
  await testGetImplicitPreferences();
  await testGetImplicitPreferencesByType();
  await testComparePreferences();
  await testPersonalizedRecommendation();
  await testPersonalizedTop10();
  await testClearImplicitPreferences();
  await testRelearn();

  // 测试总结
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                     测试总结                              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${totalTests - passedTests}`);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！Phase 4 后端功能完美！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查日志');
  }
}

// 运行测试
runAllTests().catch((err) => {
  console.error('测试执行失败:', err);
  process.exit(1);
});

