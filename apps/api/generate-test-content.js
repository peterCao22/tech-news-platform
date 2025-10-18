/**
 * 生成测试内容数据
 * 用于功能演示和测试
 */

require('dotenv').config();
const { PrismaClient } = require('@tech-news-platform/database');
const prisma = new PrismaClient();

const testContents = [
  {
    title: 'OpenAI发布GPT-5：AI领域的革命性突破',
    description: '新模型在推理能力、多模态理解和长文本处理方面取得显著进展，为AI应用开启新篇章。',
    category: 'AI',
    tags: ['AI', 'GPT-5', 'OpenAI', 'Machine Learning'],
    score: 95,
  },
  {
    title: 'NVIDIA推出新一代H200 GPU：算力提升300%',
    description: 'H200 GPU专为AI训练和推理优化，将大幅降低大模型训练成本。',
    category: 'Hardware',
    tags: ['NVIDIA', 'GPU', 'AI Hardware', 'H200'],
    score: 92,
  },
  {
    title: '量子计算突破：IBM实现512量子比特系统',
    description: 'IBM量子计算机达到新里程碑，为解决复杂科学问题提供新工具。',
    category: 'Quantum Computing',
    tags: ['IBM', 'Quantum Computing', '量子计算', 'Technology'],
    score: 89,
  },
  {
    title: 'Microsoft发布Azure AI超级计算平台',
    description: '新平台集成最新AI技术，为企业提供一站式AI解决方案。',
    category: 'Cloud Computing',
    tags: ['Microsoft', 'Azure', 'Cloud', 'AI Platform'],
    score: 87,
  },
  {
    title: '特斯拉FSD V12正式发布：完全自动驾驶时代来临',
    description: '新版本使用端到端神经网络，自动驾驶能力达到新高度。',
    category: 'Autonomous Driving',
    tags: ['Tesla', 'FSD', 'Autonomous Driving', 'AI'],
    score: 85,
  },
  {
    title: 'Google推出Gemini Ultra：多模态AI新标杆',
    description: 'Gemini Ultra在多项基准测试中超越GPT-4，展示强大的多模态能力。',
    category: 'AI',
    tags: ['Google', 'Gemini', 'AI', 'Multimodal'],
    score: 93,
  },
  {
    title: 'Web3.0革命：去中心化互联网的未来',
    description: '区块链技术推动互联网进入新时代，用户数据主权回归个人。',
    category: 'Blockchain',
    tags: ['Web3', 'Blockchain', 'Decentralization', 'Crypto'],
    score: 82,
  },
  {
    title: 'Meta发布AR眼镜：虚拟现实融入日常生活',
    description: '轻量化AR眼镜为消费者带来全新的混合现实体验。',
    category: 'AR/VR',
    tags: ['Meta', 'AR', 'VR', 'Augmented Reality'],
    score: 80,
  },
  {
    title: 'SpaceX星舰成功完成轨道测试：火星殖民梦想更近一步',
    description: '星舰完成关键里程碑测试，为人类成为多行星物种铺平道路。',
    category: 'Space',
    tags: ['SpaceX', 'Starship', 'Space Exploration', 'Mars'],
    score: 88,
  },
  {
    title: 'Anthropic发布Claude 3：对标GPT-4的强力竞争者',
    description: 'Claude 3在安全性和可靠性方面表现出色，为企业AI应用提供新选择。',
    category: 'AI',
    tags: ['Anthropic', 'Claude', 'AI', 'Large Language Model'],
    score: 91,
  },
  {
    title: '苹果Vision Pro销量突破100万台：空间计算时代正式开启',
    description: '消费者对混合现实设备的接受度超出预期，开发者生态快速成长。',
    category: 'AR/VR',
    tags: ['Apple', 'Vision Pro', 'Spatial Computing', 'MR'],
    score: 86,
  },
  {
    title: '生物计算突破：DNA存储技术实现商业化',
    description: '新技术可在极小空间存储PB级数据，存储密度提升百万倍。',
    category: 'Biotechnology',
    tags: ['DNA Storage', 'Biotechnology', 'Data Storage', 'Innovation'],
    score: 84,
  },
  {
    title: '6G技术标准发布：下一代通信网络蓝图确定',
    description: '6G将实现太赫兹通信，速度比5G快100倍，延迟降至微秒级。',
    category: 'Telecommunications',
    tags: ['6G', '5G', 'Telecommunications', 'Network'],
    score: 81,
  },
  {
    title: 'AI芯片创业公司融资10亿美元：挑战NVIDIA垄断地位',
    description: '多家初创公司发布高性能AI芯片，为市场带来更多选择。',
    category: 'Semiconductors',
    tags: ['AI Chip', 'Startup', 'Semiconductors', 'Investment'],
    score: 83,
  },
  {
    title: '开源大模型Mistral 8x22B发布：性能逼近GPT-4',
    description: '开源社区再次证明，高性能AI模型不一定需要闭源。',
    category: 'AI',
    tags: ['Open Source', 'Mistral', 'AI', 'Large Language Model'],
    score: 90,
  }
];

async function generateTestContent() {
  console.log('='.repeat(60));
  console.log('生成测试内容数据');
  console.log('='.repeat(60));

  try {
    // 1. 获取或创建默认信息源
    let source = await prisma.source.findFirst({
      where: { name: '测试新闻源' }
    });

    if (!source) {
      console.log('\n创建测试信息源...');
      source = await prisma.source.create({
        data: {
          name: '测试新闻源',
          type: 'MANUAL',
          url: 'https://example.com',
          status: 'ACTIVE'
        }
      });
      console.log(`✅ 信息源创建成功: ${source.name} (ID: ${source.id})`);
    } else {
      console.log(`\n✅ 使用现有信息源: ${source.name} (ID: ${source.id})`);
    }

    // 2. 生成测试内容
    console.log('\n开始生成测试内容...\n');
    
    let successCount = 0;
    let skipCount = 0;

    for (const testContent of testContents) {
      try {
        // 检查是否已存在
        const existing = await prisma.content.findFirst({
          where: { title: testContent.title }
        });

        if (existing) {
          console.log(`⏭️  跳过 (已存在): ${testContent.title.substring(0, 40)}...`);
          skipCount++;
          continue;
        }

        // 创建内容
        const now = new Date();
        const publishedAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // 过去24小时内随机时间

        const content = await prisma.content.create({
          data: {
            title: testContent.title,
            description: testContent.description,
            content: `<p>${testContent.description}</p><p>这是一篇测试文章，用于演示个性化推荐功能。</p>`,
            url: `https://example.com/news/${Date.now()}-${successCount}`,
            category: testContent.category,
            tags: testContent.tags,
            score: testContent.score,
            status: 'PROCESSED',
            sourceId: source.id,
            publishedAt,
          }
        });

        console.log(`✅ 创建成功: ${testContent.title.substring(0, 40)}... (评分: ${testContent.score})`);
        successCount++;

      } catch (error) {
        console.error(`❌ 创建失败: ${testContent.title.substring(0, 40)}...`);
        console.error(`   错误: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 生成完成统计');
    console.log('='.repeat(60));
    console.log(`✅ 成功创建: ${successCount} 条`);
    console.log(`⏭️  已存在跳过: ${skipCount} 条`);
    console.log(`📝 总计尝试: ${testContents.length} 条`);

    // 3. 验证结果
    console.log('\n' + '='.repeat(60));
    console.log('验证测试数据');
    console.log('='.repeat(60));

    const highScoreCount = await prisma.content.count({
      where: {
        status: 'PROCESSED',
        score: { gte: 60 }
      }
    });

    console.log(`\n🏆 符合TOP10条件的内容: ${highScoreCount} 条`);

    if (highScoreCount >= 10) {
      console.log('✅ 数据充足，可以正常生成TOP10！');
    } else if (highScoreCount > 0) {
      console.log(`⚠️  数据不足10条，但可以生成TOP${highScoreCount}`);
    } else {
      console.log('❌ 没有符合条件的数据');
    }

    console.log('\n现在可以访问个性化推荐页面测试功能！');
    console.log('- 个性化推荐: http://localhost:3000/personalized');
    console.log('- 每日TOP10:  http://localhost:3000/personalized/top10');

  } catch (error) {
    console.error('\n❌ 生成失败:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestContent();

