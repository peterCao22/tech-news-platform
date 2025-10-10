/**
 * 检查内容和评分状态
 */

require('dotenv').config({ path: '../../.env' });

const { PrismaClient } = require('@tech-news-platform/database/src/generated');
const db = new PrismaClient();

async function checkStatus() {
  console.log('📊 检查数据库内容状态...\n');

  // 1. 检查内容总数
  const totalContent = await db.content.count();
  console.log(`✅ 内容总数: ${totalContent}`);

  // 2. 检查已处理内容
  const processedContent = await db.content.count({
    where: { status: 'PROCESSED' }
  });
  console.log(`✅ 已处理内容: ${processedContent}`);

  // 3. 检查原始内容
  const rawContent = await db.content.count({
    where: { status: 'RAW' }
  });
  console.log(`✅ 原始内容: ${rawContent}`);

  // 4. 检查已评分内容
  const scoredContent = await db.contentScore.count();
  console.log(`✅ 已评分内容: ${scoredContent}`);

  // 5. 检查最近的内容
  const recentContent = await db.content.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      contentScore: {
        select: {
          totalScore: true
        }
      }
    }
  });

  console.log('\n📝 最近5条内容:');
  recentContent.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.title.substring(0, 50)}...`);
    console.log(`     状态: ${c.status}, 评分: ${c.contentScore?.totalScore || '未评分'}`);
  });

  // 6. 建议
  console.log('\n💡 建议:');
  if (totalContent === 0) {
    console.log('  ⚠️  数据库中没有内容，请先运行RSS抓取或Gemini新闻获取');
  } else if (scoredContent === 0) {
    console.log('  ⚠️  内容未评分，请先运行内容评分（Story 2.5）');
  } else if (scoredContent < 20) {
    console.log(`  ⚠️  已评分内容较少（${scoredContent}条），建议至少有20条以上才能生成有意义的TOP10`);
  } else {
    console.log('  ✅ 数据准备充分，可以生成TOP10');
  }

  await db.$disconnect();
}

checkStatus().catch(error => {
  console.error('检查失败:', error);
  process.exit(1);
});

