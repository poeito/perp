/**
 * 网格策略配置测试工具
 * 用于验证配置是否正确，无需实际下单
 */

import { BumpinAPI } from './bumpin-api.js';
import GridTradingStrategy from './grid-trading-strategy.js';
import { getGridStrategyConfig, checkConfig } from './config.js';

/**
 * 测试API连接
 */
async function testAPIConnection(apiKey, secretKey) {
    console.log('\n🔌 测试API连接...');
    
    try {
        const api = new BumpinAPI(apiKey, secretKey);
        const accountInfo = await api.getAccountInfo();
        
        // Bumpin API 返回 code: 200 表示成功，或者 success: true
        if (accountInfo.code === 200 || accountInfo.code === 0 || accountInfo.success === true) {
            console.log('✅ API连接成功');
            console.log(`   可用余额: ${accountInfo.data.availableBalance}`);
            return true;
        } else {
            console.log('❌ API连接失败:', accountInfo.message || accountInfo.msg);
            return false;
        }
    } catch (error) {
        console.log('❌ API连接异常:', error.message);
        return false;
    }
}

/**
 * 测试价格获取
 */
async function testPriceQuery(apiKey, secretKey, symbol) {
    console.log(`\n💹 测试价格查询 (${symbol})...`);
    
    try {
        const api = new BumpinAPI(apiKey, secretKey);
        const priceData = await api.getPrice(symbol);
        
        // Bumpin API 返回 code: 200 表示成功，或者 success: true
        if ((priceData.code === 200 || priceData.code === 0 || priceData.success === true) && priceData.data) {
            const price = parseFloat(priceData.data.price);
            console.log(`✅ 获取价格成功: $${price.toFixed(2)}`);
            return price;
        } else {
            console.log('❌ 获取价格失败:', priceData.message || priceData.msg);
            return null;
        }
    } catch (error) {
        console.log('❌ 价格查询异常:', error.message);
        return null;
    }
}

/**
 * 验证网格配置
 */
function validateGridConfig(config, currentPrice) {
    console.log('\n📊 验证网格配置...');
    
    const errors = [];
    const warnings = [];
    
    // 检查必需字段
    const requiredFields = ['apiKey', 'secretKey', 'symbol', 'marketIndex', 
                           'gridLower', 'gridUpper', 'gridNumber', 'investmentPerGrid'];
    for (const field of requiredFields) {
        // 对于数字字段，需要检查是否为 undefined 或 null（0 是有效值）
        if (config[field] === undefined || config[field] === null || config[field] === '') {
            errors.push(`缺少必需字段: ${field}`);
        }
    }
    
    // 检查网格范围
    if (config.gridLower && config.gridUpper) {
        if (config.gridLower >= config.gridUpper) {
            errors.push('网格下限必须小于上限');
        }
        
        const range = ((config.gridUpper - config.gridLower) / config.gridLower * 100).toFixed(2);
        console.log(`   网格范围: ${range}%`);
        
        if (range < 5) {
            warnings.push(`网格范围较窄 (${range}%)，可能交易机会较少`);
        }
        if (range > 30) {
            warnings.push(`网格范围较宽 (${range}%)，资金利用率可能较低`);
        }
    }
    
    // 检查价格是否在网格内
    if (currentPrice && config.gridLower && config.gridUpper) {
        if (currentPrice < config.gridLower || currentPrice > config.gridUpper) {
            warnings.push(`当前价格 $${currentPrice.toFixed(2)} 不在网格范围内 [$${config.gridLower} - $${config.gridUpper}]`);
        } else {
            const position = ((currentPrice - config.gridLower) / (config.gridUpper - config.gridLower) * 100).toFixed(2);
            console.log(`   当前价格位置: ${position}% (在网格内)`);
        }
    }
    
    // 检查网格数量
    if (config.gridNumber) {
        if (config.gridNumber < 3) {
            warnings.push('网格数量太少，建议至少5个');
        }
        if (config.gridNumber > 50) {
            warnings.push('网格数量过多，可能导致频繁交易');
        }
    }
    
    // 检查投资金额
    if (config.investmentPerGrid && config.gridNumber) {
        const totalInvestment = config.investmentPerGrid * config.gridNumber;
        console.log(`   总投资金额: $${totalInvestment}`);
        
        if (totalInvestment < 50) {
            warnings.push(`总投资金额较少 ($${totalInvestment})，可能收益有限`);
        }
    }
    
    // 检查杠杆
    if (config.leverage) {
        console.log(`   杠杆倍数: ${config.leverage}x`);
        
        if (config.leverage > 20) {
            warnings.push(`杠杆过高 (${config.leverage}x)，风险较大`);
        }
        if (config.leverage < 2) {
            warnings.push(`杠杆过低 (${config.leverage}x)，资金利用率低`);
        }
    }
    
    // 检查检查间隔
    if (config.checkInterval) {
        const seconds = config.checkInterval / 1000;
        console.log(`   检查间隔: ${seconds}秒`);
        
        if (config.checkInterval < 5000) {
            warnings.push('检查间隔过短，可能导致API限流');
        }
        if (config.checkInterval > 60000) {
            warnings.push('检查间隔过长，可能错过交易机会');
        }
    }
    
    // 显示结果
    if (errors.length > 0) {
        console.log('\n❌ 配置错误:');
        errors.forEach(err => console.log(`   - ${err}`));
    } else {
        console.log('\n✅ 配置验证通过');
    }
    
    if (warnings.length > 0) {
        console.log('\n⚠️  配置警告:');
        warnings.forEach(warn => console.log(`   - ${warn}`));
    }
    
    return { valid: errors.length === 0, errors, warnings };
}

/**
 * 预览网格布局
 */
function previewGridLayout(config, currentPrice) {
    console.log('\n🎯 网格布局预览:');
    console.log('='.repeat(70));
    
    const gridStep = (config.gridUpper - config.gridLower) / config.gridNumber;
    
    for (let i = config.gridNumber; i >= 0; i--) {
        const price = config.gridLower + (gridStep * i);
        const indicator = currentPrice && Math.abs(price - currentPrice) < gridStep / 2 ? ' 👈 当前价格附近' : '';
        const position = i === config.gridNumber ? ' (上限)' : i === 0 ? ' (下限)' : '';
        
        console.log(`   等级 ${i.toString().padStart(2)}: $${price.toFixed(2).padStart(10)}${position}${indicator}`);
    }
    
    console.log('='.repeat(70));
    console.log(`   网格间距: $${gridStep.toFixed(2)}`);
    console.log(`   每格收益(理论): $${(config.investmentPerGrid * gridStep / ((config.gridLower + config.gridUpper) / 2)).toFixed(4)}`);
}

/**
 * 主测试函数
 */
async function main() {
    console.log('🧪 网格策略配置测试工具');
    console.log('='.repeat(70));
    
    // 从 .env 文件加载配置
    console.log('\n📂 加载配置...');
    if (!checkConfig()) {
        process.exit(1);
    }
    
    const testConfig = getGridStrategyConfig();
    console.log('✅ 配置加载成功\n');
    
    // 1. 测试API连接
    const apiConnected = await testAPIConnection(testConfig.apiKey, testConfig.secretKey);
    if (!apiConnected) {
        console.log('\n❌ API连接失败，请检查密钥后重试');
        process.exit(1);
    }
    
    // 2. 测试价格查询
    const currentPrice = await testPriceQuery(testConfig.apiKey, testConfig.secretKey, testConfig.symbol);
    
    // 3. 验证配置
    const validation = validateGridConfig(testConfig, currentPrice);
    
    // 4. 预览网格布局
    if (validation.valid) {
        previewGridLayout(testConfig, currentPrice);
    }
    
    // 5. 生成建议
    console.log('\n💡 配置建议:');
    if (currentPrice) {
        const suggestedLower = Math.floor(currentPrice * 0.90 / 1000) * 1000;
        const suggestedUpper = Math.ceil(currentPrice * 1.10 / 1000) * 1000;
        console.log(`   基于当前价格 $${currentPrice.toFixed(2)}:`);
        console.log(`   - 建议下限: $${suggestedLower} (当前价格的 -10%)`);
        console.log(`   - 建议上限: $${suggestedUpper} (当前价格的 +10%)`);
        console.log(`   - 建议网格数: 8-12个`);
        console.log(`   - 建议每格投资: $10-50`);
    }
    
    // 6. 风险评估
    console.log('\n⚠️  风险评估:');
    let riskLevel = 0;
    const riskFactors = [];
    
    if (testConfig.leverage > 15) {
        riskLevel += 2;
        riskFactors.push('高杠杆');
    } else if (testConfig.leverage > 10) {
        riskLevel += 1;
        riskFactors.push('中等杠杆');
    }
    
    const range = ((testConfig.gridUpper - testConfig.gridLower) / testConfig.gridLower * 100);
    if (range > 25) {
        riskLevel += 1;
        riskFactors.push('宽网格范围');
    }
    
    const totalInvestment = testConfig.investmentPerGrid * testConfig.gridNumber;
    if (totalInvestment > 500) {
        riskLevel += 1;
        riskFactors.push('大额投资');
    }
    
    const riskLabels = ['低风险 ✅', '中低风险 ⚠️', '中等风险 ⚠️', '中高风险 🔸', '高风险 ⛔'];
    console.log(`   风险等级: ${riskLabels[Math.min(riskLevel, 4)]}`);
    if (riskFactors.length > 0) {
        console.log(`   风险因素: ${riskFactors.join(', ')}`);
    }
    
    // 7. 最终结论
    console.log('\n' + '='.repeat(70));
    if (validation.valid && validation.warnings.length === 0) {
        console.log('✅ 配置完美！可以启动策略了！');
        console.log('\n启动命令:');
        console.log('   node grid-strategy-example.js');
    } else if (validation.valid) {
        console.log('⚠️  配置有效但存在警告，请仔细审查后再启动');
    } else {
        console.log('❌ 配置存在错误，请修正后重试');
    }
    console.log('='.repeat(70));
}

// 运行测试
if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ 测试失败:', error.message);
        process.exit(1);
    });
}

module.exports = {
    testAPIConnection,
    testPriceQuery,
    validateGridConfig,
    previewGridLayout
};

