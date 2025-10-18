/**
 * 完成全文搜索设置 - 补充缺失的部分
 */

const { PrismaClient } = require('@tech-news-platform/database');
const prisma = new PrismaClient();

async function completeSetup() {
  try {
    console.log('🔧 完成全文搜索设置...\n');
    
    // 1. 添加search_vector列（如果不存在）
    console.log('1. 检查并添加 search_vector 列...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "content" 
        ADD COLUMN IF NOT EXISTS "search_vector" tsvector
      `);
      console.log('   ✅ search_vector 列已添加\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  search_vector 列已存在\n');
      } else {
        console.log('   ❌', error.message, '\n');
      }
    }
    
    // 2. 创建GIN索引
    console.log('2. 创建 GIN 索引...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "content_search_vector_idx" 
        ON "content" USING gin("search_vector")
      `);
      console.log('   ✅ GIN 索引已创建\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  GIN 索引已存在\n');
      } else {
        console.log('   ❌', error.message, '\n');
      }
    }
    
    // 3. 验证设置
    console.log('3. 验证全文搜索设置...\n');
    
    // 检查列是否存在
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'content' 
        AND column_name = 'search_vector'
    `;
    console.log('   - search_vector 列:', columnCheck.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    // 检查索引
    const indexCheck = await prisma.$queryRaw`
      SELECT indexname
      FROM pg_indexes 
      WHERE tablename = 'content' 
        AND indexname = 'content_search_vector_idx'
    `;
    console.log('   - GIN 索引:', indexCheck.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    // 检查触发器
    const triggerCheck = await prisma.$queryRaw`
      SELECT tgname
      FROM pg_trigger 
      WHERE tgname = 'content_search_vector_update'
    `;
    console.log('   - 自动更新触发器:', triggerCheck.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    // 检查已索引的内容数量
    const vectorCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "content"
      WHERE search_vector IS NOT NULL
    `;
    console.log(`   - 已索引内容数: ${vectorCount[0]?.count || 0} 条\n`);
    
    // 4. 测试全文搜索
    console.log('4. 测试全文搜索功能...\n');
    
    try {
      const testResult = await prisma.$queryRaw`
        SELECT 
          id,
          title,
          ts_rank(search_vector, to_tsquery('english', 'AI')) as relevance
        FROM "content"
        WHERE search_vector @@ to_tsquery('english', 'AI')
          AND status = 'PROCESSED'
        ORDER BY relevance DESC
        LIMIT 3
      `;
      
      if (testResult.length > 0) {
        console.log(`   ✅ 搜索测试成功！找到 ${testResult.length} 条结果:\n`);
        testResult.forEach((row, i) => {
          const relevance = parseFloat(row.relevance || 0).toFixed(4);
          console.log(`      ${i + 1}. [相关性: ${relevance}] ${row.title.substring(0, 60)}`);
        });
      } else {
        console.log(`   ⚠️  未找到包含"AI"的内容\n`);
      }
    } catch (error) {
      console.log(`   ❌ 搜索测试失败: ${error.message}\n`);
    }
    
    console.log('\n✅ 全文搜索设置完成！');
    
  } catch (error) {
    console.error('\n❌ 设置失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

completeSetup();

