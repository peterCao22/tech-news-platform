/**
 * 批量为内容生成评分
 */

require('dotenv').config({ path: '../../.env' });

const { PrismaClient } = require('@tech-news-platform/database/src/generated');
const axios = require('axios');

const db = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function login() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'admin@mkbl.com',
    password: 'Wm@123456'
  });
  return response.data.data.token;
}

async function batchScoreContent() {
  console.log('🚀 开始批量评分内容...\n');

  try {
    // 1. 登录获取token
    console.log('📝 登录中...');
    const token = await login();
    console.log('✅ 登录成功\n');

    // 2. 获取未评分的内容
    console.log('📊 获取内容列表...');
    const contents = await db.content.findMany({
      where: {
        status: { notIn: ['ARCHIVED', 'REJECTED'] },
        contentScore: null
      },
      take: 50, // 先评分50条
      select: {
        id: true,
        title: true
      }
    });

    console.log(`✅ 找到 ${contents.length} 条未评分内容\n`);

    if (contents.length === 0) {
      console.log('⚠️  所有内容都已评分');
      return;
    }

    // 3. 批量评分
    console.log('⏳ 开始评分...');
    const contentIds = contents.map(c => c.id);
    
    const response = await axios.post(
      `${BASE_URL}/api/content-scoring/batch-score`,
      {
        contentIds,
        forceRecalculate: false
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data.success) {
      const results = response.data.data;
      console.log(`\n✅ 评分完成！`);
      console.log(`   评分数量: ${results.length}`);
      
      if (results.length > 0) {
        console.log(`   平均分: ${(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length).toFixed(2)}`);
        console.log(`   最高分: ${Math.max(...results.map(r => r.totalScore)).toFixed(2)}`);
        console.log(`   最低分: ${Math.min(...results.map(r => r.totalScore)).toFixed(2)}`);
      }
    } else {
      console.error('❌ 评分失败:', response.data.error);
    }

    // 4. 检查总评分数
    const totalScored = await db.contentScore.count();
    console.log(`\n📈 当前已评分内容总数: ${totalScored}`);
    
    if (totalScored < 20) {
      console.log(`\n💡 提示: 需要至少20条评分内容才能生成有意义的TOP10`);
      console.log(`   建议再次运行此脚本，或增加 take 参数`);
    } else {
      console.log(`\n🎉 评分内容充足，可以生成TOP10了！`);
    }

  } catch (error) {
    console.error('❌ 评分失败:', error.response?.data || error.message);
  } finally {
    await db.$disconnect();
  }
}

batchScoreContent();

