/**
 * 动态网格交易策略 - 做空版本
 * 适用于单边下跌市场
 * 策略：价格上涨时开空仓，价格下跌时平仓获利
 */

import { BumpinAPI, OrderSide, OrderType, PositionSide, StopType } from './bumpin-api.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 全局API请求节流器
class APIThrottler {
    constructor(minInterval = 5000) {
        this.minInterval = minInterval;
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

// 全局节流器实例（所有策略共享）
const globalThrottler = new APIThrottler(5000);

class GridTradingStrategyShort {
    constructor(config) {
        // 验证必需配置
        const requiredFields = ['apiKey', 'secretKey', 'symbol', 'marketIndex', 
                               'gridLower', 'gridUpper', 'gridNumber', 'investmentPerGrid'];
        for (const field of requiredFields) {
            if (config[field] === undefined || config[field] === null || config[field] === '') {
                throw new Error(`缺少必需配置项: ${field}`);
            }
        }

        // API配置
        this.api = new BumpinAPI(config.apiKey, config.secretKey);
        
        // 交易对配置
        this.symbol = config.symbol;
        this.marketIndex = config.marketIndex;
        
        // 网格配置
        this.gridLower = config.gridLower;
        this.gridUpper = config.gridUpper;
        this.gridNumber = config.gridNumber;
        this.investmentPerGrid = config.investmentPerGrid;
        
        // 杠杆和保证金配置
        this.leverage = config.leverage || 10;
        this.isPortfolioMargin = config.isPortfolioMargin !== undefined ? config.isPortfolioMargin : true;
        this.isNativeToken = config.isNativeToken !== undefined ? config.isNativeToken : false;
        
        // 风险控制配置
        this.stopLossPercent = config.stopLossPercent || 0.05;
        this.takeProfitRate = config.takeProfitRate || 1;
        this.maxPositionSize = config.maxPositionSize || Infinity;
        
        // 运行控制
        this.isRunning = false;
        this.checkInterval = config.checkInterval || 10000;
        this.intervalId = null;
        
        // 网格状态
        this.gridLevels = [];
        this.gridOrders = new Map();
        this.currentPrice = 0;
        this.totalProfit = 0;
        
        // 状态持久化文件路径
        this.stateFile = path.join(__dirname, `.grid-state-short-${this.symbol}-${this.marketIndex}.json`);
        
        // 交易记录文件路径
        this.tradeLogFile = path.join(__dirname, `.trade-log-short-${this.symbol}-${this.marketIndex}.jsonl`);
        
        // 初始化网格
        this.initializeGrid();
        
        // 加载历史状态
        this.loadState();
        
        console.log('✅ 做空网格策略初始化成功');
        console.log(`📊 交易对: ${this.symbol}`);
        console.log(`📉 网格范围: ${this.gridLower} - ${this.gridUpper}`);
        console.log(`🔢 网格数量: ${this.gridNumber}`);
        console.log(`💰 每格投资: ${this.investmentPerGrid}`);
        console.log(`⚡ 杠杆倍数: ${this.leverage}x`);
        console.log(`🔻 策略类型: 做空（适合下跌市场）`);
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
                size: 0,
                sellOrderActive: false,  // 做空开仓
                buyOrderActive: false    // 平空仓
            });
        }
        
        console.log('🎯 网格级别已初始化:');
        this.gridLevels.forEach((price, index) => {
            console.log(`   等级 ${index}: $${price.toFixed(2)}`);
        });
    }

    /**
     * 带重试的 API 请求辅助方法
     */
    async retryApiCall(apiCall, maxRetries = 3, retryDelay = 5000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await apiCall();
                
                if (result && result.code === 429) {
                    console.log(`⏱️  API限流 (429)，等待 ${retryDelay}ms 后重试 (${attempt}/${maxRetries})...`);
                    if (attempt < maxRetries) {
                        await this.sleep(retryDelay);
                        continue;
                    }
                }
                
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
            await globalThrottler.throttle();
            
            const priceData = await this.retryApiCall(async () => {
                return await this.api.getPrice(this.symbol);
            });
            
            if ((priceData.code === 200 || priceData.code === 0 || priceData.success === true) && priceData.data && priceData.data.price) {
                return parseFloat(priceData.data.price);
            }
            throw new Error('无法获取有效价格数据');
        } catch (error) {
            console.error('❌ 获取价格失败:', error.message);
            return null;
        }
    }

    /**
     * 获取账户信息
     */
    async getAccountInfo() {
        try {
            await globalThrottler.throttle();
            
            const accountInfo = await this.retryApiCall(async () => {
                return await this.api.getAccountInfo();
            }, 3, 5000);
            
            if (accountInfo.code === 200 || accountInfo.code === 0 || accountInfo.success === true) {
                console.log('\n💼 账户信息:');
                console.log(`   可用余额: ${accountInfo.data.availableBalance}`);
                console.log(`   总余额: ${accountInfo.data.totalBalance || 'N/A'}`);
                return accountInfo.data;
            }
            return null;
        } catch (error) {
            console.error('❌ 获取账户信息失败:', error.message);
            return null;
        }
    }

    /**
     * 保存网格状态
     */
    saveState() {
        try {
            const state = {
                timestamp: Date.now(),
                symbol: this.symbol,
                marketIndex: this.marketIndex,
                strategyType: 'SHORT',
                gridConfig: {
                    gridLower: this.gridLower,
                    gridUpper: this.gridUpper,
                    gridNumber: this.gridNumber,
                    investmentPerGrid: this.investmentPerGrid
                },
                totalProfit: this.totalProfit,
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
     * 加载网格状态
     */
    loadState() {
        try {
            if (!fs.existsSync(this.stateFile)) {
                console.log('📂 未找到历史状态文件，从新状态开始');
                return;
            }
            
            const data = fs.readFileSync(this.stateFile, 'utf8');
            const state = JSON.parse(data);
            
            if (state.symbol !== this.symbol ||
                state.marketIndex !== this.marketIndex ||
                state.strategyType !== 'SHORT' ||
                state.gridConfig.gridLower !== this.gridLower ||
                state.gridConfig.gridUpper !== this.gridUpper ||
                state.gridConfig.gridNumber !== this.gridNumber) {
                console.log('⚠️  历史状态配置不匹配，从新状态开始');
                return;
            }
            
            let restoredPositions = 0;
            for (const orderState of state.gridOrders) {
                if (orderState.hasPosition) {
                    this.gridOrders.set(orderState.level, {
                        price: orderState.price,
                        hasPosition: true,
                        entryPrice: orderState.entryPrice,
                        size: orderState.size,
                        sellOrderActive: false,
                        buyOrderActive: false
                    });
                    restoredPositions++;
                }
            }
            
            this.totalProfit = state.totalProfit || 0;
            
            const stateAge = Math.floor((Date.now() - state.timestamp) / 1000 / 60);
            console.log('✅ 成功加载历史状态');
            console.log(`   恢复持仓: ${restoredPositions} 个网格`);
            console.log(`   累计盈利: $${this.totalProfit.toFixed(4)}`);
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
                marketIndex: this.marketIndex,
                strategyType: 'SHORT',
                ...tradeData
            };
            
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.tradeLogFile, logLine);
            
            console.log(`📝 交易记录已保存: ${this.tradeLogFile}`);
        } catch (error) {
            console.error('❌ 保存交易记录失败:', error.message);
        }
    }

    /**
     * 计算订单大小（U本位）
     */
    calculateOrderSize(price) {
        return this.investmentPerGrid;
    }

    /**
     * 计算订单保证金（币本位）
     */
    calculateOrderMargin(size, price) {
        const margin = size / (price * this.leverage);
        const minMarginUSD = 5;
        const minMarginCoin = minMarginUSD / price;
        return Math.max(margin, minMarginCoin);
    }

    /**
     * 执行做空订单（开空仓）
     */
    async executeSellOrder(gridLevel, price) {
        try {
            const size = this.calculateOrderSize(price);
            const orderMargin = this.calculateOrderMargin(size, price);
            
            console.log(`\n📉 执行做空订单 - 网格等级 ${gridLevel}`);
            console.log(`   开仓价: $${price.toFixed(2)}`);
            console.log(`   订单金额(U): $${size.toFixed(2)}`);
            console.log(`   保证金(币): ${orderMargin.toFixed(8)}`);
            
            const orderData = {
                marketIndex: this.marketIndex,
                isPortfolioMargin: this.isPortfolioMargin,
                isNativeToken: this.isNativeToken,
                positionSide: PositionSide.INCREASE,
                orderSide: OrderSide.SHORT,  // 做空
                orderType: OrderType.MARKET,
                stopType: StopType.NONE,
                size: size,
                orderMargin: orderMargin,
                leverage: this.leverage,
                triggerPrice: 0,
                acceptablePrice: 0,
                takeProfitRate: this.takeProfitRate
            };
            
            const result = await this.api.placeOrder(orderData);
            
            if (result.code === 200 || result.code === 0 || result.success === true) {
                const gridState = this.gridOrders.get(gridLevel);
                gridState.hasPosition = true;
                gridState.entryPrice = price;
                gridState.size = size;
                gridState.sellOrderActive = false;
                
                console.log('✅ 做空订单执行成功');
                console.log(`   订单ID: ${result.data?.orderId || 'N/A'}`);
                
                this.logTrade({
                    type: 'SELL_SHORT',
                    gridLevel: gridLevel,
                    price: price,
                    size: size,
                    orderMargin: orderMargin,
                    leverage: this.leverage,
                    orderId: result.data?.orderId || null
                });
                
                this.saveState();
                return true;
            } else {
                console.error('❌ 做空订单失败:', result.message || result.msg);
                return false;
            }
        } catch (error) {
            console.error('❌ 执行做空订单异常:', error.message);
            return false;
        }
    }

    /**
     * 执行平空订单（买入回补）
     */
    async executeBuyOrder(gridLevel, price) {
        try {
            const gridState = this.gridOrders.get(gridLevel);
            const size = gridState.size;
            
            console.log(`\n📈 执行平空订单 - 网格等级 ${gridLevel}`);
            console.log(`   平仓价: $${price.toFixed(2)}`);
            console.log(`   订单金额(U): $${size.toFixed(2)}`);
            console.log(`   开仓价: $${gridState.entryPrice.toFixed(2)}`);
            
            // 做空盈利计算：开仓价 - 平仓价
            const priceChange = (gridState.entryPrice - price) / gridState.entryPrice;
            const profit = size * priceChange;
            console.log(`   预计盈利: $${profit.toFixed(4)} (${(priceChange * 100).toFixed(2)}%)`);
            
            const orderData = {
                marketIndex: this.marketIndex,
                isPortfolioMargin: this.isPortfolioMargin,
                isNativeToken: this.isNativeToken,
                positionSide: PositionSide.DECREASE,
                orderSide: OrderSide.LONG,  // 平空（买入）
                orderType: OrderType.MARKET,
                stopType: StopType.NONE,
                size: size,
                orderMargin: 0,
                leverage: this.leverage,
                triggerPrice: 0,
                acceptablePrice: 0,
                takeProfitRate: this.takeProfitRate
            };
            
            const result = await this.api.placeOrder(orderData);
            
            if (result.code === 200 || result.code === 0 || result.success === true) {
                const entryPrice = gridState.entryPrice;
                
                gridState.hasPosition = false;
                gridState.entryPrice = 0;
                gridState.size = 0;
                gridState.buyOrderActive = false;
                
                this.totalProfit += profit;
                
                console.log('✅ 平空订单执行成功');
                console.log(`   订单ID: ${result.data?.orderId || 'N/A'}`);
                console.log(`   累计盈利: $${this.totalProfit.toFixed(4)}`);
                
                this.logTrade({
                    type: 'BUY_COVER',
                    gridLevel: gridLevel,
                    price: price,
                    entryPrice: entryPrice,
                    size: size,
                    profit: profit,
                    profitPercent: priceChange * 100,
                    totalProfit: this.totalProfit,
                    leverage: this.leverage,
                    orderId: result.data?.orderId || null
                });
                
                this.saveState();
                return true;
            } else {
                console.error('❌ 平空订单失败:', result.message || result.msg);
                return false;
            }
        } catch (error) {
            console.error('❌ 执行平空订单异常:', error.message);
            return false;
        }
    }

    /**
     * 检查并执行交易
     * 做空策略逻辑：
     * - 开仓：价格上涨到网格价格时，开空仓
     * - 平仓：价格下跌到更低网格时，平仓获利
     */
    async checkAndTrade() {
        try {
            const price = await this.getCurrentPrice();
            if (!price) {
                return;
            }
            
            this.currentPrice = price;
            
            if (price < this.gridLower || price > this.gridUpper) {
                console.log(`⚠️  当前价格 $${price.toFixed(2)} 超出网格范围 [$${this.gridLower} - $${this.gridUpper}]`);
                return;
            }
            
            console.log(`\n💹 当前价格: $${price.toFixed(2)}`);
            
            // 遍历所有网格级别
            for (let i = 0; i < this.gridLevels.length; i++) {
                const gridPrice = this.gridLevels[i];
                const gridState = this.gridOrders.get(i);
                
                // 做空开仓逻辑：价格上涨到网格价格以上时，开空仓
                if (!gridState.hasPosition && !gridState.sellOrderActive) {
                    let shouldSell = false;
                    
                    // 检查是否有持仓
                    let hasAnyPosition = false;
                    for (let j = 0; j < this.gridLevels.length; j++) {
                        if (this.gridOrders.get(j).hasPosition) {
                            hasAnyPosition = true;
                            break;
                        }
                    }
                    
                    // 策略1: 首次建仓 - 在最接近当前价格的网格开空仓
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
                            shouldSell = true;
                            console.log(`📍 首次建仓：在等级 ${i} ($${gridPrice.toFixed(2)}) 开空仓（最接近当前价格）`);
                        }
                    }
                    // 策略2: 已有持仓后，价格必须突破网格价格才能开仓
                    else if (price >= gridPrice) {
                        // 最高网格总是可以开仓
                        if (i === this.gridLevels.length - 1) {
                            shouldSell = true;
                        }
                        // 如果下方网格有持仓，可以在上方开空仓（链式开仓）
                        else if (i > 0) {
                            const lowerGridState = this.gridOrders.get(i - 1);
                            if (lowerGridState.hasPosition) {
                                shouldSell = true;
                            }
                        }
                    }
                    
                    if (shouldSell) {
                        await this.executeSellOrder(i, price);
                        await this.sleep(1000);
                    }
                }
                
                // 平空逻辑：价格下跌到网格价格以下，且该网格有持仓
                if (price <= gridPrice && gridState.hasPosition && !gridState.buyOrderActive) {
                    // 确保价格下跌足够（至少到达下一个网格）
                    if (i > 0) {
                        const lowerGridPrice = this.gridLevels[i - 1];
                        if (price <= lowerGridPrice) {
                            await this.executeBuyOrder(i, price);
                            await this.sleep(1000);
                        }
                    }
                }
            }
            
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
        
        for (let i = 0; i < this.gridLevels.length; i++) {
            const gridState = this.gridOrders.get(i);
            if (gridState.hasPosition) {
                activePositions++;
                totalInvested += this.investmentPerGrid;
            }
        }
        
        console.log(`   范围: $${this.gridLower.toFixed(0)}-$${this.gridUpper.toFixed(0)} | 价格: $${this.currentPrice.toFixed(2)} | 空仓: ${activePositions}/${this.gridNumber + 1}`);
        
        const gridsPerLine = 5;
        let line = '   ';
        
        for (let i = 0; i < this.gridLevels.length; i++) {
            const gridState = this.gridOrders.get(i);
            const status = gridState.hasPosition ? '🔻' : '⚪';
            const level = String(i).padStart(3, ' ');
            const price = gridState.price.toFixed(0).padStart(6, ' ');
            
            line += `${status}${level}:$${price} `;
            
            if ((i + 1) % gridsPerLine === 0 || i === this.gridLevels.length - 1) {
                console.log(line);
                line = '   ';
            }
        }
        
        console.log(`\n💰 已开空仓: $${totalInvested.toFixed(2)} | 💵 累计盈利: $${this.totalProfit.toFixed(4)}`);
        console.log(`⏰ 下次检查: ${new Date(Date.now() + this.checkInterval).toLocaleTimeString()}`);
    }

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
        console.log('\n🚀 启动做空网格交易策略...');
        console.log(`⏱️  检查间隔: ${this.checkInterval / 1000}秒`);
        
        if (initialDelay > 0) {
            console.log(`⏱️  初始延迟: ${initialDelay / 1000}秒（错开检查周期）`);
            await this.sleep(initialDelay);
        }
        
        await this.checkAndTrade();
        
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                await this.checkAndTrade();
            }
        }, this.checkInterval);
        
        console.log('✅ 策略运行中...');
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

    printFinalReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 做空网格交易最终报告');
        console.log('='.repeat(50));
        console.log(`交易对: ${this.symbol}`);
        console.log(`网格范围: $${this.gridLower} - $${this.gridUpper}`);
        console.log(`网格数量: ${this.gridNumber}`);
        console.log(`累计盈利: $${this.totalProfit.toFixed(4)}`);
        console.log('='.repeat(50) + '\n');
    }
}

export default GridTradingStrategyShort;
