/**
 * 配置加载工具
 * 从.env文件或环境变量中加载配置
 */

import 'dotenv/config';

/**
 * 获取API配置
 */
function getApiConfig() {
    const apiKey = process.env.API_KEY;
    const secretKey = process.env.SECRET_KEY;
    
    if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error('请在.env文件中配置 API_KEY');
    }
    
    if (!secretKey || secretKey === 'your_secret_key_here') {
        throw new Error('请在.env文件中配置 SECRET_KEY');
    }
    
    return {
        apiKey,
        secretKey
    };
}

/**
 * 获取默认交易配置
 */
function getDefaultTradingConfig() {
    return {
        symbol: process.env.DEFAULT_SYMBOL || 'BTCUSD',
        marketIndex: parseInt(process.env.DEFAULT_MARKET_INDEX || '0'),
        leverage: parseInt(process.env.DEFAULT_LEVERAGE || '10')
    };
}

/**
 * 获取网格策略配置
 */
function getGridStrategyConfig() {
    const apiConfig = getApiConfig();
    const tradingConfig = getDefaultTradingConfig();
    
    return {
        ...apiConfig,
        symbol: tradingConfig.symbol,
        marketIndex: tradingConfig.marketIndex,
        leverage: tradingConfig.leverage,
        gridLower: parseFloat(process.env.GRID_LOWER || '60000'),
        gridUpper: parseFloat(process.env.GRID_UPPER || '70000'),
        gridNumber: parseInt(process.env.GRID_NUMBER || '10'),
        investmentPerGrid: parseFloat(process.env.INVESTMENT_PER_GRID || '10'),
        checkInterval: parseInt(process.env.CHECK_INTERVAL || '10000'),
        stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT || '0.05'),
        takeProfitRate: parseFloat(process.env.TAKE_PROFIT_RATE || '1'),
        maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '1000'),
        isPortfolioMargin: process.env.IS_PORTFOLIO_MARGIN !== 'false',
        isNativeToken: process.env.IS_NATIVE_TOKEN === 'true'
    };
}

/**
 * 检查配置是否完整
 */
function checkConfig() {
    try {
        const config = getApiConfig();
        console.log('✅ 配置加载成功');
        console.log(`   API_KEY: ${config.apiKey.substring(0, 10)}...`);
        console.log(`   SECRET_KEY: ${config.secretKey.substring(0, 10)}...`);
        return true;
    } catch (error) {
        console.error('❌ 配置加载失败:', error.message);
        console.log('\n💡 提示:');
        console.log('   1. 复制 env.example 为 .env');
        console.log('   2. 编辑 .env 文件，填入你的API密钥');
        console.log('   3. 重新运行程序');
        return false;
    }
}

export {
    getApiConfig,
    getDefaultTradingConfig,
    getGridStrategyConfig,
    checkConfig
};

