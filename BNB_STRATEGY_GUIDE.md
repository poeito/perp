# 🪙 BNB 网格交易策略指南

## 概述

已为BNB（币安币）添加了完整的做多和做空策略配置，适用于不同市场环境。

---

## 📊 BNB策略列表（4个）

### 做多策略（2个）

| 策略ID | 名称 | 网格范围 | 网格数 | 每格投资 | 杠杆 | 总投资 |
|--------|------|---------|--------|---------|------|--------|
| **bnb_moderate** | BNB温和 | $500-$700 | 10 | $50 | 10x | $500 |
| **bnb_aggressive** | BNB激进 | $450-$750 | 150 | $200 | 20x | $30,000 |

### 做空策略（2个）

| 策略ID | 名称 | 网格范围 | 网格数 | 每格投资 | 杠杆 | 总投资 |
|--------|------|---------|--------|---------|------|--------|
| **bnb_short_moderate** | BNB做空温和 | $500-$700 | 10 | $50 | 8x | $500 |
| **bnb_short_aggressive** | BNB做空激进 | $450-$750 | 100 | $150 | 15x | $15,000 |

---

## 🚀 快速使用

### 查看所有BNB策略

```bash
node grid-multi-runner.js | grep BNB
```

### 运行单个BNB策略

```bash
# 做多温和策略（$500投资）
node grid-multi-runner.js bnb_moderate

# 做多激进策略（$30,000投资）
node grid-multi-runner.js bnb_aggressive

# 做空温和策略（$500投资）
node grid-multi-runner.js bnb_short_moderate

# 做空激进策略（$15,000投资）
node grid-multi-runner.js bnb_short_aggressive
```

### 运行多个策略组合

```bash
# BNB + BTC 组合
node grid-multi-runner.js bnb_moderate btc_conservative

# BNB做多 + BNB做空（对冲）
node grid-multi-runner.js bnb_moderate bnb_short_moderate

# 全市场组合（BTC + ETH + BNB）
node grid-multi-runner.js btc_conservative eth_moderate bnb_moderate
```

---

## 💡 策略详解

### 1. bnb_moderate（BNB温和策略）🟢

**配置**：
```json
{
  "symbol": "BNBUSD",
  "marketIndex": 2,
  "gridLower": 500,
  "gridUpper": 700,
  "gridNumber": 10,
  "investmentPerGrid": 50,
  "leverage": 10,
  "checkInterval": 20000
}
```

**适用场景**：
- ✅ BNB震荡上行
- ✅ 价格在 $500-$700 区间
- ✅ 中等资金（$500）
- ✅ 适合稳健投资者

**运行命令**：
```bash
node grid-multi-runner.js bnb_moderate
```

---

### 2. bnb_aggressive（BNB激进策略）🟢

**配置**：
```json
{
  "symbol": "BNBUSD",
  "marketIndex": 2,
  "gridLower": 450,
  "gridUpper": 750,
  "gridNumber": 150,
  "investmentPerGrid": 200,
  "leverage": 20,
  "checkInterval": 5000
}
```

**适用场景**：
- ✅ BNB强势上涨
- ✅ 价格在 $450-$750 区间
- ✅ 大资金（$30,000）
- ✅ 适合激进投资者

**运行命令**：
```bash
node grid-multi-runner.js bnb_aggressive
```

---

### 3. bnb_short_moderate（BNB做空温和）🔻

**配置**：
```json
{
  "strategyType": "SHORT",
  "symbol": "BNBUSD",
  "marketIndex": 2,
  "gridLower": 500,
  "gridUpper": 700,
  "gridNumber": 10,
  "investmentPerGrid": 50,
  "leverage": 8,
  "checkInterval": 20000
}
```

**适用场景**：
- ✅ BNB下跌趋势
- ✅ 价格在 $500-$700 区间
- ✅ 中等资金（$500）
- ✅ 适合看跌BNB

**运行命令**：
```bash
node grid-multi-runner.js bnb_short_moderate
```

---

### 4. bnb_short_aggressive（BNB做空激进）🔻

**配置**：
```json
{
  "strategyType": "SHORT",
  "symbol": "BNBUSD",
  "marketIndex": 2,
  "gridLower": 450,
  "gridUpper": 750,
  "gridNumber": 100,
  "investmentPerGrid": 150,
  "leverage": 15,
  "checkInterval": 10000
}
```

**适用场景**：
- ✅ BNB明确下跌
- ✅ 价格在 $450-$750 区间
- ✅ 大资金（$15,000）
- ✅ 适合熊市做空

**运行命令**：
```bash
node grid-multi-runner.js bnb_short_aggressive
```

---

## 📈 市场场景选择

### 场景1：BNB上涨

```bash
# 温和上涨
node grid-multi-runner.js bnb_moderate

# 强势上涨
node grid-multi-runner.js bnb_aggressive
```

### 场景2：BNB下跌

```bash
# 温和下跌
node grid-multi-runner.js bnb_short_moderate

# 强势下跌
node grid-multi-runner.js bnb_short_aggressive
```

### 场景3：BNB震荡

```bash
# 做多 + 做空（双向获利）
node grid-multi-runner.js bnb_moderate bnb_short_moderate
```

### 场景4：市场不确定

```bash
# 小仓位测试
node grid-multi-runner.js bnb_moderate  # 仅$500
```

---

## 💰 资金需求

| 策略 | 投资 | 适合资金量 |
|------|------|----------|
| bnb_moderate | $500 | $600+ |
| bnb_short_moderate | $500 | $600+ |
| bnb_aggressive | $30,000 | $35,000+ |
| bnb_short_aggressive | $15,000 | $18,000+ |

**建议**：预留 20% 作为缓冲资金

---

## 🎯 策略组合建议

### 保守组合（$1,000资金）

```bash
node grid-multi-runner.js btc_conservative bnb_moderate
# 总投资：$50 + $500 = $550
```

### 平衡组合（$1,500资金）

```bash
node grid-multi-runner.js btc_conservative eth_moderate bnb_moderate
# 总投资：$50 + $200 + $500 = $750
```

### 对冲组合（$2,000资金）

```bash
node grid-multi-runner.js bnb_moderate bnb_short_moderate btc_conservative
# BNB做多 + BNB做空 + BTC做多
# 总投资：$500 + $500 + $50 = $1,050
```

### 激进组合（$50,000资金）

```bash
node grid-multi-runner.js btc_aggressive bnb_aggressive
# 总投资：$80,000 + $30,000 = $110,000
# ⚠️ 需要充足资金！
```

---

## 📊 BNB vs BTC vs ETH

### 特点对比

| 币种 | 波动性 | 流动性 | 适合策略 |
|------|--------|--------|---------|
| BTC | 中 | 极高 | 所有策略 |
| ETH | 中高 | 高 | 震荡/趋势 |
| BNB | 高 | 中高 | 网格获利 |

### 网格间距对比

| 币种 | 价格范围 | 网格间距（温和） |
|------|---------|---------------|
| BTC | $100k-$140k | ~$3,000 |
| ETH | $4k-$5k | ~$100 |
| BNB | $500-$700 | ~$20 |

---

## ⚠️ BNB特殊风险

### 1. 波动性较大

BNB相比BTC/ETH波动更大：
- ✅ 优点：网格交易机会更多
- ❌ 缺点：止损触发可能更频繁

**建议**：
- 使用较低杠杆（5x-10x）
- 设置合理止损（6%-8%）

### 2. 币安生态相关

BNB价格受币安生态影响：
- 币安新功能/活动
- BNB销毁计划
- 监管消息

**建议**：
- 关注币安官方公告
- 重大消息前减仓

### 3. 流动性

BNB流动性虽高但不如BTC/ETH：
- 大单可能滑点较大
- 极端行情可能出现深度不足

**建议**：
- 单笔订单不要过大
- 分批建仓/平仓

---

## 🔧 自定义配置

### 调整为适合你的资金

假设你有 $1,000 资金：

**原配置**（bnb_moderate需要$500）：
```json
{
  "gridNumber": 10,
  "investmentPerGrid": 50
}
```

**调整为 $300**：
```json
{
  "gridNumber": 10,
  "investmentPerGrid": 30
}
```

**调整为 $200**：
```json
{
  "gridNumber": 10,
  "investmentPerGrid": 20
}
```

### 编辑配置

```bash
vim grid-config.json
```

找到 BNB 策略：
```
/bnb_moderate
```

修改参数并保存。

---

## 📝 配置参数说明

### marketIndex: 2

BNB的市场索引为 **2**：
- BTC: 0
- ETH: 1
- BNB: 2

### symbol: "BNBUSD"

交易对符号，必须与交易所保持一致。

### 网格范围

基于BNB当前价格（约$600）设置：
- **保守**：$500-$700（±17%）
- **激进**：$450-$750（±25%）

---

## 🎓 实战建议

### 新手入门

```bash
# 1. 从小额开始
node grid-multi-runner.js bnb_moderate

# 2. 观察1-2天
# 3. 熟悉后增加投入
```

### 进阶玩法

```bash
# BNB多空对冲
node grid-multi-runner.js bnb_moderate bnb_short_moderate

# 优点：无论涨跌都能获利
# 缺点：需要双倍资金
```

### 高级策略

```bash
# 三币种组合
node grid-multi-runner.js \
  btc_conservative \
  eth_moderate \
  bnb_moderate

# 分散风险，全面覆盖
```

---

## 📞 常见问题

### Q1: BNB策略和BTC/ETH策略有什么区别？

**A**: 主要区别：
- 价格范围不同（BNB更低）
- 波动性更大
- 网格间距更小
- 资金需求相对较低

### Q2: marketIndex=2 是固定的吗？

**A**: 需要确认交易所的实际配置。如果运行报错，可能需要调整。

常见索引：
- BTC: 0
- ETH: 1
- BNB: 2 或其他

### Q3: 为什么BNB做空杠杆比做多低？

**A**: 做空风险更高，使用较低杠杆更安全：
- 做多：10x-20x
- 做空：8x-15x

### Q4: 可以同时运行BNB做多和做空吗？

**A**: 可以，这是对冲策略：

```bash
node grid-multi-runner.js bnb_moderate bnb_short_moderate
```

好处：
- ✅ 无论涨跌都能获利
- ✅ 降低方向性风险

坏处：
- ❌ 需要双倍资金
- ❌ 震荡市场效果更好

---

## 📊 所有策略总览

现在系统支持 **12个策略**：

### BTC策略（6个）
- 做多：conservative, neutral, aggressive
- 做空：short_conservative, short_aggressive

### ETH策略（4个）
- 做多：moderate
- 做空：short_moderate, short_aggressive

### BNB策略（4个）⭐ 新增
- 做多：moderate, aggressive
- 做空：short_moderate, short_aggressive

---

## 🚀 快速命令

```bash
# 查看所有策略（包括BNB）
node grid-multi-runner.js

# 只看BNB策略
node grid-multi-runner.js | grep BNB

# 运行BNB温和做多
node grid-multi-runner.js bnb_moderate

# 运行BNB温和做空
node grid-multi-runner.js bnb_short_moderate

# 查看配置
cat grid-config.json | grep -A 15 "bnb_moderate"
```

---

**BNB策略已就绪，开始交易吧！** 🪙💰

