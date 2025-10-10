/**
 * 查询市场列表，确认各币种的 marketIndex
 */

import { BumpinAPI } from './bumpin-api.js';
import fs from 'fs';

async function checkMarkets() {
    try {
        // 从 grid-config.json 读取 API 密钥
        const config = JSON.parse(fs.readFileSync('./grid-config.json', 'utf8'));
        const strategy = config.strategies.btc_conservative;
        
        const api = new BumpinAPI(strategy.apiKey, strategy.secretKey);
        
        console.log('🔍 查询市场列表...\n');
        
        // 获取市场列表
        const markets = await api.getMarketList();
        
        if (markets.code === 200 || markets.success === true) {
            const marketList = markets.data;
            
            console.log('='.repeat(80));
            console.log('📊 所有市场列表');
            console.log('='.repeat(80));
            console.log('索引 | 交易对      | 最大杠杆 | 状态');
            console.log('-'.repeat(80));
            
            marketList.forEach((market, index) => {
                const idx = String(index).padStart(4);
                const symbol = market.symbol.padEnd(12);
                const leverage = String(market.maxLeverage || 'N/A').padStart(8);
                const status = market.marketStatus || 'N/A';
                
                console.log(`${idx} | ${symbol} | ${leverage} | ${status}`);
            });
            
            console.log('='.repeat(80));
            console.log('');
            
            // 查找常见币种
            console.log('🎯 常见币种的 marketIndex:\n');
            
            const commonSymbols = ['BTCUSD', 'ETHUSD', 'BNBUSD', 'SOLUSD', 'ADAUSD', 'DOGEUSD', 'XRPUSD'];
            
            commonSymbols.forEach(symbol => {
                const index = marketList.findIndex(m => m.symbol === symbol);
                if (index !== -1) {
                    const market = marketList[index];
                    console.log(`✅ ${symbol.padEnd(10)} → marketIndex: ${index} (最大杠杆: ${market.maxLeverage || 'N/A'}x)`);
                } else {
                    console.log(`❌ ${symbol.padEnd(10)} → 未找到`);
                }
            });
            
            console.log('');
            console.log('='.repeat(80));
            console.log('💡 使用方法：');
            console.log('   在 grid-config.json 中设置对应的 marketIndex');
            console.log('   例如：BNBUSD 的 marketIndex 应设置为上面显示的索引值');
            console.log('='.repeat(80));
            
        } else {
            console.error('❌ 获取市场列表失败:', markets.msg || markets.message);
        }
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    }
}

checkMarkets();

