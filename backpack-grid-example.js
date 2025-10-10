/**
 * Backpack网格策略示例
 * 演示如何直接使用 BackpackGridStrategy 类
 */

import BackpackGridStrategy from './backpack-grid-strategy.js';

// 配置示例 - 请根据实际情况修改
const config = {
    // API 配置（必需）
    apiKey: 'your_api_key_here',        // 替换为你的 Backpack API Key
    apiSecret: 'your_api_secret_here',  // 替换为你的 Backpack API Secret
    
    // 交易对配置（必需）
    symbol: 'SOL_USDC',                 // 交易对：SOL/USDC
    
    // 网格配置（必需）
    gridLower: 140,                     // 网格下限：$140
    gridUpper: 160,                     // 网格上限：$160
    gridNumber: 10,                     // 网格数量：10个网格
    amountPerGrid: 0.1,                 // 每格数量：0.1 SOL
    
    // 交易参数（可选，有默认值）
    orderType: 'Limit',                 // 订单类型：Limit（限价单）或 Market（市价单）
    timeInForce: 'Gtc',                 // 订单有效期：Gtc（成交为止）
    checkInterval: 20000,               // 检查间隔：20秒
    stopLossPercent: 0.05,              // 止损比例：5%
};

async function main() {
    console.log('🚀 Backpack网格交易策略示例\n');
    
    try {
        // 创建策略实例
        console.log('📝 创建策略实例...');
        const strategy = new BackpackGridStrategy(config);
        
        // 显示账户信息
        console.log('\n📊 获取账户信息...');
        const accountInfo = await strategy.displayAccountInfo();
        
        if (!accountInfo) {
            console.error('\n❌ 无法获取账户信息，请检查：');
            console.error('   1. API Key 和 API Secret 是否正确');
            console.error('   2. 网络连接是否正常');
            console.error('   3. 是否需要配置代理');
            process.exit(1);
        }
        
        // 确认信息
        console.log('\n⚠️  策略配置确认：');
        console.log(`   交易对：${config.symbol}`);
        console.log(`   网格范围：$${config.gridLower} - $${config.gridUpper}`);
        console.log(`   网格数量：${config.gridNumber}`);
        console.log(`   每格数量：${config.amountPerGrid}`);
        console.log(`   订单类型：${config.orderType}`);
        console.log(`   检查间隔：${config.checkInterval / 1000}秒`);
        
        // 计算所需资金
        const maxBuyPrice = config.gridUpper;
        const totalGrids = config.gridNumber + 1;
        const estimatedFunds = maxBuyPrice * config.amountPerGrid * totalGrids;
        console.log(`   预估所需资金：$${estimatedFunds.toFixed(2)} USDC`);
        
        console.log('\n💡 提示：');
        console.log('   - 网格交易适合震荡行情');
        console.log('   - 单边行情可能导致资金被套或踏空');
        console.log('   - 按 Ctrl+C 可随时停止策略');
        console.log('   - 建议先用小资金测试');
        
        // 等待用户确认
        console.log('\n策略将在 5 秒后启动...');
        await sleep(5000);
        
        // 启动策略
        console.log('\n🎯 启动策略...\n');
        await strategy.start();
        
        // 设置优雅退出
        setupGracefulShutdown(strategy);
        
    } catch (error) {
        console.error('\n❌ 发生错误:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

/**
 * 设置优雅退出处理
 */
function setupGracefulShutdown(strategy) {
    const shutdown = () => {
        console.log('\n\n⏸️  收到退出信号，正在停止策略...');
        strategy.stop();
        console.log('\n✅ 策略已安全停止');
        console.log('💾 状态已保存，下次启动将自动恢复');
        console.log('👋 感谢使用！');
        process.exit(0);
    };
    
    // 处理 Ctrl+C
    process.on('SIGINT', shutdown);
    
    // 处理终止信号
    process.on('SIGTERM', shutdown);
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
        console.error('\n❌ 未捕获的异常:', error.message);
        console.error(error.stack);
        strategy.stop();
        process.exit(1);
    });
    
    // 处理未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason) => {
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

// 运行主函数
main().catch(error => {
    console.error('\n❌ 程序异常:', error.message);
    console.error(error.stack);
    process.exit(1);
});

/**
 * 使用说明：
 * 
 * 1. 安装依赖
 *    npm install
 * 
 * 2. 修改配置
 *    编辑此文件，填入你的 API 密钥和策略参数
 * 
 * 3. 运行策略
 *    node backpack-grid-example.js
 * 
 * 4. 停止策略
 *    按 Ctrl+C
 * 
 * 5. 查看日志
 *    cat .backpack-trade-log-SOL-USDC.jsonl
 * 
 * 6. 查看状态
 *    cat .backpack-grid-state-SOL-USDC.json
 */

