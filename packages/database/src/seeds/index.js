// 科技新闻聚合平台 - 数据库种子脚本主入口
import { seedRSSSources, clearRSSSources } from './rss-sources';
import { db } from '../client';
/**
 * 运行所有种子数据
 */
export async function runSeeds() {
    console.log('🚀 开始运行数据库种子脚本...\n');
    try {
        // 种子RSS源数据
        await seedRSSSources();
        console.log('\n✅ 所有种子数据运行完成！');
    }
    catch (error) {
        console.error('\n❌ 种子脚本运行失败:', error);
        process.exit(1);
    }
    finally {
        await db.$disconnect();
    }
}
/**
 * 清理所有种子数据
 */
export async function clearSeeds() {
    console.log('🧹 开始清理数据库种子数据...\n');
    try {
        await clearRSSSources();
        console.log('\n✅ 所有种子数据清理完成！');
    }
    catch (error) {
        console.error('\n❌ 清理脚本运行失败:', error);
        process.exit(1);
    }
    finally {
        await db.$disconnect();
    }
}
// 如果直接运行此脚本
if (require.main === module) {
    const command = process.argv[2];
    switch (command) {
        case 'seed':
            runSeeds();
            break;
        case 'clear':
            clearSeeds();
            break;
        default:
            console.log('使用方法:');
            console.log('  npm run seed        # 运行种子数据');
            console.log('  npm run seed:clear  # 清理种子数据');
            process.exit(1);
    }
}
