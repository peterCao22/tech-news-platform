// 科技新闻聚合平台 - Alpha Vantage API测试脚本
// 测试Alpha Vantage API集成功能

// 加载环境变量（从项目根目录）
require('dotenv').config({ path: '../../.env' });

const { ApiConfigurationService, ApiProvider } = require('./dist/services/api-configuration.service');
const { ApiAuthType, ApiConfigStatus } = require('@tech-news-platform/database');

async function testAlphaVantageIntegration() {
  console.log('🧪 开始测试Alpha Vantage API集成...\n');

  try {
    // 1. 创建Alpha Vantage API配置
    console.log('1. 创建Alpha Vantage API配置...');
    
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    console.log('apiKey:', apiKey)

    const configData = {
      name: 'Alpha Vantage - 科技股新闻',
      provider: ApiProvider.ALPHA_VANTAGE,
      baseUrl: 'https://www.alphavantage.co/query',
      authType: ApiAuthType.API_KEY,
      apiKey: apiKey,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        maxRequests: 5,
        windowMs: 60000
      }
    };

    const config = await ApiConfigurationService.createConfiguration(configData);
    console.log('✅ API配置创建成功:', {
      id: config.id,
      name: config.name,
      provider: config.provider
    });

    // 2. 测试API配置
    console.log('\n2. 测试API配置连接...');
    const testResult = await ApiConfigurationService.testConfiguration(config.id);
    console.log('📊 测试结果:', testResult);

    if (!testResult.success) {
      console.log('❌ API配置测试失败，跳过后续测试');
      return;
    }

    // 3. 获取Alpha Vantage客户端
    console.log('\n3. 获取Alpha Vantage客户端...');
    const client = await ApiConfigurationService.getAlphaVantageClient();
    console.log('✅ 客户端获取成功');

    // 4. 测试健康检查
    console.log('\n4. 执行健康检查...');
    const isHealthy = await client.healthCheck();
    console.log('🏥 健康状态:', isHealthy ? '正常' : '异常');

    // 5. 获取科技股新闻
    console.log('\n5. 获取科技股新闻...');
    try {
      const techNews = await client.getStandardizedTechNews(5);
      console.log(`📰 获取到 ${techNews.length} 条科技股新闻:`);
      
      techNews.slice(0, 3).forEach((news, index) => {
        console.log(`\n   ${index + 1}. ${news.title}`);
        console.log(`      来源: ${news.source}`);
        console.log(`      发布时间: ${news.publishedAt.toLocaleString()}`);
        console.log(`      情感评分: ${news.metadata.sentiment.score} (${news.metadata.sentiment.label})`);
        console.log(`      标签: ${news.tags.slice(0, 5).join(', ')}`);
        if (news.metadata.tickers && news.metadata.tickers.length > 0) {
          const topTickers = news.metadata.tickers
            .filter(t => t.relevance > 0.3)
            .slice(0, 3)
            .map(t => `${t.symbol}(${(t.relevance * 100).toFixed(0)}%)`)
            .join(', ');
          if (topTickers) {
            console.log(`      相关股票: ${topTickers}`);
          }
        }
      });
    } catch (error) {
      console.log('❌ 获取科技股新闻失败:', error.message);
    }

    // 6. 获取AI相关新闻
    console.log('\n6. 获取AI相关新闻...');
    try {
      const aiNews = await client.getStandardizedAINews(3);
      console.log(`🤖 获取到 ${aiNews.length} 条AI相关新闻:`);
      
      aiNews.forEach((news, index) => {
        console.log(`\n   ${index + 1}. ${news.title}`);
        console.log(`      来源: ${news.source}`);
        console.log(`      情感: ${news.metadata.sentiment.label}`);
      });
    } catch (error) {
      console.log('❌ 获取AI新闻失败:', error.message);
    }

    // 7. 搜索特定公司新闻
    console.log('\n7. 搜索NVIDIA公司新闻...');
    try {
      const nvidiaNews = await client.searchCompanyNews('NVDA', undefined, undefined, 2);
      console.log(`🏢 获取到 ${nvidiaNews.length} 条NVIDIA新闻:`);
      
      nvidiaNews.forEach((news, index) => {
        console.log(`\n   ${index + 1}. ${news.title}`);
        console.log(`      发布时间: ${news.publishedAt.toLocaleString()}`);
      });
    } catch (error) {
      console.log('❌ 搜索NVIDIA新闻失败:', error.message);
    }

    // 8. 获取API统计信息
    console.log('\n8. 获取API统计信息...');
    const stats = await ApiConfigurationService.getApiStats();
    console.log('📊 API统计:', {
      总配置数: stats.total,
      活跃配置: stats.active,
      总调用次数: stats.totalCalls,
      成功调用: stats.successfulCalls,
      失败调用: stats.failedCalls,
      按提供商分布: stats.byProvider
    });

    // 9. 获取客户端状态
    console.log('\n9. 获取客户端状态...');
    const clientStatus = client.getStatus();
    console.log('🔍 客户端状态:', {
      健康状态: clientStatus.isHealthy ? '正常' : '异常',
      总调用: clientStatus.stats.totalCalls,
      成功调用: clientStatus.stats.successfulCalls,
      失败调用: clientStatus.stats.failedCalls,
      平均响应时间: `${clientStatus.stats.averageResponseTime.toFixed(0)}ms`,
      最后调用时间: clientStatus.stats.lastCallTime?.toLocaleString() || '无'
    });

    console.log('\n✅ Alpha Vantage API集成测试完成！');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    console.error('错误详情:', error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testAlphaVantageIntegration()
    .then(() => {
      console.log('\n🎉 测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testAlphaVantageIntegration };
