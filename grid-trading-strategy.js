/**
 * 动态网格交易策略
 * 基于Bumpin API实现自动化网格交易
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

// 全局节流器实例（所有策略共享，确保API请求间隔至少5秒）
const globalThrottler = new APIThrottler(5000);

class GridTradingStrategy {
    constructor(config) {
        // 验证必需配置
        const requiredFields = ['apiKey', 'secretKey', 'symbol', 'marketIndex', 
                               'gridLower', 'gridUpper', 'gridNumber', 'investmentPerGrid'];
        for (const field of requiredFields) {
            // 对于数字字段，需要检查是否为 undefined 或 null（0 是有效值）
            if (config[field] === undefined || config[field] === null || config[field] === '') {
                throw new Error(`缺少必需配置项: ${field}`);
            }
        }

        // API配置
        this.api = new BumpinAPI(config.apiKey, config.secretKey);
        
        // 交易对配置
        this.symbol = config.symbol; // 例如: 'BTCUSD'
        this.marketIndex = config.marketIndex; // 市场索引
        
        // 网格配置
        this.gridLower = config.gridLower; // 网格下限价格
        this.gridUpper = config.gridUpper; // 网格上限价格
        this.gridNumber = config.gridNumber; // 网格数量
        this.investmentPerGrid = config.investmentPerGrid; // 每格投资金额
        
        // 杠杆和保证金配置
        this.leverage = config.leverage || 10; // 默认10倍杠杆
        this.isPortfolioMargin = config.isPortfolioMargin !== undefined ? config.isPortfolioMargin : true;
        this.isNativeToken = config.isNativeToken !== undefined ? config.isNativeToken : false;
        
        // 风险控制配置
        this.stopLossPercent = config.stopLossPercent || 0.05; // 止损百分比，默认5%
        this.takeProfitRate = config.takeProfitRate || 1; // 止盈率
        this.maxPositionSize = config.maxPositionSize || Infinity; // 最大持仓大小
        
        // 运行控制
        this.isRunning = false;
        this.checkInterval = config.checkInterval || 10000; // 检查间隔，默认10秒
        this.intervalId = null;
        
        // 网格状态
        this.gridLevels = []; // 网格价格级别
        this.gridOrders = new Map(); // 网格订单状态 {gridLevel: {hasPosition, entryPrice, size}}
        this.currentPrice = 0;
        this.totalProfit = 0;
        
        // 状态持久化文件路径
        this.stateFile = path.join(__dirname, `.grid-state-${this.symbol}-${this.marketIndex}.json`);
        
        // 交易记录文件路径
        this.tradeLogFile = path.join(__dirname, `.trade-log-${this.symbol}-${this.marketIndex}.jsonl`);
        
        // 初始化网格
        this.initializeGrid();
        
        // 加载历史状态
        this.loadState();
        
        console.log('✅ 网格策略初始化成功');
        console.log(`📊 交易对: ${this.symbol}`);
        console.log(`📈 网格范围: ${this.gridLower} - ${this.gridUpper}`);
        console.log(`🔢 网格数量: ${this.gridNumber}`);
        console.log(`💰 每格投资: ${this.investmentPerGrid}`);
        console.log(`⚡ 杠杆倍数: ${this.leverage}x`);
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
                buyOrderActive: false,
                sellOrderActive: false
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
                
                // 检查是否是频率限制错误
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
            // 全局节流：确保API请求间隔至少2秒
            await globalThrottler.throttle();
            
            const priceData = await this.retryApiCall(async () => {
                return await this.api.getPrice(this.symbol);
            });
            
            // Bumpin API 返回 code: 200 表示成功，或者 success: true
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
     * 获取当前持仓信息
     */
    async getCurrentPositions() {
        try {
            // 全局节流：确保API请求间隔至少2秒
            await globalThrottler.throttle();
            
            const positions = await this.api.getCurrentPositions();
            // Bumpin API 返回 code: 200 表示成功，或者 success: true
            if ((positions.code === 200 || positions.code === 0 || positions.success === true) && positions.data) {
                // 过滤当前市场的持仓
                return positions.data.filter(pos => pos.marketIndex === this.marketIndex);
            }
            return [];
        } catch (error) {
            console.error('❌ 获取持仓失败:', error.message);
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
                marketIndex: this.marketIndex,
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
                state.marketIndex !== this.marketIndex ||
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
                        size: orderState.size,
                        buyOrderActive: false,
                        sellOrderActive: false
                    });
                    restoredPositions++;
                }
            }
            
            // 恢复累计盈利
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
     * 计算订单大小（U本位计价）
     */
    calculateOrderSize(price) {
        // U本位：订单大小直接使用投资金额（美元）
        return this.investmentPerGrid;
    }

    /**
     * 计算订单保证金（币本位）
     */
    calculateOrderMargin(size, price) {
        // 保证金（币本位）= (订单金额U / 价格) / 杠杆
        // = 订单金额U / (价格 × 杠杆)
        const margin = size / (price * this.leverage);
        
        // 确保最低保证金不小于5U (转换为币本位)
        const minMarginUSD = 5;
        const minMarginCoin = minMarginUSD / price;
        
        return Math.max(margin, minMarginCoin);
    }

    /**
     * 执行买入订单（开多仓）
     */
    async executeBuyOrder(gridLevel, price) {
        try {
            const size = this.calculateOrderSize(price);
            const orderMargin = this.calculateOrderMargin(size, price);
            
            console.log(`\n📈 执行买入订单 - 网格等级 ${gridLevel}`);
            console.log(`   价格: $${price.toFixed(2)}`);
            console.log(`   订单金额(U): $${size.toFixed(2)}`);
            console.log(`   保证金(币): ${orderMargin.toFixed(8)} (约$${(orderMargin * price).toFixed(2)})`);
            
            const orderData = {
                marketIndex: this.marketIndex,
                isPortfolioMargin: this.isPortfolioMargin,
                isNativeToken: this.isNativeToken,
                positionSide: PositionSide.INCREASE, // 增加持仓
                orderSide: OrderSide.LONG, // 做多
                orderType: OrderType.MARKET, // 市价单
                stopType: StopType.NONE,
                size: size,
                orderMargin: orderMargin,
                leverage: this.leverage,
                triggerPrice: 0,
                acceptablePrice: 0,
                takeProfitRate: this.takeProfitRate
            };
            
            const result = await this.api.placeOrder(orderData);
            
            // Bumpin API 返回 code: 200 表示成功，或者 success: true
            if (result.code === 200 || result.code === 0 || result.success === true) {
                // 更新网格状态
                const gridState = this.gridOrders.get(gridLevel);
                gridState.hasPosition = true;
                gridState.entryPrice = price;
                gridState.size = size;
                gridState.buyOrderActive = false;
                
                console.log('✅ 买入订单执行成功');
                console.log(`   订单ID: ${result.data?.orderId || 'N/A'}`);
                
                // 记录交易
                this.logTrade({
                    type: 'BUY',
                    gridLevel: gridLevel,
                    price: price,
                    size: size,
                    orderMargin: orderMargin,
                    leverage: this.leverage,
                    orderId: result.data?.orderId || null
                });
                
                // 保存状态
                this.saveState();
                
                return true;
            } else {
                console.error('❌ 买入订单失败:', result.message || result.msg);
                return false;
            }
        } catch (error) {
            console.error('❌ 执行买入订单异常:', error.message);
            return false;
        }
    }

    /**
     * 执行卖出订单（平多仓）
     */
    async executeSellOrder(gridLevel, price) {
        try {
            const gridState = this.gridOrders.get(gridLevel);
            const size = gridState.size;
            
            console.log(`\n📉 执行卖出订单 - 网格等级 ${gridLevel}`);
            console.log(`   出场价: $${price.toFixed(2)}`);
            console.log(`   订单金额(U): $${size.toFixed(2)}`);
            console.log(`   入场价: $${gridState.entryPrice.toFixed(2)}`);
            
            // U本位盈利计算：订单金额 × (出场价/入场价 - 1)
            const priceChange = (price - gridState.entryPrice) / gridState.entryPrice;
            const profit = size * priceChange;
            console.log(`   预计盈利: $${profit.toFixed(4)} (${(priceChange * 100).toFixed(2)}%)`);
            
            const orderData = {
                marketIndex: this.marketIndex,
                isPortfolioMargin: this.isPortfolioMargin,
                isNativeToken: this.isNativeToken,
                positionSide: PositionSide.DECREASE, // 减少持仓
                orderSide: OrderSide.SHORT, // 平多
                orderType: OrderType.MARKET, // 市价单
                stopType: StopType.NONE,
                size: size,
                orderMargin: 0, // 平仓不需要额外保证金
                leverage: this.leverage,
                triggerPrice: 0,
                acceptablePrice: 0,
                takeProfitRate: this.takeProfitRate
            };
            
            const result = await this.api.placeOrder(orderData);
            
            // Bumpin API 返回 code: 200 表示成功，或者 success: true
            if (result.code === 200 || result.code === 0 || result.success === true) {
                // 保存入场价格（用于记录）
                const entryPrice = gridState.entryPrice;
                
                // 更新网格状态
                gridState.hasPosition = false;
                gridState.entryPrice = 0;
                gridState.size = 0;
                gridState.sellOrderActive = false;
                
                this.totalProfit += profit;
                
                console.log('✅ 卖出订单执行成功');
                console.log(`   订单ID: ${result.data?.orderId || 'N/A'}`);
                console.log(`   累计盈利: $${this.totalProfit.toFixed(4)}`);
                
                // 记录交易
                this.logTrade({
                    type: 'SELL',
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
                
                // 保存状态
                this.saveState();
                
                return true;
            } else {
                console.error('❌ 卖出订单失败:', result.message || result.msg);
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
                console.log(`⚠️  当前价格 $${price.toFixed(2)} 超出网格范围 [$${this.gridLower} - $${this.gridUpper}]`);
                return;
            }
            
            console.log(`\n💹 当前价格: $${price.toFixed(2)}`);
            
            // 遍历所有网格级别
            for (let i = 0; i < this.gridLevels.length; i++) {
                // console.log(`\n💹 当前价格: $${price.toFixed(2)}, 网格等级: ${i}, 网格价格: $${this.gridLevels[i].toFixed(2)}`);
                const gridPrice = this.gridLevels[i];
                const gridState = this.gridOrders.get(i);
                
                // 买入逻辑：检查是否应该在此网格买入
                if (!gridState.hasPosition && !gridState.buyOrderActive) {
                    let shouldBuy = false;
                    
                    // 首先检查：如果所有网格都没有持仓，允许在最接近价格的网格首次建仓
                    let hasAnyPosition = false;
                    for (let j = 0; j < this.gridLevels.length; j++) {
                        if (this.gridOrders.get(j).hasPosition) {
                            hasAnyPosition = true;
                            break;
                        }
                    }
                    
                    // 策略1: 首次建仓 - 在最接近当前价格的网格建仓（无需价格限制）
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
                        
                        // 如果当前网格是最接近的，允许首次建仓
                        if (i === closestGrid) {
                            shouldBuy = true;
                            console.log(`📍 首次建仓：在等级 ${i} ($${gridPrice.toFixed(2)}) 建仓（最接近当前价格 $${price.toFixed(2)}）`);
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
                if (price >= gridPrice && gridState.hasPosition && !gridState.sellOrderActive) {
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
                totalInvested += this.investmentPerGrid;
            }
        }
        
        // 显示摘要信息
        console.log(`   范围: $${this.gridLower.toFixed(0)}-$${this.gridUpper.toFixed(0)} | 价格: $${this.currentPrice.toFixed(2)} | 持仓: ${activePositions}/${this.gridNumber + 1}`);
        
        // 紧凑格式显示所有网格（每行5个）
        const gridsPerLine = 5;
        let line = '   ';
        
        for (let i = 0; i < this.gridLevels.length; i++) {
            const gridState = this.gridOrders.get(i);
            const status = gridState.hasPosition ? '🟢' : '⚪';
            const level = String(i).padStart(3, ' ');
            const price = gridState.price.toFixed(0).padStart(6, ' ');
            
            line += `${status}${level}:$${price} `;
            
            // 每5个网格换行，或者最后一个网格
            if ((i + 1) % gridsPerLine === 0 || i === this.gridLevels.length - 1) {
                console.log(line);
                line = '   ';
            }
        }
        
        console.log(`\n💰 已投资: $${totalInvested.toFixed(2)} | 💵 累计盈利: $${this.totalProfit.toFixed(4)}`);
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
        console.log('\n🚀 启动网格交易策略...');
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
        console.log('📊 网格交易最终报告');
        console.log('='.repeat(50));
        console.log(`交易对: ${this.symbol}`);
        console.log(`网格范围: $${this.gridLower} - $${this.gridUpper}`);
        console.log(`网格数量: ${this.gridNumber}`);
        console.log(`累计盈利: $${this.totalProfit.toFixed(4)}`);
        console.log('='.repeat(50) + '\n');
    }

    /**
     * 获取账户信息
     */
    async getAccountInfo() {
        try {
            // 全局节流：确保API请求间隔至少2秒
            await globalThrottler.throttle();
            
            const accountInfo = await this.retryApiCall(async () => {
                return await this.api.getAccountInfo();
            }, 3, 5000); // 最多重试3次，每次间隔3秒
            
            // Bumpin API 返回 code: 200 表示成功，或者 success: true
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
}

// 导出策略类
export default GridTradingStrategy;

// 如果直接运行此文件，则启动示例策略
if (import.meta.url === `file://${process.argv[1]}`) {
    // 配置示例（请根据实际情况修改）
    const config = {
        apiKey: 'your_api_key_here',
        secretKey: 'your_secret_key_here',
        symbol: 'BTCUSD',
        marketIndex: 0,
        gridLower: 60000,      // 网格下限 $60,000
        gridUpper: 70000,      // 网格上限 $70,000
        gridNumber: 10,        // 10个网格
        investmentPerGrid: 100, // 每格投资 $100
        leverage: 10,          // 10倍杠杆
        checkInterval: 10000,  // 每10秒检查一次
        stopLossPercent: 0.05, // 5%止损
        takeProfitRate: 1
    };
    
    const strategy = new GridTradingStrategy(config);
    
    // 显示账户信息
    strategy.getAccountInfo().then(() => {
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

