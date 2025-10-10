/**
 * Backpack动态网格交易策略
 * 基于Backpack API实现现货网格自动化交易
 */

import BackpackAPI from './backpack-api.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 全局API请求节流器
class APIThrottler {
    constructor(minInterval = 2000) {
        this.minInterval = minInterval; // 最小请求间隔（毫秒）
        this.lastRequestTime = 0;
    }

    async throttle() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minInterval) {
            const waitTime = this.minInterval - timeSinceLastRequest;
            console.log(`⏱️  API节流：等待 ${waitTime}ms（避免请求过快）`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }
}

// 全局节流器实例（所有策略共享，确保API请求间隔至少2秒）
const globalThrottler = new APIThrottler(2000);

class BackpackGridStrategy {
    constructor(config) {
        // 验证必需配置
        const requiredFields = ['apiKey', 'apiSecret', 'symbol', 
                               'gridLower', 'gridUpper', 'gridNumber', 'amountPerGrid'];
        for (const field of requiredFields) {
            if (config[field] === undefined || config[field] === null || config[field] === '') {
                throw new Error(`缺少必需配置项: ${field}`);
            }
        }

        // API配置
        this.api = new BackpackAPI(config.apiKey, config.apiSecret);
        
        // 交易对配置
        this.symbol = config.symbol; // 例如: 'SOL_USDC'
        
        // 网格配置
        this.gridLower = config.gridLower; // 网格下限价格
        this.gridUpper = config.gridUpper; // 网格上限价格
        this.gridNumber = config.gridNumber; // 网格数量
        this.amountPerGrid = config.amountPerGrid; // 每格交易数量（基础币数量）
        
        // 交易配置
        this.orderType = config.orderType || 'Limit'; // 默认限价单
        this.timeInForce = config.timeInForce || 'Gtc'; // 默认Good-Til-Cancel
        
        // 风险控制配置
        this.stopLossPercent = config.stopLossPercent || 0.05; // 止损百分比，默认5%
        this.maxPositionValue = config.maxPositionValue || Infinity; // 最大持仓价值
        
        // 运行控制
        this.isRunning = false;
        this.checkInterval = config.checkInterval || 10000; // 检查间隔，默认10秒
        this.intervalId = null;
        
        // 网格状态
        this.gridLevels = []; // 网格价格级别
        this.gridOrders = new Map(); // 网格订单状态 {gridLevel: {hasPosition, entryPrice, quantity, orderId}}
        this.currentPrice = 0;
        this.totalProfit = 0;
        this.totalBuys = 0;
        this.totalSells = 0;
        
        // 状态持久化文件路径
        this.stateFile = path.join(__dirname, `.backpack-grid-state-${this.symbol.replace('_', '-')}.json`);
        
        // 交易记录文件路径
        this.tradeLogFile = path.join(__dirname, `.backpack-trade-log-${this.symbol.replace('_', '-')}.jsonl`);
        
        // 初始化网格
        this.initializeGrid();
        
        // 加载历史状态
        this.loadState();
        
        console.log('✅ Backpack网格策略初始化成功');
        console.log(`📊 交易对: ${this.symbol}`);
        console.log(`📈 网格范围: ${this.gridLower} - ${this.gridUpper}`);
        console.log(`🔢 网格数量: ${this.gridNumber}`);
        console.log(`💰 每格数量: ${this.amountPerGrid}`);
    }

    /**
     * 初始化网格价格级别
     */
    initializeGrid() {
        this.gridLevels = [];
        const gridStep = (this.gridUpper - this.gridLower) / this.gridNumber;
        
        for (let i = 0; i <= this.gridNumber; i++) {
            const price = this.gridLower + (gridStep * i);
            this.gridLevels.push(price);
            this.gridOrders.set(i, {
                price: price,
                hasPosition: false,
                entryPrice: 0,
                quantity: 0,
                buyOrderId: null,
                sellOrderId: null
            });
        }
        
        console.log('🎯 网格级别已初始化:');
        this.gridLevels.forEach((price, index) => {
            console.log(`   等级 ${index}: $${price.toFixed(6)}`);
        });
    }

    /**
     * 带重试的 API 请求辅助方法
     */
    async retryApiCall(apiCall, maxRetries = 3, retryDelay = 3000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await apiCall();
                return result;
            } catch (error) {
                if (attempt < maxRetries) {
                    console.log(`⚠️  API请求失败，${retryDelay}ms 后重试 (${attempt}/${maxRetries}): ${error.message}`);
                    await this.sleep(retryDelay);
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * 获取当前市场价格
     */
    async getCurrentPrice() {
        try {
            // 全局节流：确保API请求间隔至少2秒
            await globalThrottler.throttle();
            
            const ticker = await this.retryApiCall(async () => {
                return await this.api.getTicker({ symbol: this.symbol });
            });
            
            if (ticker && ticker.lastPrice) {
                return parseFloat(ticker.lastPrice);
            }
            throw new Error('无法获取有效价格数据');
        } catch (error) {
            console.error('❌ 获取价格失败:', error.message);
            return null;
        }
    }

    /**
     * 获取账户余额
     */
    async getBalance() {
        try {
            await globalThrottler.throttle();
            
            const balance = await this.retryApiCall(async () => {
                return await this.api.getBalance();
            });
            
            return balance;
        } catch (error) {
            console.error('❌ 获取余额失败:', error.message);
            return null;
        }
    }

    /**
     * 获取未完成订单
     */
    async getOpenOrders() {
        try {
            await globalThrottler.throttle();
            
            const orders = await this.retryApiCall(async () => {
                return await this.api.getOpenOrders({ symbol: this.symbol });
            });
            
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('❌ 获取未完成订单失败:', error.message);
            return [];
        }
    }

    /**
     * 保存网格状态到文件
     */
    saveState() {
        try {
            const state = {
                timestamp: Date.now(),
                symbol: this.symbol,
                gridConfig: {
                    gridLower: this.gridLower,
                    gridUpper: this.gridUpper,
                    gridNumber: this.gridNumber,
                    amountPerGrid: this.amountPerGrid
                },
                totalProfit: this.totalProfit,
                totalBuys: this.totalBuys,
                totalSells: this.totalSells,
                gridOrders: Array.from(this.gridOrders.entries()).map(([level, state]) => ({
                    level,
                    ...state
                }))
            };
            
            fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
            console.log(`💾 状态已保存: ${this.stateFile}`);
        } catch (error) {
            console.error('❌ 保存状态失败:', error.message);
        }
    }

    /**
     * 从文件加载网格状态
     */
    loadState() {
        try {
            if (!fs.existsSync(this.stateFile)) {
                console.log('📂 未找到历史状态文件，从新状态开始');
                return;
            }
            
            const data = fs.readFileSync(this.stateFile, 'utf8');
            const state = JSON.parse(data);
            
            // 验证配置是否匹配
            if (state.symbol !== this.symbol || 
                state.gridConfig.gridLower !== this.gridLower ||
                state.gridConfig.gridUpper !== this.gridUpper ||
                state.gridConfig.gridNumber !== this.gridNumber) {
                console.log('⚠️  历史状态配置不匹配，从新状态开始');
                console.log(`   历史: ${state.symbol} [${state.gridConfig.gridLower}-${state.gridConfig.gridUpper}]`);
                console.log(`   当前: ${this.symbol} [${this.gridLower}-${this.gridUpper}]`);
                return;
            }
            
            // 恢复网格订单状态
            let restoredPositions = 0;
            for (const orderState of state.gridOrders) {
                if (orderState.hasPosition) {
                    this.gridOrders.set(orderState.level, {
                        price: orderState.price,
                        hasPosition: true,
                        entryPrice: orderState.entryPrice,
                        quantity: orderState.quantity,
                        buyOrderId: null,
                        sellOrderId: null
                    });
                    restoredPositions++;
                }
            }
            
            // 恢复统计数据
            this.totalProfit = state.totalProfit || 0;
            this.totalBuys = state.totalBuys || 0;
            this.totalSells = state.totalSells || 0;
            
            const stateAge = Math.floor((Date.now() - state.timestamp) / 1000 / 60);
            console.log('✅ 成功加载历史状态');
            console.log(`   恢复持仓: ${restoredPositions} 个网格`);
            console.log(`   累计盈利: $${this.totalProfit.toFixed(4)}`);
            console.log(`   总买入: ${this.totalBuys} | 总卖出: ${this.totalSells}`);
            console.log(`   状态时间: ${stateAge} 分钟前`);
            
        } catch (error) {
            console.error('❌ 加载状态失败:', error.message);
            console.log('   将从新状态开始');
        }
    }

    /**
     * 记录交易到日志文件
     */
    logTrade(tradeData) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                timestampMs: Date.now(),
                symbol: this.symbol,
                ...tradeData
            };
            
            // 追加写入JSONL格式（每行一个JSON对象）
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.tradeLogFile, logLine);
            
            console.log(`📝 交易记录已保存: ${this.tradeLogFile}`);
        } catch (error) {
            console.error('❌ 保存交易记录失败:', error.message);
        }
    }

    /**
     * 执行买入订单
     */
    async executeBuyOrder(gridLevel, price) {
        try {
            const quantity = this.amountPerGrid;
            
            console.log(`\n📈 执行买入订单 - 网格等级 ${gridLevel}`);
            console.log(`   价格: $${price.toFixed(6)}`);
            console.log(`   数量: ${quantity}`);
            console.log(`   总价值: $${(price * quantity).toFixed(4)}`);
            
            await globalThrottler.throttle();
            
            const orderParams = {
                symbol: this.symbol,
                side: 'Bid', // 买入
                orderType: this.orderType,
                quantity: quantity.toString(),
                ...(this.orderType === 'Limit' && { price: price.toString() }),
                timeInForce: this.timeInForce
            };
            
            const result = await this.api.executeOrder(orderParams);
            
            if (result && result.id) {
                // 更新网格状态
                const gridState = this.gridOrders.get(gridLevel);
                gridState.hasPosition = true;
                gridState.entryPrice = price;
                gridState.quantity = quantity;
                gridState.buyOrderId = result.id;
                
                this.totalBuys++;
                
                console.log('✅ 买入订单执行成功');
                console.log(`   订单ID: ${result.id}`);
                
                // 记录交易
                this.logTrade({
                    type: 'BUY',
                    gridLevel: gridLevel,
                    price: price,
                    quantity: quantity,
                    value: price * quantity,
                    orderId: result.id,
                    status: result.status
                });
                
                // 保存状态
                this.saveState();
                
                return true;
            } else {
                console.error('❌ 买入订单失败:', result);
                return false;
            }
        } catch (error) {
            console.error('❌ 执行买入订单异常:', error.message);
            return false;
        }
    }

    /**
     * 执行卖出订单
     */
    async executeSellOrder(gridLevel, price) {
        try {
            const gridState = this.gridOrders.get(gridLevel);
            const quantity = gridState.quantity;
            
            console.log(`\n📉 执行卖出订单 - 网格等级 ${gridLevel}`);
            console.log(`   出场价: $${price.toFixed(6)}`);
            console.log(`   数量: ${quantity}`);
            console.log(`   入场价: $${gridState.entryPrice.toFixed(6)}`);
            
            // 计算盈利
            const buyValue = gridState.entryPrice * quantity;
            const sellValue = price * quantity;
            const profit = sellValue - buyValue;
            const profitPercent = (profit / buyValue) * 100;
            
            console.log(`   预计盈利: $${profit.toFixed(4)} (${profitPercent.toFixed(2)}%)`);
            
            await globalThrottler.throttle();
            
            const orderParams = {
                symbol: this.symbol,
                side: 'Ask', // 卖出
                orderType: this.orderType,
                quantity: quantity.toString(),
                ...(this.orderType === 'Limit' && { price: price.toString() }),
                timeInForce: this.timeInForce
            };
            
            const result = await this.api.executeOrder(orderParams);
            
            if (result && result.id) {
                // 保存入场价格（用于记录）
                const entryPrice = gridState.entryPrice;
                
                // 更新网格状态
                gridState.hasPosition = false;
                gridState.entryPrice = 0;
                gridState.quantity = 0;
                gridState.sellOrderId = result.id;
                
                this.totalProfit += profit;
                this.totalSells++;
                
                console.log('✅ 卖出订单执行成功');
                console.log(`   订单ID: ${result.id}`);
                console.log(`   累计盈利: $${this.totalProfit.toFixed(4)}`);
                
                // 记录交易
                this.logTrade({
                    type: 'SELL',
                    gridLevel: gridLevel,
                    price: price,
                    entryPrice: entryPrice,
                    quantity: quantity,
                    value: sellValue,
                    profit: profit,
                    profitPercent: profitPercent,
                    totalProfit: this.totalProfit,
                    orderId: result.id,
                    status: result.status
                });
                
                // 保存状态
                this.saveState();
                
                return true;
            } else {
                console.error('❌ 卖出订单失败:', result);
                return false;
            }
        } catch (error) {
            console.error('❌ 执行卖出订单异常:', error.message);
            return false;
        }
    }

    /**
     * 检查并执行网格交易逻辑
     */
    async checkAndTrade() {
        try {
            // 获取当前价格
            const price = await this.getCurrentPrice();
            if (!price) {
                return;
            }
            
            this.currentPrice = price;
            
            // 检查价格是否在网格范围内
            if (price < this.gridLower || price > this.gridUpper) {
                console.log(`⚠️  当前价格 $${price.toFixed(6)} 超出网格范围 [$${this.gridLower} - $${this.gridUpper}]`);
                return;
            }
            
            console.log(`\n💹 当前价格: $${price.toFixed(6)}`);
            
            // 遍历所有网格级别
            for (let i = 0; i < this.gridLevels.length; i++) {
                const gridPrice = this.gridLevels[i];
                const gridState = this.gridOrders.get(i);
                
                // 买入逻辑：检查是否应该在此网格买入
                if (!gridState.hasPosition && !gridState.buyOrderId) {
                    let shouldBuy = false;
                    
                    // 首先检查：如果所有网格都没有持仓，允许在最接近价格的网格首次建仓
                    let hasAnyPosition = false;
                    for (let j = 0; j < this.gridLevels.length; j++) {
                        if (this.gridOrders.get(j).hasPosition) {
                            hasAnyPosition = true;
                            break;
                        }
                    }
                    
                    // 策略1: 首次建仓 - 在最接近当前价格的网格建仓
                    if (!hasAnyPosition) {
                        let closestGrid = 0;
                        let minDiff = Math.abs(this.gridLevels[0] - price);
                        
                        for (let j = 1; j < this.gridLevels.length; j++) {
                            const diff = Math.abs(this.gridLevels[j] - price);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closestGrid = j;
                            }
                        }
                        
                        if (i === closestGrid) {
                            shouldBuy = true;
                            console.log(`📍 首次建仓：在等级 ${i} ($${gridPrice.toFixed(6)}) 建仓（最接近当前价格）`);
                        }
                    }
                    // 策略2: 已有持仓后，价格必须跌破网格价格才能买入
                    else if (price <= gridPrice) {
                        // 策略2.1: 最低网格总是可以买入
                        if (i === 0) {
                            shouldBuy = true;
                        }
                        // 策略2.2: 如果上方网格有持仓，可以在下方建仓（链式建仓）
                        else if (i < this.gridLevels.length - 1) {
                            const upperGridState = this.gridOrders.get(i + 1);
                            if (upperGridState.hasPosition) {
                                shouldBuy = true;
                            }
                        }
                    }
                    
                    if (shouldBuy) {
                        await this.executeBuyOrder(i, price);
                        await this.sleep(1000); // 避免过快下单
                    }
                }
                
                // 卖出逻辑：价格上涨到网格价格以上，且该网格有持仓
                if (price >= gridPrice && gridState.hasPosition && !gridState.sellOrderId) {
                    // 确保价格上涨足够（至少到达下一个网格）
                    if (i < this.gridLevels.length - 1) {
                        const nextGridPrice = this.gridLevels[i + 1];
                        if (price >= nextGridPrice) {
                            await this.executeSellOrder(i, price);
                            await this.sleep(1000); // 避免过快下单
                        }
                    }
                }
            }
            
            // 打印网格状态
            this.printGridStatus();
            
        } catch (error) {
            console.error('❌ 检查交易逻辑异常:', error.message);
        }
    }

    /**
     * 打印网格状态
     */
    printGridStatus() {
        console.log('\n📊 网格状态:');
        
        let activePositions = 0;
        let totalInvested = 0;
        
        // 统计持仓
        for (let i = 0; i < this.gridLevels.length; i++) {
            const gridState = this.gridOrders.get(i);
            if (gridState.hasPosition) {
                activePositions++;
                totalInvested += gridState.entryPrice * gridState.quantity;
            }
        }
        
        // 显示摘要信息
        console.log(`   范围: $${this.gridLower.toFixed(2)}-$${this.gridUpper.toFixed(2)} | 价格: $${this.currentPrice.toFixed(6)} | 持仓: ${activePositions}/${this.gridNumber + 1}`);
        
        // 紧凑格式显示所有网格（每行5个）
        const gridsPerLine = 5;
        let line = '   ';
        
        for (let i = 0; i < this.gridLevels.length; i++) {
            const gridState = this.gridOrders.get(i);
            const status = gridState.hasPosition ? '🟢' : '⚪';
            const level = String(i).padStart(3, ' ');
            const price = gridState.price.toFixed(2).padStart(8, ' ');
            
            line += `${status}${level}:$${price} `;
            
            // 每5个网格换行，或者最后一个网格
            if ((i + 1) % gridsPerLine === 0 || i === this.gridLevels.length - 1) {
                console.log(line);
                line = '   ';
            }
        }
        
        console.log(`\n💰 已投资: $${totalInvested.toFixed(4)} | 💵 累计盈利: $${this.totalProfit.toFixed(4)}`);
        console.log(`📊 总买入: ${this.totalBuys} | 总卖出: ${this.totalSells}`);
        console.log(`⏰ 下次检查: ${new Date(Date.now() + this.checkInterval).toLocaleTimeString()}`);
    }

    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 启动策略
     */
    async start(initialDelay = 0) {
        if (this.isRunning) {
            console.log('⚠️  策略已经在运行中');
            return;
        }
        
        this.isRunning = true;
        console.log('\n🚀 启动Backpack网格交易策略...');
        console.log(`⏱️  检查间隔: ${this.checkInterval / 1000}秒`);
        
        // 如果有初始延迟，先等待（用于错开多个策略的检查周期）
        if (initialDelay > 0) {
            console.log(`⏱️  初始延迟: ${initialDelay / 1000}秒（错开检查周期）`);
            await this.sleep(initialDelay);
        }
        
        // 立即执行一次检查
        await this.checkAndTrade();
        
        // 设置定时检查
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                await this.checkAndTrade();
            }
        }, this.checkInterval);
        
        console.log('✅ 策略运行中... 按 Ctrl+C 停止');
    }

    /**
     * 停止策略
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  策略未在运行');
            return;
        }
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('\n🛑 策略已停止');
        this.printFinalReport();
    }

    /**
     * 打印最终报告
     */
    printFinalReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 Backpack网格交易最终报告');
        console.log('='.repeat(50));
        console.log(`交易对: ${this.symbol}`);
        console.log(`网格范围: $${this.gridLower} - $${this.gridUpper}`);
        console.log(`网格数量: ${this.gridNumber}`);
        console.log(`总买入: ${this.totalBuys} | 总卖出: ${this.totalSells}`);
        console.log(`累计盈利: $${this.totalProfit.toFixed(4)}`);
        console.log('='.repeat(50) + '\n');
    }

    /**
     * 显示账户信息
     */
    async displayAccountInfo() {
        try {
            console.log('\n💼 获取账户信息...');
            const balance = await this.getBalance();
            
            if (balance) {
                console.log('\n💼 账户余额:');
                // 解析交易对，获取基础币和报价币
                const [baseCurrency, quoteCurrency] = this.symbol.split('_');
                
                // 查找相关余额
                const baseBalance = balance[baseCurrency];
                const quoteBalance = balance[quoteCurrency];
                
                if (baseBalance) {
                    console.log(`   ${baseCurrency}: 可用 ${baseBalance.available} | 锁定 ${baseBalance.locked}`);
                }
                if (quoteBalance) {
                    console.log(`   ${quoteCurrency}: 可用 ${quoteBalance.available} | 锁定 ${quoteBalance.locked}`);
                }
                
                return balance;
            }
            return null;
        } catch (error) {
            console.error('❌ 获取账户信息失败:', error.message);
            return null;
        }
    }
}

// 导出策略类
export default BackpackGridStrategy;

// 如果直接运行此文件，则启动示例策略
if (import.meta.url === `file://${process.argv[1]}`) {
    // 配置示例（请根据实际情况修改）
    const config = {
        apiKey: 'your_api_key_here',
        apiSecret: 'your_api_secret_here',
        symbol: 'SOL_USDC',
        gridLower: 140,        // 网格下限 $140
        gridUpper: 160,        // 网格上限 $160
        gridNumber: 10,        // 10个网格
        amountPerGrid: 0.1,    // 每格交易 0.1 SOL
        orderType: 'Limit',    // 限价单
        checkInterval: 10000,  // 每10秒检查一次
        stopLossPercent: 0.05  // 5%止损
    };
    
    const strategy = new BackpackGridStrategy(config);
    
    // 显示账户信息
    strategy.displayAccountInfo().then(() => {
        // 启动策略
        strategy.start();
    });
    
    // 优雅退出处理
    process.on('SIGINT', () => {
        console.log('\n\n收到退出信号...');
        strategy.stop();
        process.exit(0);
    });
}

