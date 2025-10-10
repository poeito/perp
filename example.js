/**
 * Bumpin API SDK 使用示例
 * 展示如何使用SDK进行交易和查询操作
 */

import { BumpinAPI, OrderSide, OrderType, PositionSide, StopType } from './bumpin-api.js';
import { getApiConfig } from './config.js';

// 从环境变量加载API配置
let api;
try {
    const config = getApiConfig();
    api = new BumpinAPI(config.apiKey, config.secretKey);
    console.log('✅ API配置已从 .env 文件加载\n');
} catch (error) {
    console.error('❌ 配置加载失败:', error.message);
    console.log('💡 请先创建 .env 文件并配置 API_KEY 和 SECRET_KEY\n');
    process.exit(1);
}

async function exampleUsage() {
    try {
        console.log('=== Bumpin API SDK 使用示例 ===\n');

        // // 1. 获取账户信息
        // console.log('1. 获取账户信息:');
        // const accountInfo = await api.getAccountInfo();
        // console.log(accountInfo);
        // console.log('账户余额:', accountInfo.data.availableBalance);
        // console.log('用户代币:', accountInfo.data.userTokens);
        // console.log('');

        // // 2. 获取当前价格
        // console.log('2. 获取BTC价格:');
        // const btcPrice = await api.getPrice('BTCUSD');
        // console.log('BTC价格:', btcPrice.data.price);
        // console.log('');

        // // 3. 获取支持的价格符号
        // console.log('3. 获取支持的价格符号:');
        // const symbols = await api.getSupportedSymbols();
        // console.log('支持的符号:', symbols.data);
        // console.log('');

        // 4. 获取市场列表
        // console.log('4. 获取市场列表:');
        // const markets = await api.getMarketList();
        // console.log('市场数量:', markets.data.length);
        // console.log('第一个市场:', markets.data[0]);
        // console.log('');

        // 5. 获取当前持仓
        console.log('5. 获取当前持仓:');
        const positions = await api.getCurrentPositions();
        console.log('持仓数量:', positions.data.length);
        if (positions.data.length > 0) {
            console.log('第一个持仓:', positions.data[0]);
        }
        console.log('');

        // // 6. 获取当前订单
        // console.log('6. 获取当前订单:');
        // const orders = await api.getCurrentOrders();
        // console.log('订单数量:', orders.data.length);
        // if (orders.data.length > 0) {
        //     console.log('第一个订单:', orders.data[0]);
        // }
        // console.log('');

        // // 7. 获取持仓历史
        // console.log('7. 获取持仓历史:');
        // const positionHistory = await api.getPositionHistory(1, 10);
        // console.log('历史持仓数量:', positionHistory.data.records.length);
        // console.log('总记录数:', positionHistory.data.total);
        // console.log('');

        // {"marketIndex":0,"isPortfolioMargin":true,"isNativeToken":false,"positionSide":1,"orderSide":1,"orderType":1,
        // "stopType":0,"size":10,"orderMargin":1,"leverage":10,"triggerPrice":0,"acceptablePrice":0,"takeProfitRate":1}

        // // 8. 下单示例 - 开多仓
        console.log('8. 下单示例 (开多仓):');
        const openLongOrder = {
            marketIndex: 0,                    // 市场索引
            isPortfolioMargin: true,            // 使用投资组合保证金
            isNativeToken: false,               // 不使用原生代币
            positionSide: PositionSide.INCREASE, // 增加持仓
            orderSide: OrderSide.LONG,           // 多头
            orderType: OrderType.MARKET,        // 市价单
            stopType: StopType.NONE,            // 无止损
            size: 10,                            // 持仓大小
            orderMargin: 0.000008612158849010598, // 订单保证金
            leverage: 10,                      // 杠杆
            triggerPrice: 0,                    // 触发价格
            acceptablePrice: 0,                 // 可接受价格
            takeProfitRate: 1                   // 止盈率
        };
        
        console.log('开多仓订单数据:', openLongOrder);
        // 注意：实际下单需要有效的API密钥和足够的余额
        const orderResult = await api.placeOrder(openLongOrder);
        console.log('下单结果:', orderResult);
        console.log('');

        // // 9. 下单示例 - 平仓
        // console.log('9. 下单示例 (平仓):');
        // const closePositionOrder = {
        //     acceptablePrice: 0,                  // 可接受价格
        //     isNativeToken: false,               // 不使用原生代币
        //     isPortfolioMargin: true,            // 使用投资组合保证金
        //     leverage: 20,                       // 杠杆
        //     marketIndex: 0,                    // 市场索引
        //     orderMargin: 0,                      // 无需额外保证金
        //     orderSide: OrderSide.SHORT,          // 空头（平多仓）
        //     orderType: OrderType.MARKET,         // 市价单
        //     positionSide: PositionSide.DECREASE, // 减少持仓
        //     size: positions.data[0].positionSize,              // 平仓数量
        //     triggerPrice: 0,                     // 触发价格
        //     stopType: StopType.NONE,             // 无止损
        //     takeProfitRate: 1                    // 止盈率
        // };
        
        // console.log('平仓订单数据:', closePositionOrder);
        // const orderResult = await api.placeOrder(closePositionOrder);
        // console.log('下单结果:', orderResult);
        // console.log('');

        console.log('=== 示例完成 ===');

    } catch (error) {
        console.error('示例执行出错:', error.message);
    }
}

// 运行示例
if (require.main === module) {
    exampleUsage();
}

module.exports = { exampleUsage };

