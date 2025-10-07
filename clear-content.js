const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearRecentContent() {
  try {
    console.log('🧹 开始清理最近24小时的内容...');
    
    // 清理最近24小时的内容
    const result = await prisma.content.deleteMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时前
        }
      }
    });
    
    console.log(`✅ 已清理 ${result.count} 条内容`);
    console.log('🎯 现在可以重新测试RSS抓取和过滤算法了！');
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearRecentContent();
