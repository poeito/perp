# 📊 Market Index 参考表

## ⚠️ 重要更新

所有策略的 `marketIndex` 已更新为实际的交易所索引值！

---

## 🎯 主要币种 Market Index

| 交易对 | Market Index | 最大杠杆 | 状态 |
|--------|-------------|---------|------|
| **BTCUSD** | **5** | 100x | ✅ NORMAL |
| **ETHUSD** | **28** | 100x | ✅ NORMAL |
| **BNBUSD** | **10** | 20x | ✅ NORMAL |
| SOLUSD | 49 | 100x | ✅ NORMAL |
| XRPUSD | 32 | 20x | ✅ NORMAL |
| ADAUSD | 53 | 20x | ✅ NORMAL |
| DOGEUSD | 56 | 20x | ✅ NORMAL |

---

## 📝 已更新的配置

### BTC 策略（全部更新）

```json
{
  "btc_conservative": {
    "marketIndex": 5  // ✅ 已更新（原：0）
  },
  "btc_aggressive": {
    "marketIndex": 5  // ✅ 已更新（原：0）
  },
  "btc_neutral": {
    "marketIndex": 5  // ✅ 已更新（原：0）
  },
  "btc_short_conservative": {
    "marketIndex": 5  // ✅ 已更新（原：0）
  },
  "btc_short_aggressive": {
    "marketIndex": 5  // ✅ 已更新（原：0）
  }
}
```

### ETH 策略（全部更新）

```json
{
  "eth_moderate": {
    "marketIndex": 28  // ✅ 已更新（原：1）
  },
  "eth_short_moderate": {
    "marketIndex": 28  // ✅ 已更新（原：1）
  },
  "eth_short_aggressive": {
    "marketIndex": 28  // ✅ 已更新（原：1）
  }
}
```

### BNB 策略（全部更新）⭐ 新增

```json
{
  "bnb_moderate": {
    "marketIndex": 10  // ✅ 已更新（原：2）
  },
  "bnb_aggressive": {
    "marketIndex": 10  // ✅ 已更新（原：2）
  },
  "bnb_short_moderate": {
    "marketIndex": 10  // ✅ 已更新（原：2）
  },
  "bnb_short_aggressive": {
    "marketIndex": 10  // ✅ 已更新（原：2）
  }
}
```

---

## 🔍 如何查询 Market Index

### 方法1：使用查询脚本

```bash
node check-markets.js
```

输出会显示所有市场的索引：
```
🎯 常见币种的 marketIndex:

✅ BTCUSD     → marketIndex: 5 (最大杠杆: 100x)
✅ ETHUSD     → marketIndex: 28 (最大杠杆: 100x)
✅ BNBUSD     → marketIndex: 10 (最大杠杆: 20x)
```

### 方法2：查看完整市场列表

```bash
node check-markets.js | grep "索引"
```

---

## 📊 完整市场索引列表（前20个）

| 索引 | 交易对 | 最大杠杆 |
|-----|--------|---------|
| 0 | TRUMPUSD | 20x |
| 1 | PNUTUSD | 20x |
| 2 | 1000TRUMPUSD | 1000x |
| 3 | AVAXUSD | 20x |
| 4 | KAITOUSD | 20x |
| **5** | **BTCUSD** | **100x** |
| 6 | 1000SUIUSD | 1000x |
| 7 | DYDXUSD | 20x |
| 8 | VINEUSD | 20x |
| 9 | TRXUSD | 20x |
| **10** | **BNBUSD** | **20x** |
| 11 | RAYUSD | 20x |
| 12 | NOTUSD | 20x |
| 13 | POPCATUSD | 20x |
| 14 | BERAUSD | 20x |
| 15 | ENAUSD | 20x |
| 16 | OMUSD | 20x |
| 17 | ONDOUSD | 20x |
| 18 | 1000SOLUSD | 1000x |
| 19 | HYPEUSD | 20x |

---

## ⚠️ 常见错误

### 错误1：使用了错误的 marketIndex

```json
{
  "symbol": "BTCUSD",
  "marketIndex": 0  // ❌ 错误！应该是 5
}
```

**症状**：
- 策略无法启动
- API返回市场不存在错误

**解决**：
```json
{
  "symbol": "BTCUSD",
  "marketIndex": 5  // ✅ 正确
}
```

### 错误2：symbol 和 marketIndex 不匹配

```json
{
  "symbol": "BTCUSD",
  "marketIndex": 10  // ❌ 这是BNB的索引！
}
```

**必须确保**：
- BTCUSD → marketIndex: 5
- ETHUSD → marketIndex: 28
- BNBUSD → marketIndex: 10

---

## 🎯 添加新币种步骤

### 1. 查询 marketIndex

```bash
node check-markets.js | grep "YOURSYMBOL"
```

### 2. 添加到配置

```json
{
  "your_new_strategy": {
    "symbol": "YOURSYMBOL",
    "marketIndex": X,  // ← 填入查询到的索引
    ...
  }
}
```

### 3. 测试运行

```bash
node grid-multi-runner.js your_new_strategy
```

---

## 📞 快速命令

```bash
# 查询所有市场
node check-markets.js

# 查询特定币种
node check-markets.js | grep "BTCUSD"
node check-markets.js | grep "ETHUSD"
node check-markets.js | grep "BNBUSD"

# 验证配置
cat grid-config.json | grep -E "(symbol|marketIndex)"

# 查看所有策略
node grid-multi-runner.js
```

---

## 💡 重要提示

1. **marketIndex 可能变化**
   - 交易所可能调整市场索引
   - 定期运行 `check-markets.js` 确认

2. **先查询再配置**
   - 添加新策略前，必须查询正确的 marketIndex
   - 不要猜测或假设索引值

3. **验证配置**
   - 修改配置后，先运行单个策略测试
   - 确认无误后再批量运行

4. **保存查询结果**
   - 可以将查询结果保存到文件：
   ```bash
   node check-markets.js > markets.txt
   ```

---

## 🎓 Market Index 规则

### 规则1：索引不连续

market Index 不是按顺序排列的：
- BTC 是 5，不是 0
- ETH 是 28，不是 1
- BNB 是 10，不是 2

### 规则2：可能有多个相同币种

例如：
- BTCUSD (index: 5, 最大杠杆: 100x)
- 1000BTCUSD (index: 47, 最大杠杆: 1000x)

**注意选择正确的市场！**

### 规则3：新币种会新增索引

交易所上新币种时，会分配新的 marketIndex。

---

## 📊 策略总览

现在系统支持 **12个策略**，覆盖 **3个币种**：

### BTC (marketIndex: 5)
- ✅ btc_conservative (做多)
- ✅ btc_neutral (做多)
- ✅ btc_aggressive (做多)
- ✅ btc_short_conservative (做空)
- ✅ btc_short_aggressive (做空)

### ETH (marketIndex: 28)
- ✅ eth_moderate (做多)
- ✅ eth_short_moderate (做空)
- ✅ eth_short_aggressive (做空)

### BNB (marketIndex: 10) ⭐ 新增
- ✅ bnb_moderate (做多)
- ✅ bnb_aggressive (做多)
- ✅ bnb_short_moderate (做空)
- ✅ bnb_short_aggressive (做空)

---

**所有 marketIndex 已正确配置，可以安全运行策略了！** ✅

