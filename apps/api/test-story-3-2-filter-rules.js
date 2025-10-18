/**
 * Integration Test for Story 3.2: Intelligent Filter Rules
 * 测试智能筛选规则功能
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// 测试用户凭据
const ADMIN_USER = {
  email: 'admin@mkbl.com',
  password: 'Wm@123456',
};

let authToken = '';
let createdRuleId = '';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// API辅助函数
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {},
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// 测试用例
async function testLogin() {
  logInfo('测试 1: 管理员登录');
  try {
    const response = await apiCall('POST', '/auth/login', ADMIN_USER);
    
    if (response.success && response.data.token) {
      authToken = response.data.token;
      logSuccess(`登录成功 - 用户: ${response.data.user.email}, 角色: ${response.data.user.role}`);
      return true;
    } else {
      logError('登录失败 - 未获得token');
      return false;
    }
  } catch (error) {
    logError(`登录失败: ${error.message || error}`);
    console.error('详细错误:', error);
    return false;
  }
}

async function testCreateKeywordBoostRule() {
  logInfo('测试 2: 创建关键词加权规则');
  try {
    const ruleData = {
      name: 'AI关键词加权规则',
      description: '对包含AI相关关键词的内容进行加权',
      ruleType: 'KEYWORD_BOOST',
      priority: 10,
      config: {
        keywords: ['人工智能', 'AI', 'Machine Learning', 'ChatGPT', 'GPT-4', 'Claude'],
        weight: 2.0,
        conditions: {
          titleOnly: false,
          caseSensitive: false,
        },
      },
    };

    const response = await apiCall('POST', '/filter-rules', ruleData, authToken);
    
    if (response.success && response.data.id) {
      createdRuleId = response.data.id;
      logSuccess(`创建规则成功 - ID: ${createdRuleId}, 名称: ${response.data.name}`);
      logInfo(`  类型: ${response.data.ruleType}, 优先级: ${response.data.priority}, 状态: ${response.data.status}`);
      return true;
    } else {
      logError('创建规则失败');
      return false;
    }
  } catch (error) {
    logError(`创建规则失败: ${error.message}`);
    return false;
  }
}

async function testGetRules() {
  logInfo('测试 3: 获取规则列表');
  try {
    const response = await apiCall('GET', '/filter-rules?page=1&limit=10', null, authToken);
    
    if (response.success && response.data.items) {
      logSuccess(`获取规则列表成功 - 共 ${response.data.total} 条规则`);
      logInfo(`  当前页: ${response.data.page}, 每页: ${response.data.limit}, 总页数: ${response.data.totalPages}`);
      
      if (response.data.items.length > 0) {
        logInfo(`  示例规则: ${response.data.items[0].name} (${response.data.items[0].ruleType})`);
      }
      return true;
    } else {
      logError('获取规则列表失败');
      return false;
    }
  } catch (error) {
    logError(`获取规则列表失败: ${error.message}`);
    return false;
  }
}

async function testGetRuleDetail() {
  logInfo('测试 4: 获取规则详情');
  try {
    if (!createdRuleId) {
      logWarning('跳过测试 - 没有可用的规则ID');
      return true;
    }

    const response = await apiCall('GET', `/filter-rules/${createdRuleId}`, null, authToken);
    
    if (response.success && response.data.id === createdRuleId) {
      logSuccess(`获取规则详情成功 - ${response.data.name}`);
      logInfo(`  创建者: ${response.data.creator.name}, 创建时间: ${response.data.createdAt}`);
      logInfo(`  配置: ${JSON.stringify(response.data.config).substring(0, 100)}...`);
      return true;
    } else {
      logError('获取规则详情失败');
      return false;
    }
  } catch (error) {
    logError(`获取规则详情失败: ${error.message}`);
    return false;
  }
}

async function testUpdateRule() {
  logInfo('测试 5: 更新规则');
  try {
    if (!createdRuleId) {
      logWarning('跳过测试 - 没有可用的规则ID');
      return true;
    }

    const updateData = {
      priority: 15,
      description: '更新后的描述：对AI关键词内容进行更高权重的加权',
    };

    const response = await apiCall('PATCH', `/filter-rules/${createdRuleId}`, updateData, authToken);
    
    if (response.success && response.data.priority === 15) {
      logSuccess(`更新规则成功 - 优先级已更新为: ${response.data.priority}`);
      return true;
    } else {
      logError('更新规则失败');
      return false;
    }
  } catch (error) {
    logError(`更新规则失败: ${error.message}`);
    return false;
  }
}

async function testRuleTest() {
  logInfo('测试 6: 测试规则效果');
  try {
    const testData = {
      ruleConfig: {
        keywords: ['AI', '人工智能'],
        weight: 2.0,
        conditions: {
          titleOnly: false,
          caseSensitive: false,
        },
      },
      ruleType: 'KEYWORD_BOOST',
      limit: 20,
    };

    const response = await apiCall('POST', '/filter-rules/test', testData, authToken);
    
    if (response.success && response.data) {
      logSuccess(`规则测试成功 - 测试了 ${response.data.totalTested} 条内容`);
      logInfo(`  影响内容数: ${response.data.affected}`);
      
      if (response.data.results && response.data.results.length > 0) {
        const firstResult = response.data.results[0];
        logInfo(`  示例结果: "${firstResult.title.substring(0, 50)}..."`);
        logInfo(`    原始分: ${firstResult.originalScore}, 新分: ${firstResult.newScore}, 变化: ${firstResult.scoreDelta}`);
        logInfo(`    原因: ${firstResult.reason}`);
      }
      return true;
    } else {
      logError('规则测试失败');
      return false;
    }
  } catch (error) {
    logError(`规则测试失败: ${error.message}`);
    return false;
  }
}

async function testPublishRule() {
  logInfo('测试 7: 发布规则');
  try {
    if (!createdRuleId) {
      logWarning('跳过测试 - 没有可用的规则ID');
      return true;
    }

    const publishData = {
      changeLog: '首次发布：AI关键词加权规则',
    };

    const response = await apiCall('POST', `/filter-rules/${createdRuleId}/publish`, publishData, authToken);
    
    if (response.success && response.data.rule.isPublished) {
      logSuccess(`发布规则成功 - 版本: ${response.data.version.version}`);
      logInfo(`  状态: ${response.data.rule.status}, 发布时间: ${response.data.rule.publishedAt}`);
      return true;
    } else {
      logError('发布规则失败');
      return false;
    }
  } catch (error) {
    logError(`发布规则失败: ${error.message}`);
    return false;
  }
}

async function testGetRuleVersions() {
  logInfo('测试 8: 获取规则版本历史');
  try {
    if (!createdRuleId) {
      logWarning('跳过测试 - 没有可用的规则ID');
      return true;
    }

    const response = await apiCall('GET', `/filter-rules/${createdRuleId}/versions`, null, authToken);
    
    if (response.success && response.data.versions) {
      logSuccess(`获取版本历史成功 - 当前版本: ${response.data.current.version}`);
      logInfo(`  历史版本数: ${response.data.versions.length}`);
      
      if (response.data.versions.length > 0) {
        const latestVersion = response.data.versions[0];
        logInfo(`  最新版本: v${latestVersion.version}, 创建时间: ${latestVersion.createdAt}`);
      }
      return true;
    } else {
      logError('获取版本历史失败');
      return false;
    }
  } catch (error) {
    logError(`获取版本历史失败: ${error.message}`);
    return false;
  }
}

async function testCreateSourceWhitelist() {
  logInfo('测试 9: 添加来源到白名单');
  try {
    const whitelistData = {
      listType: 'WHITELIST',
      sourceName: 'TechCrunch',
      sourceDomain: 'techcrunch.com',
      weight: 1.5,
      reason: '权威科技媒体',
    };

    const response = await apiCall('POST', '/filter-rules/source-lists/add', whitelistData, authToken);
    
    if (response.success && response.data.id) {
      logSuccess(`添加白名单成功 - ${response.data.sourceName}`);
      logInfo(`  权重: ${response.data.weight}, 类型: ${response.data.listType}`);
      return true;
    } else {
      logError('添加白名单失败');
      return false;
    }
  } catch (error) {
    logError(`添加白名单失败: ${error.message}`);
    return false;
  }
}

async function testGetSourceLists() {
  logInfo('测试 10: 获取来源列表');
  try {
    const response = await apiCall('GET', '/filter-rules/source-lists/list?type=WHITELIST', null, authToken);
    
    if (response.success && response.data.items) {
      logSuccess(`获取来源列表成功 - 共 ${response.data.total} 条`);
      
      if (response.data.items.length > 0) {
        logInfo(`  示例: ${response.data.items[0].sourceName} (权重: ${response.data.items[0].weight})`);
      }
      return true;
    } else {
      logError('获取来源列表失败');
      return false;
    }
  } catch (error) {
    logError(`获取来源列表失败: ${error.message}`);
    return false;
  }
}

async function testCreateCategoryBoostRule() {
  logInfo('测试 11: 创建分类加权规则');
  try {
    const ruleData = {
      name: 'AI分类加权规则',
      description: '对AI分类的内容进行加权',
      ruleType: 'CATEGORY_BOOST',
      priority: 8,
      config: {
        categories: ['AI', 'Machine Learning', 'Deep Learning'],
        weight: 1.5,
      },
    };

    const response = await apiCall('POST', '/filter-rules', ruleData, authToken);
    
    if (response.success && response.data.id) {
      logSuccess(`创建分类加权规则成功 - ${response.data.name}`);
      return true;
    } else {
      logError('创建分类加权规则失败');
      return false;
    }
  } catch (error) {
    logError(`创建分类加权规则失败: ${error.message}`);
    return false;
  }
}

// 主测试流程
async function runAllTests() {
  log('\n========================================', 'blue');
  log('Story 3.2: 智能筛选规则 - 集成测试', 'blue');
  log('========================================\n', 'blue');

  const tests = [
    { name: '管理员登录', fn: testLogin },
    { name: '创建关键词加权规则', fn: testCreateKeywordBoostRule },
    { name: '获取规则列表', fn: testGetRules },
    { name: '获取规则详情', fn: testGetRuleDetail },
    { name: '更新规则', fn: testUpdateRule },
    { name: '测试规则效果', fn: testRuleTest },
    { name: '发布规则', fn: testPublishRule },
    { name: '获取规则版本历史', fn: testGetRuleVersions },
    { name: '添加来源到白名单', fn: testCreateSourceWhitelist },
    { name: '获取来源列表', fn: testGetSourceLists },
    { name: '创建分类加权规则', fn: testCreateCategoryBoostRule },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      console.log(''); // 空行分隔
    } catch (error) {
      logError(`测试异常: ${error.message}`);
      failed++;
      console.log('');
    }
  }

  // 测试总结
  log('\n========================================', 'blue');
  log('测试总结', 'blue');
  log('========================================', 'blue');
  log(`总测试数: ${tests.length}`, 'blue');
  logSuccess(`通过: ${passed}`);
  if (failed > 0) {
    logError(`失败: ${failed}`);
  }
  log(`通过率: ${((passed / tests.length) * 100).toFixed(2)}%`, 'blue');
  
  if (failed === 0) {
    log('\n🎉 所有测试通过！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查日志', 'yellow');
  }
  
  log('', 'reset');
}

// 运行测试
runAllTests().catch(error => {
  logError(`测试执行失败: ${error.message}`);
  process.exit(1);
});

