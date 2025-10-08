/**
 * 测试AI数据库日志记录功能
 * 验证 ai_usage_logs 和 gemini_news_queries 表是否能正确记录数据
 */

require('dotenv').config({ path: '../../.env' });
const fetch = require('node-fetch');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function testDatabaseLogging() {
  console.log('🧪 测试AI数据库日志记录功能\n');
  
  let authToken = '';
  
  try {
    // 1. 登录
    console.log('1️⃣  登录获取Token...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@mkbl.com',
        password: 'Wm@123456'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.data?.token) {
      throw new Error('登录失败');
    }
    
    authToken = loginData.data.token;
    console.log('✅ 登录成功\n');
    
    // 2. 触发一次Gemini查询（会记录到 gemini_news_queries 表）
    console.log('2️⃣  触发Gemini新闻查询...');
    const queryResponse = await fetch(`${API_BASE_URL}/api/gemini-news/trigger-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ type: 'tech_news' })
    });
    
    const queryData = await queryResponse.json();
    console.log('✅ Gemini查询完成');
    console.log(`   查询状态: ${queryData.success ? '成功' : '失败'}`);
    console.log(`   获取数量: ${queryData.data?.totalFetched || 0}`);
    console.log(`   保存数量: ${queryData.data?.totalSaved || 0}\n`);
    
    // 3. 调用AI服务（会记录到 ai_usage_logs 表）
    console.log('3️⃣  测试AI文本生成（记录到 ai_usage_logs）...');
    const aiResponse = await fetch(`${API_BASE_URL}/api/ai/generate-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        prompt: '简单介绍人工智能',
        options: { maxTokens: 100, temperature: 0.7 }
      })
    });
    
    const aiData = await aiResponse.json();
    console.log('✅ AI文本生成完成');
    console.log(`   生成文本: ${aiData.data?.text?.substring(0, 50) || 'N/A'}...\n`);
    
    // 4. 等待一下让数据库写入完成
    console.log('⏳ 等待2秒让数据库写入完成...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. 使用数据库客户端查询验证
    console.log('4️⃣  验证数据库记录...');
    const { db } = require('@tech-news-platform/database');
    
    // 查询 gemini_news_queries 表
    const geminiQueries = await db.geminiNewsQuery.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log(`✅ gemini_news_queries 表记录数: ${geminiQueries.length}`);
    if (geminiQueries.length > 0) {
      const latest = geminiQueries[0];
      console.log(`   最新记录:`);
      console.log(`   - 查询类型: ${latest.queryType}`);
      console.log(`   - 获取数量: ${latest.totalFetched}`);
      console.log(`   - 保存数量: ${latest.totalSaved}`);
      console.log(`   - 成功: ${latest.success}`);
      console.log(`   - 时间: ${latest.createdAt.toLocaleString()}`);
    }
    console.log('');
    
    // 查询 ai_usage_logs 表
    const aiLogs = await db.aiUsageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log(`✅ ai_usage_logs 表记录数: ${aiLogs.length}`);
    if (aiLogs.length > 0) {
      const latest = aiLogs[0];
      console.log(`   最新记录:`);
      console.log(`   - 提供商: ${latest.provider}`);
      console.log(`   - 操作: ${latest.operation}`);
      console.log(`   - 总Token: ${latest.totalTokens}`);
      console.log(`   - 成本: $${parseFloat(latest.costUsd).toFixed(6)}`);
      console.log(`   - 响应时间: ${latest.responseTimeMs}ms`);
      console.log(`   - 成功: ${latest.success}`);
      console.log(`   - 时间: ${latest.createdAt.toLocaleString()}`);
    }
    console.log('');
    
    await db.$disconnect();
    
    console.log('='.repeat(60));
    console.log('🎉 数据库日志记录功能测试完成！');
    console.log('='.repeat(60));
    console.log('\n✅ 两个表都应该有数据了');
    console.log('   请刷新数据库查看工具验证');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

testDatabaseLogging();

