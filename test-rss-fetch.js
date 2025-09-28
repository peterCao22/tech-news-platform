// 测试RSS抓取脚本
const { rssService } = require('./apps/api/dist/services/rss.service');

async function testRSSFetch() {
  console.log('🚀 开始测试RSS抓取...');
  
  try {
    const result = await rssService.fetchAllActiveSources();
    console.log('✅ RSS抓取完成:', result);
  } catch (error) {
    console.error('❌ RSS抓取失败:', error);
  }
}

testRSSFetch();
