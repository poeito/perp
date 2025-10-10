# 加密货币网格交易策略系统

## 📚 项目简介

这是一个功能完整的加密货币交易 SDK 和**动态网格交易策略**实现，支持多个主流交易所。

> **⚠️ 重要安全提示**  
> - 本仓库为**公开仓库**，请勿在代码中硬编码 API 密钥  
> - 所有密钥必须通过配置文件管理（已在 `.gitignore` 中）  
> - 切勿将包含真实密钥的配置文件提交到 Git  
> - 如不慎泄露密钥，请立即前往交易所重新生成

### 支持的交易所

- 🟢 **Bumpin** - 完整支持，包含合约交易和网格策略
- 🎒 **Backpack** - 完整支持，现货网格交易策略

### 主要功能

- ✅ 多交易所 API 完整封装
- ✅ 自动化网格交易策略
- ✅ 多种预设策略配置
- ✅ 实时价格监控和自动下单
- ✅ 风险控制和止损机制
- ✅ 详细的交易日志和报告
- 🔐 安全的密钥管理（配置文件）
- 🔄 支持多策略并行运行

## 🚀 快速开始

### 0. 克隆仓库（首次使用）

```bash
# 克隆仓库
git clone <repository-url>
cd bumpin-public

# 重要：仓库中不包含 .env 文件，你需要自己创建
```

> 📌 **注意**：克隆下来的仓库不包含任何 API 密钥。你需要自己创建 `.env` 文件并配置密钥。

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 密钥

> 🔐 **密钥安全说明**  
> - API 密钥存储在配置文件中（`grid-config.json` 或 `backpack-grid-config.json`）  
> - 配置文件已添加到 `.gitignore`，不会被提交到 Git  
> - 克隆仓库后需要从模板创建自己的配置文件

#### Bumpin 交易所配置

```bash
# 1. 复制配置模板
cp grid-config-template.json grid-config.json

# 2. 编辑 grid-config.json，填入你的 API 密钥
# 将 "your_api_key_here" 替换为你的真实密钥
```

配置文件示例：
```json
{
  "strategies": {
    "btc_conservative": {
      "name": "BTC保守型策略",
      "apiKey": "你的实际API密钥",
      "secretKey": "你的实际Secret密钥",
      "symbol": "BTCUSD",
      "marketIndex": 0,
      "gridLower": 58000,
      "gridUpper": 62000,
      "gridNumber": 5,
      "investmentPerGrid": 5,
      "leverage": 5
    }
  }
}
```

#### Backpack 交易所配置

```bash
# 1. 复制 Backpack 配置模板
cp backpack-grid-config-template.json backpack-grid-config.json

# 2. 编辑 backpack-grid-config.json，填入你的 API 密钥
```

配置文件示例：
```json
{
  "strategies": {
    "sol_strategy": {
      "name": "SOL网格策略",
      "apiKey": "你的Backpack API Key",
      "apiSecret": "你的Backpack API Secret",
      "symbol": "SOL_USDC",
      "gridLower": 140,
      "gridUpper": 160,
      "gridNumber": 10,
      "amountPerGrid": 0.1
    }
  }
}
```

> ⚠️ **重要**：切勿在公开场合（GitHub、论坛等）分享包含真实密钥的配置文件  
> 📖 详细配置说明：[网格策略配置指南](GRID_CONFIG_USAGE.md)

### 3. 测试配置

```bash
npm run grid-test
```

### 4. 启动网格策略

#### Bumpin 交易所

```bash
# 列出所有可用策略
node grid-strategy-runner.js list

# 运行指定策略（从 grid-config.json 加载）
node grid-strategy-runner.js btc_conservative
node grid-strategy-runner.js btc_neutral
node grid-strategy-runner.js btc_aggressive
```

#### Backpack 交易所

```bash
# 列出所有可用的 Backpack 策略
node backpack-grid-runner.js list

# 运行指定策略（从 backpack-grid-config.json 加载）
node backpack-grid-runner.js sol_strategy
```

### 基础 API 使用

#### Bumpin API
```javascript
import { BumpinAPI } from './bumpin-api.js';

// 从配置文件加载密钥
const api = new BumpinAPI(apiKey, secretKey);

// 获取价格
const price = await api.getPrice('BTCUSD');

// 获取持仓
const positions = await api.getCurrentPositions();
```

#### Backpack API
```javascript
import { BackpackAPI } from './backpack-api.js';

// 创建 API 实例
const api = new BackpackAPI(apiKey, apiSecret);

// 获取余额
const balances = await api.getBalances();

// 获取市场价格
const ticker = await api.getTicker('SOL_USDC');
```

详细教程请查看 [快速开始指南](QUICKSTART.md) 或 [Backpack 指南](BACKPACK_README.md)

## 📖 文档

### 核心文档
- 🚀 [快速开始指南](QUICKSTART.md) - 5分钟上手
- 🔐 [安全最佳实践](SECURITY.md) - **必读！密钥安全指南**
- 📊 [网格策略完整文档](GRID_STRATEGY_README.md) - 策略原理和详细配置

### Bumpin 交易所
- 🟢 [Bumpin API 配置指南](API_CONFIG_GUIDE.md) - API 配置说明
- 📈 [多策略运行指南](MULTI_STRATEGY_GUIDE.md) - 多策略并行运行
- 📉 [做空策略指南](SHORT_STRATEGY_GUIDE.md) - 做空网格策略

### Backpack 交易所
- 🎒 [Backpack 完整指南](BACKPACK_README.md) - Backpack 使用说明
- ⚡ [Backpack 快速开始](BACKPACK_QUICKSTART.md) - 快速上手
- 📝 [Backpack 实现说明](BACKPACK_IMPLEMENTATION.md) - 技术实现
- 🔖 [Backpack 速查表](BACKPACK_CHEATSHEET.md) - 常用命令

## 📁 项目结构

```
bumpin-public/
├── bumpin-api.js                  # Bumpin API SDK 核心
├── config.js                      # 配置加载工具（从 .env 读取）
├── grid-trading-strategy.js       # 网格交易策略核心
├── grid-strategy-example.js       # 策略使用示例
├── grid-strategy-runner.js        # 配置文件策略运行器
├── grid-config-template.json      # 配置模板（不含真实密钥）
├── backpack-api.js                # Backpack 交易所 API 封装
├── backpack-grid-strategy.js      # Backpack 网格策略
├── setup.js                       # 快速设置脚本
├── env.example                    # 🔐 环境变量模板（已提交）
├── .env                           # 🔐 真实配置（不会提交，需自行创建）
├── .gitignore                     # Git 忽略配置（保护敏感文件）
├── SECURITY.md                    # 🔐 安全指南（必读）
├── README.md                      # 项目说明（本文件）
├── QUICKSTART.md                  # 快速开始指南
└── package.json                   # 项目依赖配置

# 以下文件不会出现在公开仓库中（已在 .gitignore）：
├── grid-config.json               # 🔒 你的 Bumpin 策略配置（含密钥）
├── backpack-grid-config.json      # 🔒 你的 Backpack 策略配置（含密钥）
├── .env                           # 🔒 环境变量（备用配置）
├── .grid-state-*.json             # 🔒 交易状态文件
├── .backpack-grid-state-*.json    # 🔒 Backpack 交易状态
├── .trade-log-*.jsonl             # 🔒 交易日志文件
├── .backpack-trade-log-*.jsonl    # 🔒 Backpack 交易日志
└── node_modules/                  # 🔒 依赖包
```

> 📌 **说明**：标记 🔐 的文件涉及密钥管理，标记 🔒 的文件不会被提交到 Git。

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

### Bumpin 配置结构

> 🔐 **重要**：配置存储在 `grid-config.json` 文件中（已在 `.gitignore`，不会提交到 Git）

```json
{
  "strategies": {
    "策略名称": {
      "name": "策略显示名称",
      "description": "策略描述",
      "apiKey": "你的API密钥",
      "secretKey": "你的Secret密钥",
      "symbol": "BTCUSD",
      "marketIndex": 0,
      "gridLower": 60000,
      "gridUpper": 70000,
      "gridNumber": 10,
      "investmentPerGrid": 10,
      "leverage": 10,
      "checkInterval": 10000,
      "stopLossPercent": 0.05
    }
  }
}
```

### Backpack 配置结构

> 🔐 **重要**：配置存储在 `backpack-grid-config.json` 文件中

```json
{
  "strategies": {
    "策略名称": {
      "name": "策略显示名称",
      "apiKey": "你的Backpack API Key",
      "apiSecret": "你的Backpack API Secret",
      "symbol": "SOL_USDC",
      "gridLower": 140,
      "gridUpper": 160,
      "gridNumber": 10,
      "amountPerGrid": 0.1,
      "orderType": "Limit",
      "timeInForce": "Gtc",
      "checkInterval": 20000
    }
  }
}
```

**正确的使用方式**：
```bash
# ✅ 推荐：从配置文件运行
node grid-strategy-runner.js btc_conservative
node backpack-grid-runner.js sol_strategy

# ❌ 错误：不要在代码中硬编码密钥
# const apiKey = "sk_xxxxx"; // 危险！不要这样做！
```

### 关键参数说明

#### Bumpin 参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `apiKey` | Bumpin API Key | 从交易所获取 |
| `secretKey` | Bumpin Secret Key | 从交易所获取 |
| `symbol` | 交易对 | BTCUSD, ETHUSD 等 |
| `marketIndex` | 市场索引 | 0=BTC, 1=ETH |
| `gridLower` | 网格下限价格 | 当前价格 × 0.90 |
| `gridUpper` | 网格上限价格 | 当前价格 × 1.10 |
| `gridNumber` | 网格数量 | 5-20 |
| `investmentPerGrid` | 每格投资金额(USD) | 总资金 ÷ 网格数量 |
| `leverage` | 杠杆倍数 | 5-20 |
| `checkInterval` | 检查间隔(毫秒) | 10000-30000 |

#### Backpack 参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `apiKey` | Backpack API Key | 从交易所获取 |
| `apiSecret` | Backpack API Secret | 从交易所获取 |
| `symbol` | 交易对 | SOL_USDC, BTC_USDC 等 |
| `gridLower` | 网格下限价格 | 当前价格 × 0.85 |
| `gridUpper` | 网格上限价格 | 当前价格 × 1.15 |
| `gridNumber` | 网格数量 | 10-30 |
| `amountPerGrid` | 每格交易数量 | 基础币数量（如 SOL） |
| `orderType` | 订单类型 | Limit 或 Market |
| `timeInForce` | 订单有效期 | Gtc 或 Ioc |
| `checkInterval` | 检查间隔(毫秒) | 10000-30000 |

详细配置说明请查看：
- Bumpin: [grid-config-template.json](grid-config-template.json)
- Backpack: [backpack-grid-config-template.json](backpack-grid-config-template.json)

## 💻 可用命令

### Bumpin 交易所命令

```bash
# 列出所有可用策略
node grid-strategy-runner.js list

# 运行指定策略
node grid-strategy-runner.js btc_conservative
node grid-strategy-runner.js btc_neutral
node grid-strategy-runner.js btc_aggressive
node grid-strategy-runner.js eth_moderate

# 运行多策略
node grid-multi-runner.js  # 需要配置 grid-config.json
```

### Backpack 交易所命令

```bash
# 列出所有可用的 Backpack 策略
node backpack-grid-runner.js list

# 运行指定 Backpack 策略
node backpack-grid-runner.js sol_strategy
node backpack-grid-runner.js btc_strategy

# Backpack 示例
node backpack-grid-example.js  # 运行示例策略
```

### API 测试命令

```bash
# Bumpin API 测试
node example.js         # Bumpin API 使用示例
node check-markets.js   # 检查可用市场

# 配置测试
node test-grid-config.js  # 测试网格配置是否正确
```

## 📊 API功能

### Bumpin 交易所功能

#### 交易功能
- ✅ 下单（市价单、限价单）
- ✅ 开仓（多头、空头）
- ✅ 平仓
- ✅ 止损止盈
- ✅ 杠杆交易

#### 查询功能
- ✅ 获取账户信息
- ✅ 获取当前持仓
- ✅ 获取当前订单
- ✅ 获取持仓历史
- ✅ 获取市场价格
- ✅ 获取市场列表

#### 市场数据
- ✅ 实时价格查询
- ✅ 支持的交易对：BTCUSD, ETHUSD 等
- ✅ 合约市场信息

### Backpack 交易所功能

#### 交易功能
- ✅ 限价单（Limit Order）
- ✅ 市价单（Market Order）
- ✅ 取消订单
- ✅ 批量取消订单
- ✅ 现货交易

#### 查询功能
- ✅ 获取账户余额
- ✅ 获取当前订单
- ✅ 获取历史订单
- ✅ 获取成交记录
- ✅ 获取市场信息

#### 市场数据
- ✅ 实时价格（Ticker）
- ✅ 支持的交易对：SOL_USDC, BTC_USDC, ETH_USDC 等
- ✅ K线数据
- ✅ 订单簿深度

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

> 🔐 **安全提醒**：始终通过配置文件加载密钥，不要在代码中硬编码

#### 方式1：使用配置文件（推荐）

```bash
# 1. 编辑 grid-config.json，添加自定义策略
# 2. 运行策略
node grid-strategy-runner.js my_custom_strategy
```

#### 方式2：编程方式

**Bumpin 自定义策略**：
```javascript
import GridTradingStrategy from './grid-trading-strategy.js';

// ✅ 从配置文件或其他安全来源加载密钥
const strategy = new GridTradingStrategy({
    apiKey: 'your_api_key',        // 从配置文件读取
    secretKey: 'your_secret_key',  // 从配置文件读取
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

**Backpack 自定义策略**：
```javascript
import BackpackGridStrategy from './backpack-grid-strategy.js';

const strategy = new BackpackGridStrategy({
    apiKey: 'your_backpack_api_key',
    apiSecret: 'your_backpack_api_secret',
    symbol: 'SOL_USDC',
    gridLower: 140,
    gridUpper: 160,
    gridNumber: 10,
    amountPerGrid: 0.1,
    checkInterval: 20000
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

### 密钥管理

> **⚠️ 本仓库为公开仓库，密钥安全至关重要！**

#### ✅ 安全措施

- ✅ **配置文件管理**：所有敏感信息存储在配置文件中（`grid-config.json`, `backpack-grid-config.json`）
- ✅ **Git 忽略配置**：配置文件已添加到 `.gitignore`，不会被提交
- ✅ **API 安全传输**：请求使用签名验证和时间戳防重放
- ✅ **配置模板**：仓库只包含模板文件（`*-template.json`），不含真实密钥
- ✅ **状态文件保护**：交易状态和日志文件也已加入 `.gitignore`

#### ❌ 严禁操作

- ❌ **不要**在代码中硬编码 API 密钥和 Secret 密钥
- ❌ **不要**将 `grid-config.json` 或 `backpack-grid-config.json` 提交到 Git
- ❌ **不要**在 GitHub Issues、论坛等公开场合分享密钥
- ❌ **不要**在截图中暴露密钥或配置文件内容
- ❌ **不要**与他人分享包含真实密钥的配置文件

#### 🔒 最佳实践

1. **初次使用**：克隆仓库后，从模板创建自己的配置文件
   ```bash
   cp grid-config-template.json grid-config.json
   cp backpack-grid-config-template.json backpack-grid-config.json
   ```

2. **密钥权限**：建议使用只读权限的 API 密钥进行测试

3. **定期更换**：定期在交易所后台更换 API 密钥

4. **泄露应对**：如不慎泄露密钥，立即前往交易所撤销并重新生成

5. **备份安全**：如需备份配置文件，请使用加密存储

#### 🛡️ 验证安全性

运行以下命令检查是否有敏感文件被跟踪：
```bash
# 检查 Git 状态，确保配置文件没有被跟踪
git status | grep -E "grid-config.json|backpack-grid-config.json"

# 应该没有输出，如果有输出说明配置文件被跟踪了！

# 查看 .gitignore 内容
cat .gitignore
```

#### 🔍 检查代码中的密钥泄露

```bash
# 搜索代码中是否有硬编码的密钥
grep -r "apiKey.*:" --include="*.js" --exclude-dir=node_modules . | \
  grep -v "apiKey.*process.env" | \
  grep -v "your_api_key" | \
  grep -v "config.apiKey"

# 如果有可疑输出，请立即检查并修正
```

**注意**：请妥善保管你的 API 密钥，它们是你账户资金的唯一凭证！

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

## 🌐 公开仓库安全检查清单

在提交代码到公开仓库前，请确认以下事项：

- [ ] ✅ `grid-config.json` 已添加到 `.gitignore`
- [ ] ✅ `backpack-grid-config.json` 已添加到 `.gitignore`
- [ ] ✅ `.env` 文件已添加到 `.gitignore`（如有使用）
- [ ] ✅ 代码中没有硬编码的 API 密钥
- [ ] ✅ 交易状态文件（`.grid-state-*.json`, `.backpack-grid-state-*.json`）已忽略
- [ ] ✅ 交易日志文件（`.trade-log-*.jsonl`, `.backpack-trade-log-*.jsonl`）已忽略
- [ ] ✅ 所有配置示例都使用占位符（`your_api_key_here`），不含真实密钥
- [ ] ✅ 文档中的截图没有暴露敏感信息
- [ ] ✅ commit 历史中没有包含过敏感文件

### 检查命令

```bash
# 1. 检查是否有敏感配置文件被跟踪
git status | grep -E "grid-config.json|backpack-grid-config.json|\.env$"
# 应该没有输出！如果有输出说明配置文件被跟踪了

# 2. 查看 .gitignore 配置
cat .gitignore | grep -E "config.json|\.env|state|trade-log"

# 3. 搜索代码中是否有硬编码的密钥
grep -r "apiKey.*:" --include="*.js" --exclude-dir=node_modules . | \
  grep -v "process.env" | \
  grep -v "your_api_key" | \
  grep -v "config.apiKey" | \
  grep -v "strategy.apiKey"

# 4. 检查 git 历史中是否包含敏感文件
git log --all --full-history -- grid-config.json
git log --all --full-history -- backpack-grid-config.json
git log --all --full-history -- .env
# 应该都显示没有提交记录

# 5. 检查暂存区
git diff --cached --name-only | grep -E "config.json|\.env|state|trade-log"
# 应该没有输出
```

### 如果不慎提交了敏感信息

如果你不小心将包含密钥的配置文件提交到了 Git，请立即：

1. **撤销密钥**：前往交易所后台撤销并重新生成 API 密钥（最重要！）
2. **清理历史**：使用 `git filter-branch` 或 `BFG Repo-Cleaner` 清理 Git 历史
3. **强制推送**：清理后需要 `git push --force`（谨慎操作）

```bash
# 方法1: 使用 git filter-branch 删除敏感文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch grid-config.json backpack-grid-config.json .env" \
  --prune-empty --tag-name-filter cat -- --all

# 方法2: 使用 BFG Repo-Cleaner (更快速)
# 下载 BFG: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files grid-config.json
java -jar bfg.jar --delete-files backpack-grid-config.json

# 清理引用和垃圾回收
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送（会重写远程历史！）
git push origin --force --all
```

> ⚠️ **警告**：`git push --force` 会重写远程仓库历史，请谨慎使用！

---

## 📚 相关文档

- 🚀 [快速开始指南](QUICKSTART.md) - 5分钟上手教程
- 🔐 [安全最佳实践](SECURITY.md) - 密钥安全和 Git 安全
- 📊 [网格策略详解](GRID_STRATEGY_README.md) - 策略原理和配置
- 🎒 [Backpack 交易所指南](BACKPACK_README.md) - Backpack 集成说明
- 🔄 [多策略运行指南](MULTI_STRATEGY_GUIDE.md) - 多策略并行
- 📉 [做空策略指南](SHORT_STRATEGY_GUIDE.md) - 做空策略配置

---

**开始你的量化交易之旅！** 🚀

有问题？查看 [快速开始指南](QUICKSTART.md) 或 [完整文档](GRID_STRATEGY_README.md)

**记住**：安全第一，密钥保护是交易的首要任务！🔐
