/**
 * 网格交易策略使用示例
 * 展示如何配置和使用动态网格策略
 */

import GridTradingStrategy from './grid-trading-strategy.js';
import { getGridStrategyConfig } from './config.js';

// ========================================
// 从 .env 文件加载API密钥和配置
// ========================================
let baseConfig;
try {
    baseConfig = getGridStrategyConfig();
    console.log('✅ 配置已从 .env 文件加载\n');
} catch (error) {
    console.error('❌ 配置加载失败:', error.message);
    console.log('\n💡 提示:');
    console.log('   1. 复制 env.example 为 .env');
    console.log('   2. 编辑 .env 文件，填入你的API密钥');
    console.log('   3. 重新运行程序\n');
    process.exit(1);
}

// ========================================
// 配置网格策略参数（可覆盖 .env 中的配置）
// ========================================
const strategyConfig = {
    ...baseConfig,  // 从 .env 加载的基础配置
    
    // 可以在这里覆盖特定参数
    // gridLower: 60000,
    // gridUpper: 70000,
    // gridNumber: 10,
    // investmentPerGrid: 10,
};

// ========================================
// 不同场景的预设配置
// ========================================

// 保守型配置 - 适合新手或小资金
const conservativeConfig = {
    ...baseConfig,
    gridNumber: 5,           // 更少的网格
    investmentPerGrid: 5,    // 更小的投资
    leverage: 5,             // 更低的杠杆
    checkInterval: 30000,    // 30秒检查一次
};

// 激进型配置 - 适合经验丰富的交易者
const aggressiveConfig = {
    ...baseConfig,
    gridNumber: 20,          // 更多的网格
    investmentPerGrid: 50,   // 更大的投资
    leverage: 20,            // 更高的杠杆
    checkInterval: 5000,     // 5秒检查一次
};

// 中性策略配置 - 窄幅震荡市场
const neutralConfig = {
    ...baseConfig,
    gridNumber: 8,
    investmentPerGrid: 20,
    leverage: 10,
    checkInterval: 15000,    // 15秒检查一次
};

// ========================================
// 启动策略
// ========================================
async function main() {
    console.log('🎯 动态网格交易策略');
    console.log('='.repeat(50));
    
    // 选择配置（修改这里来使用不同的配置）
    const config = strategyConfig; // 可选: conservativeConfig, aggressiveConfig, neutralConfig
    
    console.log('📋 使用配置:');
    console.log(`   交易对: ${config.symbol}`);
    console.log(`   网格范围: $${config.gridLower} - $${config.gridUpper}`);
    console.log(`   网格数量: ${config.gridNumber}`);
    console.log(`   每格投资: $${config.investmentPerGrid}`);
    console.log(`   杠杆倍数: ${config.leverage}x`);
    console.log(`   总投资金额: $${config.investmentPerGrid * config.gridNumber}`);
    console.log('='.repeat(50));
    
    try {
        // 创建策略实例
        const strategy = new GridTradingStrategy(config);
        
        // 获取并显示账户信息
        console.log('\n📊 检查账户信息...');
        const accountInfo = await strategy.getAccountInfo();
        
        if (!accountInfo) {
            console.error('❌ 无法获取账户信息，请检查API密钥是否正确');
            process.exit(1);
        }
        
        // 确认是否启动
        console.log('\n⚠️  策略即将启动，请确认以下信息：');
        console.log(`   1. API密钥已正确配置`);
        console.log(`   2. 账户余额充足 (当前可用: ${accountInfo.availableBalance})`);
        console.log(`   3. 网格参数符合预期`);
        console.log('\n💡 提示: 按 Ctrl+C 可随时停止策略\n');
        
        // 等待3秒后启动（给用户时间确认）
        console.log('策略将在 3 秒后启动...');
        await sleep(1000);
        console.log('2...');
        await sleep(1000);
        console.log('1...');
        await sleep(1000);
        
        // 启动策略
        await strategy.start();
        
        // 设置优雅退出
        setupGracefulShutdown(strategy);
        
    } catch (error) {
        console.error('❌ 策略启动失败:', error.message);
        process.exit(1);
    }
}

/**
 * 设置优雅退出处理
 */
function setupGracefulShutdown(strategy) {
    process.on('SIGINT', () => {
        console.log('\n\n⏸️  收到退出信号，正在停止策略...');
        strategy.stop();
        
        console.log('\n👋 感谢使用网格交易策略！');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n\n⏸️  收到终止信号，正在停止策略...');
        strategy.stop();
        process.exit(0);
    });
    
    process.on('uncaughtException', (error) => {
        console.error('\n❌ 未捕获的异常:', error.message);
        strategy.stop();
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('\n❌ 未处理的Promise拒绝:', reason);
        strategy.stop();
        process.exit(1);
    });
}

/**
 * 睡眠函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 运行主函数
// ========================================
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 程序异常:', error);
        process.exit(1);
    });
}

module.exports = {
    strategyConfig,
    conservativeConfig,
    aggressiveConfig,
    neutralConfig
};

