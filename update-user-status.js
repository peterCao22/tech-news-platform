// 更新用户状态脚本
const { PrismaClient } = require('./src/generated');

const prisma = new PrismaClient();

async function updateUserStatus() {
  try {
    // 更新所有PENDING用户为ACTIVE状态
    const result = await prisma.user.updateMany({
      where: {
        status: 'PENDING'
      },
      data: {
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    });
    
    console.log(`已更新 ${result.count} 个用户状态为ACTIVE`);
    
    // 将admin@test.com用户设置为ADMIN角色
    const adminUser = await prisma.user.update({
      where: {
        email: 'admin@test.com'
      },
      data: {
        role: 'ADMIN'
      }
    });
    
    console.log(`已将用户 ${adminUser.email} 设置为ADMIN角色`);
    
  } catch (error) {
    console.error('更新用户状态失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserStatus();
