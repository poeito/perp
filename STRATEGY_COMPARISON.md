# 📊 网格策略对比：做多 vs 做空

## 快速对比

| 维度 | 做多策略 🟢 | 做空策略 🔻 |
|------|-----------|-----------|
| **文件** | `grid-trading-strategy.js` | `grid-trading-strategy-short.js` |
| **运行** | `npm run grid` | `npm run grid-short` |
| **市场** | 上涨/震荡上行 | 下跌/震荡下行 |
| **开仓** | 价格下跌→买入 | 价格上涨→卖出 |
| **平仓** | 价格上涨→卖出 | 价格下跌→买入 |
| **盈利** | 低买高卖 | 高卖低买 |
| **图标** | 🟢 持仓 | 🔻 空仓 |
| **状态文件** | `.grid-state-BTCUSD-0.json` | `.grid-state-short-BTCUSD-0.json` |

---

## 交易流程对比

### 做多策略流程

```
市场下跌 → 开多仓 → 等待上涨 → 平仓获利

示例：
1. 价格从 $120k 跌到 $118k
   → 在 $118k 买入（开多仓）
   
2. 价格回升到 $120k
   → 在 $120k 卖出（平多仓）
   
3. 盈利：$2k (1.7%)
```

### 做空策略流程

```
市场上涨 → 开空仓 → 等待下跌 → 平仓获利

示例：
1. 价格从 $118k 涨到 $120k
   → 在 $120k 卖出（开空仓）
   
2. 价格回落到 $118k
   → 在 $118k 买入（平空仓）
   
3. 盈利：$2k (1.7%)
```

---

## 代码逻辑对比

### 做多策略核心代码

```javascript
// 买入逻辑：价格下跌到网格
if (price <= gridPrice && !hasPosition) {
    executeBuyOrder(gridLevel, price);  // 开多仓
}

// 卖出逻辑：价格上涨到更高网格
if (price >= nextGridPrice && hasPosition) {
    executeSellOrder(gridLevel, price);  // 平多仓
}
```

### 做空策略核心代码

```javascript
// 卖出逻辑：价格上涨到网格
if (price >= gridPrice && !hasPosition) {
    executeSellOrder(gridLevel, price);  // 开空仓
}

// 买入逻辑：价格下跌到更低网格
if (price <= lowerGridPrice && hasPosition) {
    executeBuyOrder(gridLevel, price);  // 平空仓
}
```

---

## API调用对比

### 做多策略

| 操作 | API参数 |
|------|---------|
| 开仓（买入） | `positionSide: INCREASE`<br>`orderSide: LONG` |
| 平仓（卖出） | `positionSide: DECREASE`<br>`orderSide: SHORT` |

### 做空策略

| 操作 | API参数 |
|------|---------|
| 开仓（卖出） | `positionSide: INCREASE`<br>`orderSide: SHORT` |
| 平仓（买入） | `positionSide: DECREASE`<br>`orderSide: LONG` |

---

## 盈利计算对比

### 做多盈利计算

```javascript
// 盈利 = 订单金额 × (平仓价 / 开仓价 - 1)
const profit = size * (exitPrice - entryPrice) / entryPrice;

示例：
开仓价: $100, 平仓价: $110, 金额: $1000
盈利 = $1000 × (110/100 - 1) = $100
```

### 做空盈利计算

```javascript
// 盈利 = 订单金额 × (开仓价 - 平仓价) / 开仓价
const profit = size * (entryPrice - exitPrice) / entryPrice;

示例：
开仓价: $110, 平仓价: $100, 金额: $1000
盈利 = $1000 × (110-100)/110 = $90.91
```

---

## 风险对比

### 做多策略风险

| 风险类型 | 描述 | 最大损失 |
|---------|------|---------|
| 价格持续下跌 | 不断加仓，资金占用增加 | 本金（100%） |
| 爆仓风险 | 价格下跌超过杠杆承受能力 | 10x杠杆: -10% |
| 趋势风险 | 在下跌趋势中使用 | 累积亏损 |

### 做空策略风险 ⚠️ 风险更高

| 风险类型 | 描述 | 最大损失 |
|---------|------|---------|
| 价格持续上涨 | 不断开空仓，浮亏增加 | 理论无上限 |
| 爆仓风险 | 价格上涨超过杠杆承受能力 | 10x杠杆: +10% |
| 逼空风险 | 大量空头被强制平仓 | 爆仓 |

**结论**：做空策略风险更大，建议使用更低的杠杆！

---

## 适用场景对比

### 做多策略适用场景

✅ **牛市/上涨趋势**
- 价格不断创新高
- 均线多头排列

✅ **震荡上行**
- 低点逐步抬高
- 回调买入机会

✅ **底部反弹**
- 跌无可跌
- 技术面超卖

### 做空策略适用场景

✅ **熊市/下跌趋势**
- 价格不断破位
- 均线空头排列

✅ **震荡下行**
- 高点逐步降低
- 反弹做空机会

✅ **顶部回调**
- 涨幅过大
- 技术面超买

---

## 网格设置对比

### 做多策略网格（从低到高）

```javascript
{
  gridLower: 100000,  // 低价区（买入区）
  gridUpper: 130000,  // 高价区（卖出区）
  
  // 逻辑：在低价区买入，在高价区卖出
}
```

**开仓方向**：从上往下（价格下跌时逐级买入）
**平仓方向**：从下往上（价格上涨时逐级卖出）

### 做空策略网格（从低到高）

```javascript
{
  gridLower: 100000,  // 低价区（平仓区）
  gridUpper: 130000,  // 高价区（开仓区）
  
  // 逻辑：在高价区卖出，在低价区买入
}
```

**开仓方向**：从下往上（价格上涨时逐级卖出）
**平仓方向**：从上往下（价格下跌时逐级买入）

---

## 实战案例对比

### 案例：BTC在 $120k 震荡

#### 做多策略表现

```
T0: 价格 $122k → 无操作（价格高）
T1: 价格 $118k → 买入 $50 ✓
T2: 价格 $122k → 卖出，盈利 $1.67 ✓
T3: 价格 $116k → 买入 $50 ✓
T4: 价格 $120k → 卖出，盈利 $1.72 ✓

总结：震荡中获利 $3.39
```

#### 做空策略表现

```
T0: 价格 $118k → 无操作（价格低）
T1: 价格 $122k → 卖出 $50 ✓
T2: 价格 $118k → 买入，盈利 $1.64 ✓
T3: 价格 $124k → 卖出 $50 ✓
T4: 价格 $120k → 买入，盈利 $1.61 ✓

总结：震荡中获利 $3.25
```

**结论**：在震荡市场中，两种策略都能盈利，选择取决于入场时机。

---

## 组合使用建议

### 场景1：单边市场

**上涨市场**：
```bash
# 只用做多
npm run grid
```

**下跌市场**：
```bash
# 只用做空
npm run grid-short
```

### 场景2：震荡市场

**宽幅震荡**（波动 > 10%）：
```bash
# 可以同时运行
# 终端1
npm run grid

# 终端2
npm run grid-short
```

**窄幅震荡**（波动 < 5%）：
```bash
# 选一个就够了
npm run grid  # 或 npm run grid-short
```

### 场景3：对冲

**持有现货想对冲**：
```bash
# 现货做多 + 合约做空
npm run grid-short  # 对冲下跌风险
```

---

## 文件对比

### 做多策略文件

```
grid-trading-strategy.js              # 核心代码
grid-strategy-example.js              # 使用示例
.grid-state-BTCUSD-0.json            # 状态文件
.trade-log-BTCUSD-0.jsonl            # 交易记录
```

### 做空策略文件

```
grid-trading-strategy-short.js        # 核心代码
grid-strategy-short-example.js        # 使用示例
.grid-state-short-BTCUSD-0.json      # 状态文件
.trade-log-short-BTCUSD-0.jsonl      # 交易记录
```

**说明**：两者完全独立，互不影响

---

## 快速选择指南

```
开始
  ↓
你预期价格会？
  ├─ 上涨 → 使用做多策略 🟢
  │         npm run grid
  │
  ├─ 下跌 → 使用做空策略 🔻
  │         npm run grid-short
  │
  └─ 震荡 → 两种都可以
            入场价位高 → 做空
            入场价位低 → 做多
```

---

## 命令速查

```bash
# 做多策略
npm run grid              # 运行做多策略
npm run grid-test         # 测试配置
npm run grid-multi        # 多策略（做多）

# 做空策略
npm run grid-short        # 运行做空策略

# 同时运行（高级）
# 终端1
npm run grid

# 终端2
npm run grid-short
```

---

## 总结

| 你的目标 | 推荐策略 |
|---------|---------|
| 长期持有，等涨 | 做多 🟢 |
| 预期下跌，做空 | 做空 🔻 |
| 震荡获利 | 都可以 |
| 对冲风险 | 做空 🔻 |
| 新手练习 | 做多 🟢（风险更低）|

**记住**：
- ✅ 做多：风险有限（最多亏100%）
- ⚠️ 做空：风险更高（理论无上限）
- 🎯 根据市场趋势选择合适的策略！

---

相关文档：
- `GRID_STRATEGY_README.md` - 做多策略详解
- `SHORT_STRATEGY_GUIDE.md` - 做空策略详解
- `API_RATE_LIMIT_GUIDE.md` - API限流处理
