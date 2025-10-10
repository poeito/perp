# Bumpin API SDK & 网格交易策略

## 📚 项目简介

这是一个功能完整的 Bumpin 交易所 JavaScript SDK，并包含了一个强大的**动态网格交易策略**实现。

### 主要功能

- ✅ 完整的 Bumpin API 封装
- ✅ 自动化网格交易策略
- ✅ 多种预设策略配置
- ✅ 实时价格监控和自动下单
- ✅ 风险控制和止损机制
- ✅ 详细的交易日志和报告

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 密钥（使用 .env 文件）

**自动设置（推荐）：**
```bash
npm run setup
```

然后编辑生成的 `.env` 文件，填入你的 API 密钥：
```bash
API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

**手动设置：**
```bash
cp env.example .env
# 编辑 .env 文件，填入你的密钥
```

> 📖 详细配置说明：[环境变量配置指南](ENV_SETUP_GUIDE.md)

### 3. 测试配置

```bash
npm run grid-test
```

### 4. 启动网格策略

```bash
# 使用 .env 中的配置启动
npm run grid

# 或选择预设策略
npm run grid-btc-conservative  # 保守型
npm run grid-btc-neutral       # 中性型
npm run grid-btc-aggressive    # 激进型
```

### 基础 API 使用

```javascript
const { BumpinAPI } = require('./bumpin-api');
const { getApiConfig } = require('./config');

// 从 .env 加载配置
const config = getApiConfig();
const api = new BumpinAPI(config.apiKey, config.secretKey);

// 获取价格
const price = await api.getPrice('BTCUSD');

// 获取持仓
const positions = await api.getCurrentPositions();
```

详细教程请查看 [快速开始指南](QUICKSTART.md)

## 📖 文档

- [快速开始指南](QUICKSTART.md) - 5分钟上手
- [环境变量配置指南](ENV_SETUP_GUIDE.md) - .env 文件配置说明
- [网格策略完整文档](GRID_STRATEGY_README.md) - 详细说明和配置
- [API分析文档](API_ISSUE_ANALYSIS.md) - API问题分析

## 📁 项目结构

```
bumpin/
├── bumpin-api.js                  # Bumpin API SDK 核心
├── config.js                      # 配置加载工具（支持 .env）
├── grid-trading-strategy.js       # 网格交易策略核心
├── grid-strategy-example.js       # 策略使用示例
├── grid-strategy-runner.js        # 配置文件策略运行器
├── grid-config-template.json      # 配置模板
├── test-grid-config.js            # 配置测试工具
├── setup.js                       # 快速设置脚本
├── env.example                    # 环境变量配置模板
├── .env                           # 环境变量配置（需自行创建）
├── .gitignore                     # Git 忽略配置
├── example.js                     # API使用示例
├── test.js                        # API测试文件
├── README.md                      # 项目说明（本文件）
├── QUICKSTART.md                  # 快速开始指南
├── ENV_SETUP_GUIDE.md             # 环境变量配置指南
├── GRID_STRATEGY_README.md        # 网格策略详细文档
└── package.json                   # 项目配置
```

## 🎯 网格交易策略

### 什么是网格交易？

网格交易是一种在震荡行情中低买高卖的量化策略：

1. 在价格区间内设置多个网格
2. 价格下跌到网格点时自动买入
3. 价格上涨到上层网格时自动卖出
4. 持续套利获得收益

### 策略特点

- 🤖 **全自动执行**：无需人工干预
- 📊 **实时监控**：显示网格状态和盈亏
- 🛡️ **风险控制**：支持止损止盈
- ⚙️ **灵活配置**：多种预设和自定义配置
- 📈 **适合震荡市**：在波动行情中表现优异

### 运行示例

```bash
# 方式1: 使用内置示例
npm run grid

# 方式2: 使用配置文件
npm run grid-btc-conservative

# 方式3: 自定义策略
node grid-strategy-runner.js my_strategy
```

### 策略输出示例

```
🎯 动态网格交易策略
======================================================================
📋 策略信息:
   名称: BTC保守型策略
   交易对: BTCUSD
   网格范围: $60000 - $70000
   网格数量: 10

💹 当前价格: $65432.10

📊 网格状态:
   等级 0: 🟢 持仓 $60000.00 | 入场: $60100.00 | 数量: 0.001661
   等级 1: ⚪ 空闲 $61000.00
   等级 2: 🟢 持仓 $62000.00 | 入场: $61900.00 | 数量: 0.001616
   等级 3: 🟢 持仓 $63000.00 | 入场: $62950.00 | 数量: 0.001589
   等级 4: 🟢 持仓 $64000.00 | 入场: $63980.00 | 数量: 0.001563
   等级 5: 🟢 持仓 $65000.00 | 入场: $64900.00 | 数量: 0.001541
   等级 6: ⚪ 空闲 $66000.00
   等级 7: ⚪ 空闲 $67000.00
   等级 8: ⚪ 空闲 $68000.00
   等级 9: ⚪ 空闲 $69000.00
   等级 10: ⚪ 空闲 $70000.00

📈 活跃持仓: 5
💰 已投资金额: $500.00
💵 累计盈利: $12.45
⏰ 下次检查: 10:30:45
```

## 🔧 配置说明

### 基础配置

```json
{
  "apiKey": "your_api_key",
  "secretKey": "your_secret_key",
  "symbol": "BTCUSD",
  "marketIndex": 0,
  "gridLower": 60000,
  "gridUpper": 70000,
  "gridNumber": 10,
  "investmentPerGrid": 10,
  "leverage": 10
}
```

### 关键参数说明

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `gridLower` | 网格下限价格 | 当前价格 × 0.90 |
| `gridUpper` | 网格上限价格 | 当前价格 × 1.10 |
| `gridNumber` | 网格数量 | 5-20 |
| `investmentPerGrid` | 每格投资金额 | 总资金 ÷ 网格数量 |
| `leverage` | 杠杆倍数 | 5-20 |
| `checkInterval` | 检查间隔(毫秒) | 10000-30000 |

详细配置说明请查看 [配置模板](grid-config-template.json)

## 💻 可用命令

### 设置和测试

```bash
npm run setup      # 创建 .env 配置文件
npm run grid-test  # 测试配置是否正确
```

### API 相关

```bash
npm run example    # 运行 API 使用示例
npm run test       # 运行 API 测试
```

### 网格策略相关

```bash
npm run grid                   # 运行内置示例策略
npm run grid-list              # 列出所有可用策略
npm run grid-btc-conservative  # 运行保守型策略
npm run grid-btc-neutral       # 运行中性策略
npm run grid-btc-aggressive    # 运行激进型策略
```

## 📊 API功能

### 交易功能
- ✅ 下单（市价单、限价单）
- ✅ 开仓（多头、空头）
- ✅ 平仓
- ✅ 止损止盈

### 查询功能
- ✅ 获取账户信息
- ✅ 获取当前持仓
- ✅ 获取当前订单
- ✅ 获取持仓历史
- ✅ 获取市场价格
- ✅ 获取市场列表

### 市场数据
- ✅ 实时价格查询
- ✅ 支持的交易对列表
- ✅ 市场信息查询

## ⚠️ 风险提示

### 重要警告

1. **市场风险**
   - 网格策略适合震荡行情
   - 单边趋势行情可能导致亏损
   - 价格突破网格区间需要调整参数

2. **资金风险**
   - 杠杆会放大收益和亏损
   - 确保账户有足够保证金
   - 建议使用不超过总资金20-30%

3. **技术风险**
   - 网络延迟可能影响交易
   - API限流可能影响执行
   - 程序异常可能中断策略

### 使用建议

✅ 先用小额资金测试（$50-100）  
✅ 在震荡行情中使用  
✅ 设置合理的止损  
✅ 定期检查策略状态  
✅ 重大新闻前暂停策略  
❌ 不要使用全部资金  
❌ 不要在强趋势行情中使用  
❌ 不要使用过高杠杆  

## 📈 预期收益

### 震荡行情（理想）
- 保守策略：日收益 0.3-0.8%
- 中性策略：日收益 0.5-1.5%
- 激进策略：日收益 1.0-3.0%

### 单边行情（不利）
- 可能出现浮动亏损
- 建议及时调整或暂停

### 影响因素
- 市场波动性
- 网格参数设置
- 杠杆倍数
- 交易手续费

## 🛠️ 高级功能

### 自定义策略

```javascript
const GridTradingStrategy = require('./grid-trading-strategy');

const strategy = new GridTradingStrategy({
    apiKey: 'your_key',
    secretKey: 'your_secret',
    symbol: 'BTCUSD',
    marketIndex: 0,
    gridLower: 60000,
    gridUpper: 70000,
    gridNumber: 10,
    investmentPerGrid: 10,
    leverage: 10,
    checkInterval: 10000
});

await strategy.start();
```

### 策略监控

策略提供实时监控功能：
- 当前价格和网格状态
- 持仓数量和盈亏
- 交易执行日志
- 最终收益报告

### 优雅停止

按 `Ctrl+C` 停止策略，会自动生成报告：
```
==================================================
📊 网格交易最终报告
==================================================
交易对: BTCUSD
网格范围: $60000 - $70000
网格数量: 10
累计盈利: $125.50
==================================================
```

## 🔐 安全性

- ✅ API 密钥安全传输
- ✅ 请求签名验证
- ✅ 时间戳防重放
- ✅ 配置文件不提交到Git

**注意**：请勿在公开场合分享你的API密钥！

## 📞 技术支持

### 问题排查

1. **API连接失败**
   - 检查API密钥是否正确
   - 检查网络连接
   - 查看API官方状态

2. **策略不交易**
   - 确认价格在网格范围内
   - 检查账户余额
   - 查看日志错误信息

3. **订单失败**
   - 检查账户余额
   - 确认保证金充足
   - 查看API错误码

### 常见问题

详细FAQ请查看 [网格策略文档](GRID_STRATEGY_README.md#常见问题)

## 📝 更新日志

### v1.0.0 (2024-10-03)
- ✅ 完整的 Bumpin API SDK
- ✅ 动态网格交易策略
- ✅ 多种预设配置
- ✅ 配置文件支持
- ✅ 详细文档

## 📄 许可证

MIT License

## ⚖️ 免责声明

本项目仅供学习和研究使用。加密货币交易具有高风险，使用本策略产生的任何盈利或亏损，由使用者自行承担。请谨慎投资，不要投入超过您承受能力的资金。

---

**开始你的量化交易之旅！** 🚀

有问题？查看 [快速开始指南](QUICKSTART.md) 或 [完整文档](GRID_STRATEGY_README.md)

# perp
