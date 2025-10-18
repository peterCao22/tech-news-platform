/**
 * 执行全文搜索数据库迁移
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@tech-news-platform/database');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 开始执行全文搜索数据库迁移...\n');
    
    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'migrations', 'add-fulltext-search.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📄 SQL文件已读取');
    console.log(`   文件路径: ${sqlPath}`);
    console.log(`   文件大小: ${sql.length} 字符\n`);
    
    // 分割SQL语句（按分号分隔，但保留函数定义）
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    
    const lines = sql.split('\n');
    
    for (const line of lines) {
      // 跳过注释
      if (line.trim().startsWith('--')) {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // 检查是否进入函数定义
      if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('CREATE FUNCTION')) {
        inFunction = true;
      }
      
      // 检查函数定义是否结束
      if (inFunction && line.includes('$$ LANGUAGE')) {
        inFunction = false;
        statements.push(currentStatement);
        currentStatement = '';
        continue;
      }
      
      // 普通语句以分号结束
      if (!inFunction && line.trim().endsWith(';')) {
        statements.push(currentStatement);
        currentStatement = '';
      }
    }
    
    // 过滤掉空语句
    const validStatements = statements.filter(s => s.trim().length > 0);
    
    console.log(`📊 解析得到 ${validStatements.length} 条SQL语句\n`);
    
    // 执行每条SQL语句
    for (let i = 0; i < validStatements.length; i++) {
      const statement = validStatements[i];
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      
      try {
        console.log(`   [${i + 1}/${validStatements.length}] 执行: ${preview}...`);
        await prisma.$executeRawUnsafe(statement);
        console.log(`   ✅ 成功`);
      } catch (error) {
        // 某些语句可能因为已存在而失败，这是正常的
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ⚠️  跳过（已存在）`);
        } else {
          console.log(`   ❌ 失败: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ 数据库迁移完成！\n');
    
    // 验证设置
    console.log('🔍 验证全文搜索设置...\n');
    
    // 检查索引
    const indexResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE tablename = 'content' AND indexname = 'content_search_vector_idx'
    `;
    console.log(`   - GIN索引: ${indexResult[0]?.count || 0} 个`);
    
    // 检查触发器
    const triggerResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM pg_trigger 
      WHERE tgname = 'content_search_vector_update'
    `;
    console.log(`   - 触发器: ${triggerResult[0]?.count || 0} 个`);
    
    // 检查已索引的内容数量
    const vectorResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "content"
      WHERE search_vector IS NOT NULL
    `;
    console.log(`   - 已索引内容: ${vectorResult[0]?.count || 0} 条\n`);
    
    // 测试搜索
    console.log('🧪 测试全文搜索功能...\n');
    
    const testResult = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        ts_rank(search_vector, to_tsquery('english', 'AI')) as relevance
      FROM content
      WHERE search_vector @@ to_tsquery('english', 'AI')
      ORDER BY relevance DESC
      LIMIT 3
    `;
    
    if (testResult.length > 0) {
      console.log(`   ✅ 搜索测试成功，找到 ${testResult.length} 条结果`);
      testResult.forEach((row, i) => {
        console.log(`      ${i + 1}. ${row.title} (相关性: ${parseFloat(row.relevance).toFixed(4)})`);
      });
    } else {
      console.log(`   ⚠️  未找到包含"AI"的内容`);
    }
    
    console.log('\n🎉 全文搜索迁移和验证完成！');
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行迁移
runMigration();

