/**
 * 设置测试用户
 * 创建管理员和普通用户用于测试
 */

const { PrismaClient } = require('@tech-news-platform/database');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function setupTestUsers() {
  console.log('开始设置测试用户...\n');

  try {
    // 1. 创建或更新管理员账户
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await db.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        name: 'Test Admin'
      },
      create: {
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        name: 'Test Admin',
        emailVerified: new Date()
      }
    });

    console.log(`✅ 管理员账户已设置:`);
    console.log(`   Email: admin@example.com`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}\n`);

    // 2. 创建或更新编辑账户（EDITOR）
    const editorPassword = await bcrypt.hash('editor123', 10);
    const editor = await db.user.upsert({
      where: { email: 'editor@example.com' },
      update: {
        password: editorPassword,
        role: 'EDITOR',
        status: 'ACTIVE',
        name: 'Test Editor'
      },
      create: {
        email: 'editor@example.com',
        password: editorPassword,
        role: 'EDITOR',
        status: 'ACTIVE',
        name: 'Test Editor',
        emailVerified: new Date()
      }
    });

    console.log(`✅ 编辑账户已设置:`);
    console.log(`   Email: editor@example.com`);
    console.log(`   Password: editor123`);
    console.log(`   Role: ${editor.role}`);
    console.log(`   ID: ${editor.id}\n`);

    // 3. 创建或更新普通用户账户
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await db.user.upsert({
      where: { email: 'user@example.com' },
      update: {
        password: userPassword,
        role: 'USER',
        status: 'ACTIVE',
        name: 'Test User'
      },
      create: {
        email: 'user@example.com',
        password: userPassword,
        role: 'USER',
        status: 'ACTIVE',
        name: 'Test User',
        emailVerified: new Date()
      }
    });

    console.log(`✅ 普通用户账户已设置:`);
    console.log(`   Email: user@example.com`);
    console.log(`   Password: user123`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}\n`);

    console.log('🎉 所有测试用户设置完成！\n');

  } catch (error) {
    console.error('❌ 设置测试用户失败:', error.message);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

setupTestUsers();

