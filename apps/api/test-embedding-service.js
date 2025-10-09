/**
 * Embedding Service 测试脚本
 * 测试 Gemini Embedding API 的向量化功能
 */

require('dotenv').config({ path: '../../.env' });

async function testEmbeddingService() {
  console.log('\n🧪 Embedding Service 测试');
  console.log('='.repeat(60));

  // 动态导入 TypeScript 模块
  const { embeddingService } = await import('./dist/services/embedding.service.js');

  const tests = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // 测试1: 生成单个文本向量
  console.log('\n📝 测试1: 生成单个文本向量');
  console.log('-'.repeat(60));
  tests.total++;
  try {
    const text = "What is the meaning of life?";
    console.log(`输入文本: "${text}"`);
    
    const startTime = Date.now();
    const embedding = await embeddingService.generateEmbedding(text);
    const duration = Date.now() - startTime;
    
    console.log(`✅ 向量生成成功`);
    console.log(`   维度: ${embedding.length}`);
    console.log(`   前5个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`   耗时: ${duration}ms`);
    tests.passed++;
  } catch (error) {
    console.log(`❌ 测试失败:`, error.message);
    tests.failed++;
  }

  // 测试2: 批量生成向量
  console.log('\n📝 测试2: 批量生成向量');
  console.log('-'.repeat(60));
  tests.total++;
  try {
    const texts = [
      "What is the meaning of life?",
      "What is the purpose of existence?",
      "How do I bake a cake?"
    ];
    console.log(`输入文本数: ${texts.length}`);
    
    const startTime = Date.now();
    const embeddings = await embeddingService.generateEmbeddings(texts);
    const duration = Date.now() - startTime;
    
    console.log(`✅ 批量向量生成成功`);
    console.log(`   返回向量数: ${embeddings.length}`);
    console.log(`   向量维度: ${embeddings[0].length}`);
    console.log(`   耗时: ${duration}ms`);
    tests.passed++;
    
    // 保存embeddings供下一个测试使用
    global.testEmbeddings = embeddings;
    global.testTexts = texts;
  } catch (error) {
    console.log(`❌ 测试失败:`, error.message);
    tests.failed++;
  }

  // 测试3: 计算余弦相似度
  console.log('\n📝 测试3: 计算余弦相似度');
  console.log('-'.repeat(60));
  tests.total++;
  try {
    if (!global.testEmbeddings || global.testEmbeddings.length < 3) {
      throw new Error('需要先运行测试2');
    }

    const embeddings = global.testEmbeddings;
    const texts = global.testTexts;

    console.log('\n相似度矩阵:');
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const similarity = embeddingService.cosineSimilarity(embeddings[i], embeddings[j]);
        console.log(`\n"${texts[i].substring(0, 30)}..."`);
        console.log(`vs`);
        console.log(`"${texts[j].substring(0, 30)}..."`);
        console.log(`相似度: ${similarity.toFixed(2)}%`);
      }
    }

    console.log(`\n✅ 相似度计算成功`);
    tests.passed++;
  } catch (error) {
    console.log(`❌ 测试失败:`, error.message);
    tests.failed++;
  }

  // 测试4: 直接计算两个文本的相似度
  console.log('\n📝 测试4: 直接计算文本相似度');
  console.log('-'.repeat(60));
  tests.total++;
  try {
    const text1 = "Apple announces new iPhone with advanced AI features";
    const text2 = "Apple unveils latest iPhone model featuring AI capabilities";
    
    console.log(`文本1: "${text1}"`);
    console.log(`文本2: "${text2}"`);
    
    const startTime = Date.now();
    const similarity = await embeddingService.calculateTextSimilarity(text1, text2);
    const duration = Date.now() - startTime;
    
    console.log(`✅ 相似度: ${similarity.toFixed(2)}%`);
    console.log(`   耗时: ${duration}ms`);
    console.log(`   ${similarity >= 75 ? '判定为重复' : '判定为不重复'} (阈值: 75%)`);
    tests.passed++;
  } catch (error) {
    console.log(`❌ 测试失败:`, error.message);
    tests.failed++;
  }

  // 测试5: 不相似文本测试
  console.log('\n📝 测试5: 不相似文本测试');
  console.log('-'.repeat(60));
  tests.total++;
  try {
    const text1 = "Apple announces new iPhone with advanced AI features";
    const text2 = "How to bake a chocolate cake at home";
    
    console.log(`文本1: "${text1}"`);
    console.log(`文本2: "${text2}"`);
    
    const similarity = await embeddingService.calculateTextSimilarity(text1, text2);
    
    console.log(`✅ 相似度: ${similarity.toFixed(2)}%`);
    console.log(`   ${similarity >= 75 ? '判定为重复' : '判定为不重复'} (阈值: 75%)`);
    tests.passed++;
  } catch (error) {
    console.log(`❌ 测试失败:`, error.message);
    tests.failed++;
  }

  // 测试6: 健康检查
  console.log('\n📝 测试6: 服务健康检查');
  console.log('-'.repeat(60));
  tests.total++;
  try {
    const isHealthy = await embeddingService.healthCheck();
    
    if (isHealthy) {
      console.log(`✅ Embedding 服务健康`);
      tests.passed++;
    } else {
      console.log(`❌ Embedding 服务不健康`);
      tests.failed++;
    }
  } catch (error) {
    console.log(`❌ 测试失败:`, error.message);
    tests.failed++;
  }

  // 测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${tests.total}`);
  console.log(`✅ 通过: ${tests.passed}`);
  console.log(`❌ 失败: ${tests.failed}`);
  console.log(`通过率: ${((tests.passed / tests.total) * 100).toFixed(1)}%`);

  if (tests.failed === 0) {
    console.log('\n🎉 所有测试通过！向量化功能验证成功！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查上述错误信息');
  }

  console.log('\n💡 提示:');
  console.log('   - 确保 GEMINI_API_KEY 已配置');
  console.log('   - 向量维度默认为 768（可配置）');
  console.log('   - 相似度阈值: ≥75% 判定为重复');
}

// 运行测试
testEmbeddingService().catch(error => {
  console.error('\n💥 测试执行失败:', error);
  process.exit(1);
});

