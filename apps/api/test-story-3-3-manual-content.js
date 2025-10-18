/**
 * Story 3.3 Manual Content Management API Integration Test
 * 手工内容管理API集成测试
 */

const axios = require('axios');
const colors = require('colors');

const API_BASE_URL = 'http://192.168.13.142:3001/api';

let authToken = '';
let createdTemplateId = '';
let createdContentId = '';
let batchImportId = '';

// 日志工具
function logInfo(message) {
  console.log(colors.cyan(`ℹ ${message}`));
}

function logSuccess(message) {
  console.log(colors.green(`✓ ${message}`));
}

function logError(message, error) {
  console.log(colors.red(`✗ ${message}`));
  if (error?.response?.data) {
    console.log(colors.red(`  Response: ${JSON.stringify(error.response.data, null, 2)}`));
  } else if (error?.message) {
    console.log(colors.red(`  Error: ${error.message}`));
  }
}

function logData(label, data) {
  console.log(colors.yellow(`  ${label}:`), JSON.stringify(data, null, 2));
}

// API调用封装
async function apiCall(method, endpoint, data = null, token = authToken) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    };

    if (data) {
      if (method.toUpperCase() === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }
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

/**
 * 测试 1: 用户登录
 */
async function testLogin() {
  logInfo('测试 1: 管理员登录');
  
  try {
    const response = await apiCall('POST', '/auth/login', {
      email: 'admin@mkbl.com',
      password: 'Wm@123456',
    }, null);

    if (response.success && response.data.token) {
      authToken = response.data.token;
      logSuccess('登录成功');
      logData('用户信息', {
        name: response.data.user.name,
        email: response.data.user.email,
        role: response.data.user.role,
      });
      return true;
    }

    logError('登录失败：未返回token');
    return false;
  } catch (error) {
    logError('登录失败', error);
    return false;
  }
}

/**
 * 测试 2: 获取内置模板
 */
async function testGetBuiltInTemplates() {
  logInfo('测试 2: 获取内置模板');
  
  try {
    const response = await apiCall('GET', '/content-management/templates/built-in');

    if (response.success && response.data.items) {
      logSuccess(`获取内置模板成功：${response.data.items.length} 个模板`);
      response.data.items.forEach(template => {
        logData(template.name, {
          category: template.category,
          tags: template.template.tags,
        });
      });
      return true;
    }

    logError('获取内置模板失败');
    return false;
  } catch (error) {
    logError('获取内置模板失败', error);
    return false;
  }
}

/**
 * 测试 3: 创建自定义模板
 */
async function testCreateTemplate() {
  logInfo('测试 3: 创建自定义模板');
  
  try {
    const response = await apiCall('POST', '/content-management/templates', {
      name: '测试模板',
      description: '这是一个测试模板',
      category: 'TEST',
      template: {
        category: 'TEST',
        tags: ['测试', '自动化'],
        defaultValues: {
          reviewStatus: 'DRAFT',
        },
      },
    });

    if (response.success && response.data.id) {
      createdTemplateId = response.data.id;
      logSuccess('创建自定义模板成功');
      logData('模板信息', response.data);
      return true;
    }

    logError('创建自定义模板失败');
    return false;
  } catch (error) {
    logError('创建自定义模板失败', error);
    return false;
  }
}

/**
 * 测试 4: 获取模板列表
 */
async function testGetTemplates() {
  logInfo('测试 4: 获取模板列表');
  
  try {
    const response = await apiCall('GET', '/content-management/templates');

    if (response.success && response.data.items) {
      logSuccess(`获取模板列表成功：${response.data.items.length} 个模板`);
      return true;
    }

    logError('获取模板列表失败');
    return false;
  } catch (error) {
    logError('获取模板列表失败', error);
    return false;
  }
}

/**
 * 测试 5: 创建手工内容
 */
async function testCreateManualContent() {
  logInfo('测试 5: 创建手工内容');
  
  try {
    const response = await apiCall('POST', '/content-management/create', {
      title: '测试新闻：AI技术最新突破',
      description: '这是一篇关于AI技术突破的测试新闻',
      content: '<p>详细内容：<strong>人工智能</strong>在多个领域取得重大突破...</p>',
      category: 'AI',
      tags: ['AI', '技术', '突破'],
      customSource: {
        name: '测试来源',
        domain: 'test.example.com',
      },
      reviewStatus: 'DRAFT',
    });

    if (response.success && response.data.id) {
      createdContentId = response.data.id;
      logSuccess('创建手工内容成功');
      logData('内容信息', {
        id: response.data.id,
        title: response.data.title,
        category: response.data.category,
        tags: response.data.tags,
        reviewStatus: response.data.reviewStatus,
      });
      return true;
    }

    logError('创建手工内容失败');
    return false;
  } catch (error) {
    logError('创建手工内容失败', error);
    return false;
  }
}

/**
 * 测试 6: URL导入（只返回数据）
 */
async function testImportUrl() {
  logInfo('测试 6: URL导入（预览模式）');
  
  try {
    const testUrl = 'https://techcrunch.com/';
    
    const response = await apiCall('POST', '/content-management/import-url', {
      url: testUrl,
      autoFill: false,
    });

    if (response.success && response.data.data) {
      logSuccess('URL导入成功（预览模式）');
      logData('抓取的内容', {
        title: response.data.data.title,
        description: response.data.data.description?.substring(0, 100),
        domain: response.data.data.metadata.domain,
        imagesCount: response.data.data.images?.length || 0,
      });
      return true;
    }

    logError('URL导入失败');
    return false;
  } catch (error) {
    logError('URL导入失败', error);
    return false;
  }
}

/**
 * 测试 7: URL导入并自动创建内容
 */
async function testImportUrlAutoFill() {
  logInfo('测试 7: URL导入并自动创建');
  
  try {
    const testUrl = 'https://www.theverge.com/tech';
    
    const response = await apiCall('POST', '/content-management/import-url', {
      url: testUrl,
      autoFill: true,
    });

    if (response.success && response.data.content) {
      logSuccess('URL导入并自动创建成功');
      logData('创建的内容', {
        id: response.data.content.id,
        title: response.data.content.title,
        url: response.data.content.url,
      });
      return true;
    }

    logError('URL导入并自动创建失败');
    return false;
  } catch (error) {
    logError('URL导入并自动创建失败', error);
    return false;
  }
}

/**
 * 测试 8: 批量导入URLs
 */
async function testBatchImportUrls() {
  logInfo('测试 8: 批量导入URLs');
  
  try {
    const response = await apiCall('POST', '/content-management/batch-import', {
      type: 'urls',
      data: {
        urls: [
          'https://arstechnica.com/',
          'https://www.wired.com/',
        ],
      },
      options: {
        autoApprove: false,
        defaultCategory: 'TECH',
        defaultTags: ['科技', '新闻'],
      },
    });

    if (response.success && response.data.id) {
      batchImportId = response.data.id;
      logSuccess('批量导入任务创建成功');
      logData('导入任务', {
        batchId: response.data.id,
        totalItems: response.data.totalItems,
        status: response.data.status,
      });
      return true;
    }

    logError('批量导入失败');
    return false;
  } catch (error) {
    logError('批量导入失败', error);
    return false;
  }
}

/**
 * 测试 9: 查询批量导入状态
 */
async function testGetBatchImportStatus() {
  logInfo('测试 9: 查询批量导入状态');
  
  if (!batchImportId) {
    logError('没有批量导入ID，跳过测试');
    return false;
  }

  try {
    // 等待几秒让批量导入处理
    await new Promise(resolve => setTimeout(resolve, 3000));

    const response = await apiCall('GET', `/content-management/batch-import/${batchImportId}`);

    if (response.success && response.data) {
      logSuccess('查询批量导入状态成功');
      logData('导入状态', {
        status: response.data.status,
        totalItems: response.data.totalItems,
        successCount: response.data.successCount,
        failedCount: response.data.failedCount,
      });
      return true;
    }

    logError('查询批量导入状态失败');
    return false;
  } catch (error) {
    logError('查询批量导入状态失败', error);
    return false;
  }
}

/**
 * 测试 10: 内容验证
 */
async function testValidateContent() {
  logInfo('测试 10: 内容验证');
  
  try {
    const response = await apiCall('POST', '/content-management/validate', {
      title: '测试标题',
      description: '测试描述',
      content: '测试内容',
      url: 'https://example.com/test',
      category: 'TEST',
      tags: ['测试'],
    });

    if (response.success && response.data) {
      logSuccess('内容验证成功');
      logData('验证结果', {
        valid: response.data.valid,
        issuesCount: response.data.issues.length,
        warningsCount: response.data.warnings.length,
        suggestionsCount: response.data.suggestions.length,
      });
      
      if (response.data.issues.length > 0) {
        logData('问题', response.data.issues);
      }
      if (response.data.warnings.length > 0) {
        logData('警告', response.data.warnings);
      }
      if (response.data.suggestions.length > 0) {
        logData('建议', response.data.suggestions);
      }
      
      return true;
    }

    logError('内容验证失败');
    return false;
  } catch (error) {
    logError('内容验证失败', error);
    return false;
  }
}

/**
 * 测试 11: 更新模板
 */
async function testUpdateTemplate() {
  logInfo('测试 11: 更新模板');
  
  if (!createdTemplateId) {
    logError('没有创建的模板ID，跳过测试');
    return false;
  }

  try {
    const response = await apiCall('PATCH', `/content-management/templates/${createdTemplateId}`, {
      description: '已更新的模板描述',
    });

    if (response.success && response.data) {
      logSuccess('更新模板成功');
      logData('更新后的模板', {
        id: response.data.id,
        description: response.data.description,
      });
      return true;
    }

    logError('更新模板失败');
    return false;
  } catch (error) {
    logError('更新模板失败', error);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log(colors.bold.blue('\n=== Story 3.3: 手工内容管理API集成测试 ===\n'));

  const tests = [
    { name: '用户登录', fn: testLogin },
    { name: '获取内置模板', fn: testGetBuiltInTemplates },
    { name: '创建自定义模板', fn: testCreateTemplate },
    { name: '获取模板列表', fn: testGetTemplates },
    { name: '创建手工内容', fn: testCreateManualContent },
    { name: 'URL导入（预览）', fn: testImportUrl },
    { name: 'URL导入并创建', fn: testImportUrlAutoFill },
    { name: '批量导入URLs', fn: testBatchImportUrls },
    { name: '查询批量导入状态', fn: testGetBatchImportStatus },
    { name: '内容验证', fn: testValidateContent },
    { name: '更新模板', fn: testUpdateTemplate },
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const test of tests) {
    console.log(colors.bold(`\n--- ${test.name} ---`));
    const result = await test.fn();
    if (result) {
      passedCount++;
    } else {
      failedCount++;
    }
    // 每个测试之间稍微暂停
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(colors.bold.blue('\n=== 测试总结 ==='));
  console.log(colors.green(`✓ 通过: ${passedCount}/${tests.length}`));
  if (failedCount > 0) {
    console.log(colors.red(`✗ 失败: ${failedCount}/${tests.length}`));
  }
  
  console.log(colors.bold.blue('\n=== 创建的资源 ==='));
  if (createdTemplateId) {
    console.log(colors.yellow(`模板ID: ${createdTemplateId}`));
  }
  if (createdContentId) {
    console.log(colors.yellow(`内容ID: ${createdContentId}`));
  }
  if (batchImportId) {
    console.log(colors.yellow(`批量导入ID: ${batchImportId}`));
  }

  process.exit(failedCount > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch(error => {
  console.error(colors.red('测试运行失败:'), error);
  process.exit(1);
});

