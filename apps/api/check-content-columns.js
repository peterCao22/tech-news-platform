/**
 * 检查content表的实际列结构
 */

require('dotenv').config();
const { PrismaClient } = require('@tech-news-platform/database');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    console.log('=== 检查sources表的列结构 ===\n');
    
    const sourcesColumns = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sources'
      ORDER BY ordinal_position
    `;
    
    console.log('Sources表的列：\n');
    sourcesColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n总共', sourcesColumns.length, '列\n');
    
    console.log('=== 检查content表的列结构 ===\n');
    
    const contentColumns = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'content'
      ORDER BY ordinal_position
    `;
    
    console.log('Content表的列：\n');
    contentColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n总共', contentColumns.length, '列');
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();

