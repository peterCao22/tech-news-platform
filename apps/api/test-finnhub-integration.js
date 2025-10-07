// 科技新闻聚合平台 - Finnhub API 集成测试脚本
// 测试 Finnhub API 集成功能

// 加载环境变量（从项目根目录）
require('dotenv').config({ path: '../../.env' });

const { ApiConfigurationService, ApiProvider } = require('./dist/services/api-configuration.service');
const { ApiAuthType, ApiConfigStatus } = require('@tech-news-platform/database');
const { schedulerService } = require('./dist/services/scheduler.service');

async function testFinnhubIntegration() {
  console.log('🧪 开始测试 Finnhub API 集成...\n');

  try {
    // 1. 检查环境变量
    console.log('1. 检查环境变量:');
    const apiKey = process.env.FINNHUB_IO_API_KEY;
    console.log(`   FINNHUB_IO_API_KEY: ${apiKey ? '已设置' : '未设置'}`);

    if (!apiKey) {
      console.log('❌ 请设置 FINNHUB_IO_API_KEY 环境变量');
      return;
    }

    // 2. 创建 Finnhub API 配置
    console.log('\n2. 创建 Finnhub API 配置...');
    const configData = {
      name: 'Finnhub - 金融新闻',
      provider: ApiProvider.FINNHUB,
      baseUrl: 'https://finnhub.io/api/v1',
      authType: ApiAuthType.API_KEY,
      apiKey: apiKey,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        maxRequests: 60,
        windowMs: 60000
      }
    };

    const config = await ApiConfigurationService.createConfiguration(configData);
    console.log('✅ API 配置创建成功:', {
      id: config.id,
      name: config.name,
      provider: config.provider
    });

    // 3. 测试 API 配置
    console.log('\n3. 测试 API 配置连接...');
    const testResult = await ApiConfigurationService.testConfiguration(config.id);
    console.log('📊 测试结果:', testResult);

    if (!testResult.success) {
      console.log('❌ API 配置测试失败，跳过后续测试');
      return;
    }

    // 4. 手动触发 Finnhub 数据获取任务
    console.log('\n4. 手动触发 Finnhub 数据获取任务...');
    const fetchResult = await schedulerService.triggerFinnhubFetch();
    console.log('✅ Finnhub 数据获取任务完成:', fetchResult);

    console.log('\n✅ Finnhub API 集成测试完成！');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    console.error('错误详情:', error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testFinnhubIntegration()
    .then(() => {
      console.log('\n🎉 测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testFinnhubIntegration };
