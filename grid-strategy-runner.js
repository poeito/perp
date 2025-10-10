/**
 * 网格策略运行器
 * 从配置文件加载并启动策略
 */

import fs from 'fs';
import GridTradingStrategy from './grid-trading-strategy.js';
import { getApiConfig } from './config.js';

/**
 * 从JSON配置文件加载策略配置
 */
function loadConfigFromFile(configFile, strategyName) {
    try {
        // 检查文件是否存在
        if (!fs.existsSync(configFile)) {
            console.error(`❌ 配置文件不存在: ${configFile}`);
            console.log('💡 提示: 请先复制 grid-config-template.json 为 grid-config.json 并填入你的配置');
            process.exit(1);
        }
        
        // 读取配置文件
        const configData = fs.readFileSync(configFile, 'utf8');
        const config = JSON.parse(configData);
        
        // 获取指定策略的配置
        if (!config.strategies || !config.strategies[strategyName]) {
            console.error(`❌ 配置文件中没有找到策略: ${strategyName}`);
            console.log('📋 可用的策略:');
            if (config.strategies) {
                Object.keys(config.strategies).forEach(name => {
                    console.log(`   - ${name}: ${config.strategies[name].name || name}`);
                });
            }
            process.exit(1);
        }
        
        return config.strategies[strategyName];
        
    } catch (error) {
        console.error('❌ 加载配置文件失败:', error.message);
        if (error instanceof SyntaxError) {
            console.error('💡 提示: 配置文件格式错误，请检查JSON语法');
        }
        process.exit(1);
    }
}

/**
 * 显示所有可用策略
 */
function listAvailableStrategies(configFile) {
    try {
        if (!fs.existsSync(configFile)) {
            console.log('❌ 配置文件不存在');
            return;
        }
        
        const configData = fs.readFileSync(configFile, 'utf8');
        const config = JSON.parse(configData);
        
        console.log('\n📋 可用的策略配置:\n');
        console.log('='.repeat(70));
        
        if (config.strategies) {
            Object.entries(config.strategies).forEach(([key, strategy]) => {
                console.log(`\n🎯 ${key}`);
                console.log(`   名称: ${strategy.name || '未命名'}`);
                console.log(`   描述: ${strategy.description || '无描述'}`);
                console.log(`   交易对: ${strategy.symbol}`);
                console.log(`   网格范围: $${strategy.gridLower} - $${strategy.gridUpper}`);
                console.log(`   网格数量: ${strategy.gridNumber}`);
                console.log(`   每格投资: $${strategy.investmentPerGrid}`);
                console.log(`   杠杆倍数: ${strategy.leverage}x`);
                console.log(`   总投资: $${strategy.investmentPerGrid * strategy.gridNumber}`);
            });
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('\n使用方法:');
        console.log(`  node grid-strategy-runner.js <策略名称>`);
        console.log(`  例如: node grid-strategy-runner.js btc_conservative\n`);
        
    } catch (error) {
        console.error('❌ 读取配置文件失败:', error.message);
    }
}

/**
 * 启动策略
 */
async function runStrategy(config) {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 动态网格交易策略');
    console.log('='.repeat(70));
    
    console.log('\n📋 策略信息:');
    console.log(`   名称: ${config.name || '未命名'}`);
    console.log(`   描述: ${config.description || '无描述'}`);
    console.log(`   交易对: ${config.symbol}`);
    console.log(`   市场索引: ${config.marketIndex}`);
    
    console.log('\n📊 网格配置:');
    console.log(`   价格区间: $${config.gridLower} - $${config.gridUpper}`);
    console.log(`   网格数量: ${config.gridNumber}`);
    console.log(`   每格投资: $${config.investmentPerGrid}`);
    console.log(`   总投资额: $${config.investmentPerGrid * config.gridNumber}`);
    
    console.log('\n⚙️  交易参数:');
    console.log(`   杠杆倍数: ${config.leverage}x`);
    console.log(`   检查间隔: ${config.checkInterval / 1000}秒`);
    console.log(`   止损比例: ${(config.stopLossPercent * 100).toFixed(2)}%`);
    
    console.log('\n' + '='.repeat(70));
    
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
        
        // 确认启动
        console.log('\n⚠️  策略即将启动，请确认:');
        console.log(`   ✓ API密钥已正确配置`);
        console.log(`   ✓ 账户余额充足 (可用: ${accountInfo.availableBalance})`);
        console.log(`   ✓ 网格参数符合预期`);
        console.log(`   ✓ 风险提示已知晓`);
        console.log('\n💡 提示: 按 Ctrl+C 可随时停止策略\n');
        
        // 倒计时
        for (let i = 3; i > 0; i--) {
            console.log(`策略将在 ${i} 秒后启动...`);
            await sleep(1000);
        }
        
        // 启动策略
        await strategy.start();
        
        // 设置优雅退出
        setupGracefulShutdown(strategy);
        
    } catch (error) {
        console.error('\n❌ 策略启动失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

/**
 * 设置优雅退出
 */
function setupGracefulShutdown(strategy) {
    const shutdown = () => {
        console.log('\n\n⏸️  收到退出信号，正在停止策略...');
        strategy.stop();
        console.log('👋 感谢使用网格交易策略！');
        process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    process.on('uncaughtException', (error) => {
        console.error('\n❌ 未捕获的异常:', error.message);
        console.error(error.stack);
        strategy.stop();
        process.exit(1);
    });
    
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

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);
    const configFile = './grid-config.json';
    
    // 如果没有参数，显示帮助信息
    if (args.length === 0) {
        console.log('\n🤖 网格策略运行器\n');
        console.log('使用方法:');
        console.log('  node grid-strategy-runner.js <策略名称>');
        console.log('  node grid-strategy-runner.js list  # 列出所有可用策略\n');
        
        // 尝试列出可用策略
        listAvailableStrategies(configFile);
        process.exit(0);
    }
    
    const command = args[0];
    
    // 列出所有策略
    if (command === 'list' || command === '-l' || command === '--list') {
        listAvailableStrategies(configFile);
        process.exit(0);
    }
    
    // 加载并运行指定策略
    const strategyName = command;
    console.log(`\n📂 加载策略配置: ${strategyName}`);
    
    const config = loadConfigFromFile(configFile, strategyName);
    
    // 验证必需字段，如果配置文件中未配置或未定义，尝试从.env加载
    if (!config.apiKey || config.apiKey === 'your_api_key_here' || config.apiKey === undefined) {
        try {
            console.log('💡 配置文件中未配置 API 密钥，从 .env 加载...');
            const envConfig = getApiConfig();
            config.apiKey = envConfig.apiKey;
            config.secretKey = envConfig.secretKey;
            console.log('✅ 已从 .env 文件加载 API 密钥');
        } catch (error) {
            console.error('\n❌ 错误: API密钥未配置');
            console.log('💡 提示: 请在 .env 文件或 grid-config.json 中配置 API 密钥');
            console.log(`   错误详情: ${error.message}`);
            process.exit(1);
        }
    }
    
    if (!config.secretKey || config.secretKey === 'your_secret_key_here' || config.secretKey === undefined) {
        console.error('\n❌ 错误: Secret密钥未配置');
        console.log('💡 提示: 请在 .env 文件或 grid-config.json 中配置 Secret 密钥');
        process.exit(1);
    }
    
    // 运行策略
    await runStrategy(config);
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('\n❌ 程序异常:', error.message);
        console.error(error.stack);
        process.exit(1);
    });
}

export {
    loadConfigFromFile,
    listAvailableStrategies,
    runStrategy
};

