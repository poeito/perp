/**
 * 多策略并行运行器
 * 同时运行多个网格交易策略
 */

import fs from 'fs';
import GridTradingStrategy from './grid-trading-strategy.js';
import GridTradingStrategyShort from './grid-trading-strategy-short.js';

class MultiStrategyRunner {
    constructor(configFile = './grid-config.json') {
        this.configFile = configFile;
        this.strategies = new Map(); // strategyName -> strategy instance
        this.isRunning = false;
    }

    /**
     * 加载配置文件
     */
    loadConfig() {
        try {
            if (!fs.existsSync(this.configFile)) {
                console.error(`❌ 配置文件不存在: ${this.configFile}`);
                console.log('💡 提示: 请先复制 grid-config-template.json 为 grid-config.json 并填入你的配置');
                process.exit(1);
            }

            const configData = fs.readFileSync(this.configFile, 'utf8');
            const config = JSON.parse(configData);

            if (!config.strategies || Object.keys(config.strategies).length === 0) {
                console.error('❌ 配置文件中没有找到任何策略');
                process.exit(1);
            }

            return config.strategies;
        } catch (error) {
            console.error('❌ 加载配置文件失败:', error.message);
            process.exit(1);
        }
    }

    /**
     * 列出所有可用策略
     */
    listStrategies(allConfigs) {
        console.log('\n📋 可用的策略配置:\n');
        console.log('='.repeat(80));

        Object.entries(allConfigs).forEach(([key, strategy], index) => {
            const strategyIcon = strategy.strategyType === 'SHORT' ? '🔻' : '🟢';
            const strategyType = strategy.strategyType === 'SHORT' ? '做空' : '做多';
            
            console.log(`\n${index + 1}. 🎯 ${key} ${strategyIcon}`);
            console.log(`   名称: ${strategy.name || '未命名'}`);
            console.log(`   类型: ${strategyType}`);
            console.log(`   描述: ${strategy.description || '无描述'}`);
            console.log(`   交易对: ${strategy.symbol} (市场索引: ${strategy.marketIndex})`);
            console.log(`   网格范围: $${strategy.gridLower} - $${strategy.gridUpper}`);
            console.log(`   网格数量: ${strategy.gridNumber} | 每格: $${strategy.investmentPerGrid} | 杠杆: ${strategy.leverage}x`);
            console.log(`   总投资: $${(strategy.investmentPerGrid * strategy.gridNumber).toFixed(2)}`);
        });

        console.log('\n' + '='.repeat(80));
    }

    /**
     * 验证策略配置（仅从grid-config.json加载API密钥）
     */
    validateConfig(config, strategyName) {
        const errors = [];

        // 检查API密钥是否在配置中
        if (!config.apiKey || 
            config.apiKey === 'your_api_key_here' || 
            config.apiKey === 'YOUR_API_KEY_FOR_CONSERVATIVE' ||
            config.apiKey === 'YOUR_API_KEY_FOR_AGGRESSIVE' ||
            config.apiKey.startsWith('YOUR_')) {
            errors.push('API密钥未配置（请在 grid-config.json 中配置 apiKey）');
        }

        if (!config.secretKey || 
            config.secretKey === 'your_secret_key_here' ||
            config.secretKey === 'YOUR_SECRET_KEY_FOR_CONSERVATIVE' ||
            config.secretKey === 'YOUR_SECRET_KEY_FOR_AGGRESSIVE' ||
            config.secretKey.startsWith('YOUR_')) {
            errors.push('Secret密钥未配置（请在 grid-config.json 中配置 secretKey）');
        }

        if (!config.symbol) {
            errors.push('交易对未配置');
        }

        if (config.marketIndex === undefined || config.marketIndex === null) {
            errors.push('市场索引未配置');
        }

        if (errors.length > 0) {
            console.error(`\n❌ 策略 ${strategyName} 配置错误:`);
            errors.forEach(err => console.error(`   - ${err}`));
            return false;
        }

        return true;
    }

    /**
     * 启动指定的策略
     */
    async startStrategy(strategyName, config, strategyIndex = 0, totalStrategies = 1) {
        try {
            const strategyType = config.strategyType === 'SHORT' ? '做空' : '做多';
            const strategyIcon = config.strategyType === 'SHORT' ? '🔻' : '🟢';
            
            console.log(`\n🚀 启动策略: ${strategyName} ${strategyIcon}`);
            console.log(`   类型: ${strategyType}`);
            console.log(`   交易对: ${config.symbol}`);
            console.log(`   网格: $${config.gridLower} - $${config.gridUpper} (${config.gridNumber}格)`);
            console.log(`   投资: $${config.investmentPerGrid}/格 × ${config.gridNumber} = $${config.investmentPerGrid * config.gridNumber}`);

            // 根据策略类型创建实例
            const StrategyClass = config.strategyType === 'SHORT' ? GridTradingStrategyShort : GridTradingStrategy;
            const strategy = new StrategyClass(config);

            // 验证账户信息
            const accountInfo = await strategy.getAccountInfo();
            if (!accountInfo) {
                console.error(`❌ ${strategyName}: 无法获取账户信息`);
                return false;
            }

            console.log(`   账户余额: ${accountInfo.availableBalance}`);

            // 计算初始延迟，错开多个策略的检查周期
            // 将检查周期均匀分配给各个策略
            const checkInterval = config.checkInterval || 10000;
            const initialDelay = totalStrategies > 1 
                ? Math.floor((checkInterval / totalStrategies) * strategyIndex)
                : 0;

            // 启动策略（异步运行，带初始延迟）
            strategy.start(initialDelay).catch(error => {
                console.error(`❌ ${strategyName} 运行异常:`, error.message);
            });

            // 保存策略实例
            this.strategies.set(strategyName, strategy);

            console.log(`✅ ${strategyName} 启动成功\n`);
            return true;

        } catch (error) {
            console.error(`❌ ${strategyName} 启动失败:`, error.message);
            return false;
        }
    }

    /**
     * 停止所有策略
     */
    stopAll() {
        console.log('\n⏸️  正在停止所有策略...\n');

        for (const [name, strategy] of this.strategies.entries()) {
            try {
                strategy.stop();
                console.log(`✅ ${name} 已停止`);
            } catch (error) {
                console.error(`❌ 停止 ${name} 失败:`, error.message);
            }
        }

        this.strategies.clear();
        this.isRunning = false;
        console.log('\n👋 所有策略已停止');
    }

    /**
     * 显示运行状态
     */
    printStatus() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 多策略运行状态');
        console.log('='.repeat(80));

        if (this.strategies.size === 0) {
            console.log('⚠️  当前没有运行中的策略');
        } else {
            for (const [name, strategy] of this.strategies.entries()) {
                console.log(`\n🎯 ${name}`);
                console.log(`   交易对: ${strategy.symbol}`);
                console.log(`   当前价格: $${strategy.currentPrice.toFixed(2)}`);
                console.log(`   累计盈利: $${strategy.totalProfit.toFixed(4)}`);
                
                // 统计持仓
                let activePositions = 0;
                for (let i = 0; i < strategy.gridLevels.length; i++) {
                    if (strategy.gridOrders.get(i).hasPosition) {
                        activePositions++;
                    }
                }
                console.log(`   活跃持仓: ${activePositions}/${strategy.gridLevels.length}`);
            }
        }

        console.log('\n' + '='.repeat(80));
    }

    /**
     * 运行指定的策略列表
     */
    async run(strategyNames = []) {
        console.log('\n' + '='.repeat(80));
        console.log('🤖 多策略并行网格交易');
        console.log('='.repeat(80));

        // 加载配置
        const allConfigs = this.loadConfig();

        // 如果没有指定策略，列出所有可用策略
        if (strategyNames.length === 0) {
            this.listStrategies(allConfigs);
            console.log('\n使用方法:');
            console.log('  node grid-multi-runner.js <策略1> <策略2> ...');
            console.log('  node grid-multi-runner.js all  # 运行所有策略');
            console.log('  例如: node grid-multi-runner.js btc_conservative eth_moderate\n');
            process.exit(0);
        }

        // 如果是 "all"，运行所有策略
        if (strategyNames.length === 1 && strategyNames[0] === 'all') {
            strategyNames = Object.keys(allConfigs);
            console.log(`\n🎯 将运行所有 ${strategyNames.length} 个策略\n`);
        }

        // 验证策略是否存在
        const validStrategies = [];
        for (const name of strategyNames) {
            if (!allConfigs[name]) {
                console.error(`❌ 策略不存在: ${name}`);
                continue;
            }

            if (!this.validateConfig(allConfigs[name], name)) {
                continue;
            }

            validStrategies.push(name);
        }

        if (validStrategies.length === 0) {
            console.error('\n❌ 没有有效的策略可以运行');
            process.exit(1);
        }

        // 显示即将启动的策略
        console.log(`\n📋 将启动以下 ${validStrategies.length} 个策略:\n`);
        validStrategies.forEach((name, index) => {
            const config = allConfigs[name];
            console.log(`${index + 1}. ${name} (${config.symbol})`);
        });

        console.log('\n⚠️  风险提示:');
        console.log('   ✓ 多个策略将同时运行');
        console.log('   ✓ 请确保账户余额充足');
        console.log('   ✓ 建议先测试单个策略');
        console.log('   ✓ 按 Ctrl+C 可停止所有策略');
        console.log('\n⏱️  API限流保护:');
        console.log('   ✓ 策略依次启动（间隔3秒）');
        console.log('   ✓ 检查周期自动错开（避免同时请求API）');

        // 倒计时
        console.log('\n⏰ 策略将在 5 秒后启动...\n');
        for (let i = 5; i > 0; i--) {
            console.log(`   ${i}...`);
            await this.sleep(1000);
        }

        console.log('\n🚀 开始启动策略...\n');
        console.log('='.repeat(80));

        // 启动所有策略（依次启动，避免API限流）
        let successCount = 0;
        const totalStrategies = validStrategies.length;
        
        for (let i = 0; i < totalStrategies; i++) {
            const name = validStrategies[i];
            console.log(`\n[${i + 1}/${totalStrategies}] 正在启动策略: ${name}...`);
            
            const success = await this.startStrategy(name, allConfigs[name], i, totalStrategies);
            if (success) {
                successCount++;
            }
            
            // 如果不是最后一个策略，等待3秒再启动下一个（避免API限流）
            if (i < totalStrategies - 1) {
                console.log(`⏱️  等待 3 秒后启动下一个策略...`);
                await this.sleep(3000);
            }
        }

        console.log('='.repeat(80));
        console.log(`\n✅ 成功启动 ${successCount}/${validStrategies.length} 个策略`);

        if (successCount === 0) {
            console.error('❌ 没有策略成功启动');
            process.exit(1);
        }

        this.isRunning = true;

        // 设置定期状态报告（每5分钟）
        setInterval(() => {
            this.printStatus();
        }, 5 * 60 * 1000);

        // 初始状态显示
        setTimeout(() => {
            this.printStatus();
        }, 10000);

        console.log('\n💡 提示: 按 Ctrl+C 停止所有策略\n');

        // 设置优雅退出
        this.setupGracefulShutdown();
    }

    /**
     * 设置优雅退出
     */
    setupGracefulShutdown() {
        const shutdown = () => {
            if (!this.isRunning) {
                process.exit(0);
            }
            this.stopAll();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        process.on('uncaughtException', (error) => {
            console.error('\n❌ 未捕获的异常:', error.message);
            this.stopAll();
            process.exit(1);
        });

        process.on('unhandledRejection', (reason) => {
            console.error('\n❌ 未处理的Promise拒绝:', reason);
            this.stopAll();
            process.exit(1);
        });
    }

    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);
    const runner = new MultiStrategyRunner();

    await runner.run(args);
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('\n❌ 程序异常:', error.message);
        console.error(error.stack);
        process.exit(1);
    });
}

export default MultiStrategyRunner;
