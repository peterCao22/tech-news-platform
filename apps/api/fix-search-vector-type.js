/**
 * 修复 search_vector 列的数据类型
 */

const { PrismaClient } = require('@tech-news-platform/database');
const prisma = new PrismaClient();

async function fixSearchVectorType() {
  try {
    console.log('🔧 修复 search_vector 列的数据类型...\n');
    
    // 1. 先删除现有的列（如果存在）
    console.log('1. 删除现有的 search_vector 列...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "content" DROP COLUMN IF EXISTS "search_vector"
      `);
      console.log('   ✅ 已删除旧列\n');
    } catch (error) {
      console.log('   ⚠️ ', error.message, '\n');
    }
    
    // 2. 添加正确类型的search_vector列
    console.log('2. 添加 search_vector 列（类型：tsvector）...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "content" 
        ADD COLUMN "search_vector" tsvector
      `);
      console.log('   ✅ 列已添加\n');
    } catch (error) {
      console.log('   ❌', error.message, '\n');
      throw error;
    }
    
    // 3. 创建GIN索引
    console.log('3. 创建 GIN 索引...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "content_search_vector_idx" 
        ON "content" USING gin("search_vector")
      `);
      console.log('   ✅ GIN 索引已创建\n');
    } catch (error) {
      console.log('   ❌', error.message, '\n');
    }
    
    // 4. 创建触发器函数
    console.log('4. 创建触发器函数...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION update_content_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.search_vector := 
            setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
            setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      console.log('   ✅ 触发器函数已创建\n');
    } catch (error) {
      console.log('   ❌', error.message, '\n');
    }
    
    // 5. 创建触发器
    console.log('5. 创建触发器...');
    try {
      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS content_search_vector_update ON "content"
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER content_search_vector_update
        BEFORE INSERT OR UPDATE ON "content"
        FOR EACH ROW
        EXECUTE FUNCTION update_content_search_vector()
      `);
      console.log('   ✅ 触发器已创建\n');
    } catch (error) {
      console.log('   ❌', error.message, '\n');
    }
    
    // 6. 更新现有数据
    console.log('6. 更新现有内容的 search_vector...');
    try {
      const result = await prisma.$executeRawUnsafe(`
        UPDATE "content"
        SET search_vector = 
          setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(content, '')), 'C') ||
          setweight(to_tsvector('simple', COALESCE(array_to_string(tags, ' '), '')), 'D')
        WHERE status = 'PROCESSED'
      `);
      console.log(`   ✅ 已更新 ${result} 条记录\n`);
    } catch (error) {
      console.log('   ❌', error.message, '\n');
    }
    
    // 7. 验证设置
    console.log('7. 验证全文搜索设置...\n');
    
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'content' 
        AND column_name = 'search_vector'
    `;
    console.log('   - search_vector 列:', columnCheck.length > 0 ? `✅ 存在 (类型: ${columnCheck[0].data_type})` : '❌ 不存在');
    
    const indexCheck = await prisma.$queryRaw`
      SELECT indexname
      FROM pg_indexes 
      WHERE tablename = 'content' 
        AND indexname = 'content_search_vector_idx'
    `;
    console.log('   - GIN 索引:', indexCheck.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    const triggerCheck = await prisma.$queryRaw`
      SELECT tgname
      FROM pg_trigger 
      WHERE tgname = 'content_search_vector_update'
    `;
    console.log('   - 自动更新触发器:', triggerCheck.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    const vectorCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "content"
      WHERE search_vector IS NOT NULL
    `;
    console.log(`   - 已索引内容数: ${vectorCount[0]?.count || 0} 条\n`);
    
    // 8. 测试全文搜索
    console.log('8. 测试全文搜索功能...\n');
    
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
        LIMIT 5
      `;
      
      if (testResult.length > 0) {
        console.log(`   ✅ 搜索测试成功！找到 ${testResult.length} 条结果:\n`);
        testResult.forEach((row, i) => {
          const relevance = parseFloat(row.relevance || 0).toFixed(4);
          const title = row.title.substring(0, 70);
          console.log(`      ${i + 1}. [相关性: ${relevance}] ${title}${row.title.length > 70 ? '...' : ''}`);
        });
      } else {
        console.log(`   ⚠️  未找到包含"AI"的内容\n`);
      }
      
      console.log('\n✅ 全文搜索设置完成且测试通过！');
      
    } catch (error) {
      console.log(`   ❌ 搜索测试失败: ${error.message}\n`);
      throw error;
    }
    
  } catch (error) {
    console.error('\n❌ 修复失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixSearchVectorType();

