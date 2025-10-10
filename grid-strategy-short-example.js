/**
 * 做空网格交易策略使用示例
 * 适用于下跌市场
 */

import GridTradingStrategyShort from './grid-trading-strategy-short.js';
import { getGridStrategyConfig } from './config.js';

// 从 .env 文件加载API密钥和配置
let baseConfig;
try {
    baseConfig = getGridStrategyConfig();
    console.log('✅ 配置已从 .env 文件加载\n');
} catch (error) {
    console.error('❌ 配置加载失败:', error.message);
    console.log('\n💡 提示:');
    console.log('   1. 运行 npm run setup 创建 .env 文件');
    console.log('   2. 编辑 .env 文件，填入你的API密钥');
    console.log('   3. 重新运行程序\n');
    process.exit(1);
}

// 做空策略配置（适合下跌市场）
const shortStrategyConfig = {
    ...baseConfig,
    
    // 网格配置（从高到低设置）
    gridLower: 100000,      // 网格下限
    gridUpper: 130000,      // 网格上限
    gridNumber: 20,         // 20个网格
    investmentPerGrid: 50,  // 每格投资50 USDT
    
    // 交易参数
    leverage: 10,           // 10倍杠杆
    checkInterval: 15000,   // 15秒检查一次
    stopLossPercent: 0.05   // 5%止损
};

async function main() {
    console.log('🔻 做空网格交易策略');
    console.log('='.repeat(50));
    console.log('📉 适用场景：预期价格下跌或震荡下行');
    console.log('='.repeat(50));
    
    console.log('\n📋 策略配置:');
    console.log(`   交易对: ${shortStrategyConfig.symbol}`);
    console.log(`   网格范围: $${shortStrategyConfig.gridLower} - $${shortStrategyConfig.gridUpper}`);
    console.log(`   网格数量: ${shortStrategyConfig.gridNumber}`);
    console.log(`   每格投资: $${shortStrategyConfig.investmentPerGrid}`);
    console.log(`   杠杆倍数: ${shortStrategyConfig.leverage}x`);
    console.log(`   总投资额: $${shortStrategyConfig.investmentPerGrid * shortStrategyConfig.gridNumber}`);
    console.log('\n🔻 策略类型: 做空（卖高买低）');
    console.log('   - 价格上涨时开空仓');
    console.log('   - 价格下跌时平仓获利');
    console.log('='.repeat(50));
    
    try {
        // 创建做空策略实例
        const strategy = new GridTradingStrategyShort(shortStrategyConfig);
        
        // 获取并显示账户信息
        console.log('\n📊 检查账户信息...');
        const accountInfo = await strategy.getAccountInfo();
        
        if (!accountInfo) {
            console.error('❌ 无法获取账户信息，请检查API密钥是否正确');
            process.exit(1);
        }
        
        // 确认是否启动
        console.log('\n⚠️  策略即将启动，请确认以下信息：');
        console.log(`   1. 这是做空策略，适合下跌市场`);
        console.log(`   2. 账户余额充足 (当前可用: ${accountInfo.availableBalance})`);
        console.log(`   3. 网格参数符合预期`);
        console.log(`   4. 理解做空风险：价格持续上涨会造成亏损`);
        console.log('\n💡 提示: 按 Ctrl+C 可随时停止策略\n');
        
        // 等待3秒后启动
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

function setupGracefulShutdown(strategy) {
    process.on('SIGINT', () => {
        console.log('\n\n⏸️  收到退出信号，正在停止策略...');
        strategy.stop();
        console.log('\n👋 感谢使用做空网格交易策略！');
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ 程序异常:', error);
        process.exit(1);
    });
}

module.exports = {
    shortStrategyConfig
};
