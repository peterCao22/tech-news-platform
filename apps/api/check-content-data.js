/**
 * 检查数据库中的内容数据
 */

require('dotenv').config();
const { PrismaClient } = require('@tech-news-platform/database');
const prisma = new PrismaClient();

async function checkContentData() {
  console.log('='.repeat(60));
  console.log('数据库内容数据检查');
  console.log('='.repeat(60));

  try {
    // 1. 检查总内容数
    const totalCount = await prisma.content.count();
    console.log(`\n📊 总内容数: ${totalCount}`);

    if (totalCount === 0) {
      console.log('\n❌ 数据库中没有任何内容！');
      console.log('\n建议: 先运行 RSS 数据采集或手工添加内容');
      return;
    }

    // 2. 按状态统计
    console.log('\n📈 内容状态分布:');
    const statusCounts = await prisma.content.groupBy({
      by: ['status'],
      _count: true
    });
    statusCounts.forEach(item => {
      console.log(`   - ${item.status}: ${item._count} 条`);
    });

    // 3. 检查有评分的内容
    const withScore = await prisma.content.count({
      where: {
        score: { not: null }
      }
    });
    console.log(`\n⭐ 有评分的内容: ${withScore} 条`);

    // 4. 检查高分内容 (>= 60)
    const highScore = await prisma.content.count({
      where: {
        score: { gte: 60 }
      }
    });
    console.log(`   - 评分 >= 60: ${highScore} 条`);

    const veryHighScore = await prisma.content.count({
      where: {
        score: { gte: 70 }
      }
    });
    console.log(`   - 评分 >= 70: ${veryHighScore} 条`);

    // 5. 检查 PROCESSED 状态的内容
    const processedCount = await prisma.content.count({
      where: {
        status: 'PROCESSED'
      }
    });
    console.log(`\n✅ PROCESSED 状态: ${processedCount} 条`);

    // 6. 检查最近的内容
    const recentContents = await prisma.content.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        score: true,
        publishedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\n📰 最近添加的5条内容:');
    recentContents.forEach((c, i) => {
      console.log(`\n   ${i + 1}. ${c.title.substring(0, 50)}...`);
      console.log(`      ID: ${c.id}`);
      console.log(`      状态: ${c.status}`);
      console.log(`      评分: ${c.score || '无'}`);
      console.log(`      发布时间: ${c.publishedAt ? new Date(c.publishedAt).toISOString() : '无'}`);
      console.log(`      创建时间: ${new Date(c.createdAt).toISOString()}`);
    });

    // 7. 检查符合TOP10条件的内容
    const eligibleForTop10 = await prisma.content.count({
      where: {
        status: 'PROCESSED',
        score: { gte: 60 },
        publishedAt: { not: null }
      }
    });
    console.log(`\n🏆 符合TOP10条件的内容: ${eligibleForTop10} 条`);
    console.log(`   (条件: status=PROCESSED, score>=60, publishedAt不为空)`);

    // 8. 如果有符合条件的内容，显示几条
    if (eligibleForTop10 > 0) {
      const samples = await prisma.content.findMany({
        where: {
          status: 'PROCESSED',
          score: { gte: 60 },
          publishedAt: { not: null }
        },
        select: {
          title: true,
          score: true,
          publishedAt: true
        },
        orderBy: { score: 'desc' },
        take: 3
      });

      console.log('\n   示例内容:');
      samples.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.title.substring(0, 40)}... (评分: ${s.score}, 发布: ${new Date(s.publishedAt).toLocaleDateString()})`);
      });
    }

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
}

checkContentData();

