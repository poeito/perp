# 📋 grid-config.json 使用指南

## 概述

`grid-config.json` 是统一的策略配置文件，支持**做多**和**做空**两种策略类型。

---

## 🎯 配置文件结构

```json
{
  "strategies": {
    "策略名称": {
      "name": "显示名称",
      "description": "策略描述",
      "strategyType": "SHORT",  // 可选：SHORT=做空，不设置=做多
      "symbol": "BTCUSD",
      "marketIndex": 0,
      "gridLower": 110000,
      "gridUpper": 135000,
      "gridNumber": 10,
      "investmentPerGrid": 50,
      "leverage": 5,
      "checkInterval": 30000,
      "stopLossPercent": 0.05,
      "takeProfitRate": 1
    }
  }
}
```

---

## 🔑 关键字段说明

### strategyType（策略类型）⭐ 重要

```json
{
  // 做多策略（默认）- 不设置或留空
  "strategyType": undefined,  // 或不写这个字段
  
  // 做空策略 - 必须设置
  "strategyType": "SHORT"
}
```

**区别**：
- **不设置**：使用做多策略 🟢（价格下跌买入，上涨卖出）
- **"SHORT"**：使用做空策略 🔻（价格上涨卖出，下跌买入）

---

## 📊 当前配置的策略

### 做多策略（4个）

1. **btc_conservative** 🟢
   - 保守型，小资金
   - $114k - $131k, 5网格
   - 总投资：$50

2. **btc_aggressive** 🟢
   - 激进型，大资金
   - $101.5k - $134.5k, 400网格
   - 总投资：$40,000

3. **btc_neutral** 🟢
   - 中性型，震荡
   - $108k - $137k, 10网格
   - 总投资：$300

4. **eth_moderate** 🟢
   - ETH温和型
   - $3,970 - $5,050, 10网格
   - 总投资：$200

### 做空策略（2个）

5. **btc_short_conservative** 🔻
   - 做空保守型
   - $110k - $135k, 10网格
   - 总投资：$500

6. **btc_short_aggressive** 🔻
   - 做空激进型
   - $100k - $140k, 20网格
   - 总投资：$2,000

---

## 🚀 使用方法

### 1. 查看所有策略

```bash
node grid-multi-runner.js
# 或
npm run grid-list
```

输出：
```
📋 可用的策略配置:

1. 🎯 btc_conservative 🟢
   类型: 做多
   ...

5. 🎯 btc_short_conservative 🔻
   类型: 做空
   ...
```

### 2. 运行单个策略

```bash
# 做多策略
node grid-multi-runner.js btc_conservative
# 或
npm run grid-btc-conservative

# 做空策略
node grid-multi-runner.js btc_short_conservative
# 或
npm run grid-btc-short-conservative
```

### 3. 运行多个策略

```bash
# 做多 + 做多
node grid-multi-runner.js btc_conservative btc_neutral

# 做空 + 做空
node grid-multi-runner.js btc_short_conservative btc_short_aggressive

# 做多 + 做空（对冲）
node grid-multi-runner.js btc_conservative btc_short_conservative
```

### 4. 运行所有策略

```bash
npm run grid-all
```

⚠️ 这会同时运行所有6个策略（做多+做空），需要充足资金！

---

## ✏️ 添加新策略

### 添加做多策略

```json
{
  "strategies": {
    "my_custom_long": {
      "name": "我的自定义做多策略",
      "description": "根据市场情况调整",
      // 不设置 strategyType，默认为做多
      "symbol": "BTCUSD",
      "marketIndex": 0,
      "gridLower": 115000,
      "gridUpper": 125000,
      "gridNumber": 5,
      "investmentPerGrid": 100,
      "leverage": 10,
      "checkInterval": 20000,
      "stopLossPercent": 0.05,
      "takeProfitRate": 1
    }
  }
}
```

运行：
```bash
node grid-multi-runner.js my_custom_long
```

### 添加做空策略

```json
{
  "strategies": {
    "my_custom_short": {
      "name": "我的自定义做空策略",
      "description": "下跌市场使用",
      "strategyType": "SHORT",  // ⭐ 必须设置
      "symbol": "BTCUSD",
      "marketIndex": 0,
      "gridLower": 115000,
      "gridUpper": 125000,
      "gridNumber": 5,
      "investmentPerGrid": 100,
      "leverage": 10,
      "checkInterval": 20000,
      "stopLossPercent": 0.05,
      "takeProfitRate": 1
    }
  }
}
```

运行：
```bash
node grid-multi-runner.js my_custom_short
```

---

## 🔐 API 密钥配置

### 方式1：使用 .env（推荐）

```bash
# 1. 运行设置
npm run setup

# 2. 编辑 .env
vim .env

# 3. 配置文件中不需要填写 apiKey
# 系统会自动从 .env 加载
```

### 方式2：在配置文件中单独配置

```json
{
  "strategies": {
    "btc_conservative": {
      "apiKey": "your_api_key_here",      // 单独配置
      "secretKey": "your_secret_key_here",
      ...
    }
  }
}
```

---

## 📊 策略选择建议

### 上涨市场

```bash
# 使用做多策略
node grid-multi-runner.js btc_conservative btc_neutral
```

### 下跌市场

```bash
# 使用做空策略
node grid-multi-runner.js btc_short_conservative
```

### 震荡市场

```bash
# 做多 + 做空（双向获利）
node grid-multi-runner.js btc_neutral btc_short_conservative
```

### 对冲需求

```bash
# 持有现货 + 做空对冲
node grid-multi-runner.js btc_short_conservative
```

---

## 🎯 快速命令对照表

| 命令 | 作用 |
|------|------|
| `node grid-multi-runner.js` | 查看所有策略 |
| `npm run grid-list` | 查看所有策略（同上）|
| `npm run grid-btc-conservative` | 运行BTC保守做多 |
| `npm run grid-btc-short-conservative` | 运行BTC保守做空 |
| `npm run grid-all` | 运行所有策略 |
| `node grid-multi-runner.js [name]` | 运行指定策略 |
| `node grid-multi-runner.js [name1] [name2]` | 运行多个策略 |

---

## 📝 配置文件位置

```
/Users/bingo/crypto/bumpin/grid-config.json
```

编辑：
```bash
vim grid-config.json
# 或
code grid-config.json
```

---

## ⚠️ 重要提示

### 做多 vs 做空策略区别

| 项目 | 做多 🟢 | 做空 🔻 |
|------|--------|--------|
| 开仓时机 | 价格下跌 | 价格上涨 |
| 平仓时机 | 价格上涨 | 价格下跌 |
| 风险 | 有限（-100%）| 更高（理论无上限）|
| 适用市场 | 上涨/震荡上行 | 下跌/震荡下行 |

### 杠杆建议

- 做多策略：5x - 20x
- 做空策略：3x - 10x（建议更低）⚠️

### 资金管理

- 单策略：≤ 20% 账户资金
- 多策略：总计 ≤ 50% 账户资金
- 预留保证金：≥ 50% 应对波动

---

## 🐛 故障排除

### 问题1：策略未显示

**检查**：
```bash
# 查看配置文件是否正确
cat grid-config.json

# 检查JSON语法
node -e "JSON.parse(require('fs').readFileSync('grid-config.json', 'utf8'))"
```

### 问题2：无法加载API密钥

**解决**：
```bash
# 检查 .env 文件
cat .env

# 重新设置
npm run setup
```

### 问题3：策略类型错误

**检查配置**：
```json
{
  "strategyType": "SHORT"  // ✅ 正确（大写）
  "strategyType": "short"  // ❌ 错误（小写）
  "strategyType": "LONG"   // ❌ 错误（应不设置）
}
```

**正确配置**：
- 做多：不设置 `strategyType` 字段
- 做空：`"strategyType": "SHORT"`

---

## 📚 相关文档

- `GRID_STRATEGY_README.md` - 做多策略详解
- `SHORT_STRATEGY_GUIDE.md` - 做空策略详解
- `STRATEGY_COMPARISON.md` - 策略对比
- `MULTI_STRATEGY_GUIDE.md` - 多策略运行

---

## 💡 示例配置

查看完整示例：
```bash
cat grid-config.json
```

或参考模板：
```bash
cat grid-config-template.json
```

---

**现在你可以通过 grid-config.json 统一管理所有策略了！** 🎉
