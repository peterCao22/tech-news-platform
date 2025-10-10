/**
 * 调试TOP10候选内容筛选
 */

require('dotenv').config({ path: '../../.env' });

const { PrismaClient } = require('@tech-news-platform/database/src/generated');
const db = new PrismaClient();

async function debugCandidates() {
  console.log('🔍 调试TOP10候选内容筛选逻辑...\n');

  // 1. 计算时间范围（过去24小时）
  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);

  console.log('📅 时间范围:');
  console.log(`   开始: ${startDate.toISOString()}`);
  console.log(`   结束: ${endDate.toISOString()}\n`);

  // 2. 检查时间范围内的所有内容
  const allContent = await db.content.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });
  console.log(`✅ 时间范围内的所有内容: ${allContent} 条`);

  // 3. 检查状态过滤后的内容
  const validStatusContent = await db.content.count({
    where: {
      status: { notIn: ['ARCHIVED', 'REJECTED'] },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });
  console.log(`✅ 状态有效的内容: ${validStatusContent} 条`);

  // 4. 检查已评分的内容
  const scoredContent = await db.content.findMany({
    where: {
      status: { notIn: ['ARCHIVED', 'REJECTED'] },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      contentScore: true
    }
  });

  const withScore = scoredContent.filter(c => c.contentScore !== null);
  console.log(`✅ 已评分的内容: ${withScore.length} 条`);

  // 5. 检查评分 >= 30 的内容
  const minScoreThreshold = 30;
  const highScoreContent = withScore.filter(c => c.contentScore.totalScore >= minScoreThreshold);
  console.log(`✅ 评分 >= ${minScoreThreshold} 的内容: ${highScoreContent.length} 条\n`);

  // 6. 显示这些内容的详细信息
  if (highScoreContent.length > 0) {
    console.log('📊 候选内容列表:');
    highScoreContent.forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.title.substring(0, 60)}...`);
      console.log(`   ID: ${c.id}`);
      console.log(`   评分: ${c.contentScore.totalScore.toFixed(2)}`);
      console.log(`   创建时间: ${c.createdAt.toISOString()}`);
      console.log(`   状态: ${c.status}`);
    });
  }

  // 7. 分析问题
  console.log('\n' + '='.repeat(60));
  console.log('📋 问题分析:');
  console.log('='.repeat(60));

  if (allContent === 0) {
    console.log('❌ 问题: 过去24小时内没有任何内容被创建');
    console.log('💡 解决: 所有现有内容的创建时间都不在今天');
  } else if (validStatusContent === 0) {
    console.log('❌ 问题: 所有内容都被归档或拒绝了');
  } else if (withScore.length === 0) {
    console.log('❌ 问题: 时间范围内的内容都没有评分');
    console.log('💡 解决: 需要为这些内容生成评分');
  } else if (highScoreContent.length < 10) {
    console.log(`⚠️  问题: 符合条件的内容只有 ${highScoreContent.length} 条`);
    console.log('💡 原因: 过去24小时内创建并评分的内容不足10条');
    console.log('\n🔧 解决方案:');
    console.log('   方案1: 扩大时间范围（修改为过去7天或30天）');
    console.log('   方案2: 为更多现有内容生成评分');
    console.log('   方案3: 等待更多新内容被抓取和评分');
  } else {
    console.log('✅ 候选内容充足，应该能生成完整的TOP10');
  }

  // 8. 检查所有已评分内容（不限时间）
  console.log('\n' + '='.repeat(60));
  console.log('📊 全部已评分内容统计（不限时间）:');
  console.log('='.repeat(60));
  
  const allScoredContent = await db.content.count({
    where: {
      status: { notIn: ['ARCHIVED', 'REJECTED'] },
      contentScore: { isNot: null }
    }
  });
  console.log(`✅ 总共有 ${allScoredContent} 条已评分内容`);

  if (allScoredContent >= 10) {
    console.log('\n💡 建议: 修改时间范围逻辑，使用更长的时间窗口');
    console.log('   当前: 过去24小时（今天 00:00 ~ 23:59）');
    console.log('   建议: 过去7天或使用所有已评分内容');
  }

  await db.$disconnect();
}

debugCandidates().catch(error => {
  console.error('调试失败:', error);
  process.exit(1);
});

