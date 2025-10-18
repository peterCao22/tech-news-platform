/**
 * Story 4.3: 趋势数据初始化脚本
 * 
 * 功能：
 * 1. 聚合历史数据生成趋势统计
 * 2. 回填最近30天的趋势数据
 */

const axios = require('axios');
require('dotenv').config({ path: '../../.env' });

const API_BASE_URL = 'http://127.0.0.1:3001/api';

async function initTrendData() {
  console.log('='.repeat(60));
  console.log('Story 4.3: 趋势数据初始化');
  console.log('='.repeat(60));
  console.log('');

  // 1. 管理员登录
  console.log('步骤 1: 管理员登录...');
  let adminToken;
  try {
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@mkbl.com',
      password: 'Wm@123456',
    });

    adminToken = loginRes.data.token || loginRes.data.data?.token;

    if (!adminToken) {
      console.error('❌ 登录失败：无法获取token');
      return;
    }
    console.log('✅ 管理员登录成功');
  } catch (error) {
    console.error('❌ 登录失败:', error.message);
    return;
  }

  const config = {
    headers: { Authorization: `Bearer ${adminToken}` },
  };

  // 2. 回填最近30天的趋势数据
  console.log('\n步骤 2: 回填最近30天的趋势数据...');
  console.log('这可能需要几分钟时间，请耐心等待...');
  console.log('');

  const today = new Date();
  const successDates = [];
  const failedDates = [];

  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    try {
      process.stdout.write(`  处理 ${dateStr} ... `);

      const res = await axios.post(
        `${API_BASE_URL}/history/trends/aggregate`,
        { date: dateStr },
        config
      );

      if (res.data.success) {
        const { keywordCount, categoryCount } = res.data.data;
        if (keywordCount === 0 && categoryCount === 0) {
          console.log(`⏭️  跳过 (无内容数据)`);
        } else {
          console.log(
            `✅ 成功 (关键词: ${keywordCount}, 分类: ${categoryCount})`
          );
        }
        successDates.push({
          date: dateStr,
          keywordCount,
          categoryCount,
        });
      } else {
        console.log(`⚠️  失败: ${res.data.message || '未知错误'}`);
        failedDates.push(dateStr);
      }

      // 添加延迟，避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`❌ 错误: ${error.response?.data?.message || error.message}`);
      failedDates.push(dateStr);
    }
  }

  // 3. 总结
  console.log('\n' + '='.repeat(60));
  console.log('数据初始化总结');
  console.log('='.repeat(60));
  console.log(`✅ 成功处理: ${successDates.length} 天`);
  console.log(`❌ 失败处理: ${failedDates.length} 天`);

  let totalKeywords = 0;
  let totalCategories = 0;

  if (successDates.length > 0) {
    totalKeywords = successDates.reduce(
      (sum, d) => sum + d.keywordCount,
      0
    );
    totalCategories = successDates.reduce(
      (sum, d) => sum + d.categoryCount,
      0
    );

    console.log('');
    console.log('聚合统计:');
    console.log(`  总关键词数: ${totalKeywords}`);
    console.log(`  总分类数: ${totalCategories}`);
    console.log(`  平均关键词/天: ${Math.round(totalKeywords / successDates.length)}`);
    console.log(`  平均分类/天: ${Math.round(totalCategories / successDates.length)}`);
  }

  if (failedDates.length > 0) {
    console.log('');
    console.log('失败日期:');
    failedDates.forEach((date) => console.log(`  - ${date}`));
  }

  console.log('='.repeat(60));
  console.log('');
  
  if (totalKeywords === 0 && totalCategories === 0) {
    console.log('⚠️  注意:');
    console.log('  数据库中暂无足够的内容数据（需要有tags和category的内容）');
    console.log('  趋势分析功能需要等待：');
    console.log('  1. 系统采集更多新闻内容');
    console.log('  2. 新闻内容包含tags（标签）和category（分类）字段');
    console.log('  3. 每日自动聚合任务运行后生成趋势数据');
    console.log('');
    console.log('💡 其他功能仍可正常使用:');
    console.log('  - 个人分析: http://192.168.13.142:3000/history (Tab 1)');
    console.log('  - 每日记录: http://192.168.13.142:3000/history (Tab 2)');
    console.log('  - 公司追踪: http://192.168.13.142:3000/history (Tab 4)');
  } else {
    console.log('💡 提示:');
    console.log('  - 现在可以访问前端页面查看趋势分析');
    console.log('  - 历史内容分析: http://192.168.13.142:3000/history 或 http://127.0.0.1:3000/history');
    console.log('  - 使用Tab切换不同功能（个人分析、每日记录、趋势分析、公司追踪）');
  }
  
  console.log('');
  console.log('✨ 数据初始化完成！');
}

// 运行初始化
initTrendData().catch((error) => {
  console.error('初始化过程出错:', error);
  process.exit(1);
});

