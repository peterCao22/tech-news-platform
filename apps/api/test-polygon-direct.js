// 直接测试 Polygon API
require('dotenv').config({ path: '../../.env' });

const axios = require('axios');

async function testPolygonDirect() {
  console.log('🧪 直接测试 Polygon API...\n');

  const apiKey = process.env.POLYGON_IO_API_KEY;
  console.log(`API Key: ${apiKey ? '已设置' : '未设置'}`);

  if (!apiKey) {
    console.log('❌ 请设置 POLYGON_IO_API_KEY 环境变量');
    return;
  }

  try {
    // 测试市场状态端点
    console.log('\n1. 测试市场状态端点...');
    const marketResponse = await axios.get('https://api.polygon.io/v1/marketstatus/now', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 10000
    });
    
    console.log('✅ 市场状态响应:', {
      status: marketResponse.data.status,
      market: marketResponse.data.market,
      serverTime: marketResponse.data.serverTime
    });

    // 测试新闻端点
    console.log('\n2. 测试新闻端点...');
    const newsResponse = await axios.get('https://api.polygon.io/v2/reference/news', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      params: {
        limit: 5
      },
      timeout: 10000
    });
    
    console.log('✅ 新闻响应:', {
      status: newsResponse.data.status,
      count: newsResponse.data.count,
      results: newsResponse.data.results?.length || 0
    });

    if (newsResponse.data.results && newsResponse.data.results.length > 0) {
      console.log('\n📰 第一条新闻:');
      console.log(`   标题: ${newsResponse.data.results[0].title}`);
      console.log(`   发布者: ${newsResponse.data.results[0].publisher?.name}`);
      console.log(`   发布时间: ${newsResponse.data.results[0].published_utc}`);
    }

  } catch (error) {
    console.error('❌ API 测试失败:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

testPolygonDirect()
  .then(() => {
    console.log('\n🎉 测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 测试失败:', error);
    process.exit(1);
  });
