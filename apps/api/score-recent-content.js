/**
 * 为最近的内容批量评分
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

async function scoreRecentContent() {
  console.log('🚀 为最近内容批量评分...\n');

  try {
    const token = await login();
    console.log('✅ 登录成功\n');

    // 获取过去7天的未评分内容
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const contents = await db.content.findMany({
      where: {
        status: { notIn: ['ARCHIVED', 'REJECTED'] },
        createdAt: { gte: sevenDaysAgo },
        contentScore: null
      },
      take: 100, // 评分100条
      select: {
        id: true,
        title: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 找到 ${contents.length} 条未评分内容`);
    console.log(`   时间范围: ${sevenDaysAgo.toISOString()} 至今\n`);

    if (contents.length === 0) {
      console.log('⚠️  没有需要评分的内容');
      return;
    }

    // 批量评分
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

    // 统计
    const totalScored = await db.contentScore.count();
    const recentScored = await db.content.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        contentScore: { isNot: null }
      }
    });

    console.log(`\n📈 统计:`);
    console.log(`   过去7天已评分: ${recentScored} 条`);
    console.log(`   总计已评分: ${totalScored} 条`);
    
    if (recentScored >= 10) {
      console.log(`\n🎉 过去7天已有${recentScored}条评分内容，足够生成TOP10！`);
    } else {
      console.log(`\n⚠️  过去7天只有${recentScored}条评分内容，建议继续评分`);
    }

  } catch (error) {
    console.error('❌ 评分失败:', error.response?.data || error.message);
  } finally {
    await db.$disconnect();
  }
}

scoreRecentContent();

