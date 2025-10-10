# Backpack 动态网格交易策略指南

## 📖 简介

这是一个基于 Backpack 交易所 API 的动态网格交易策略，支持现货自动化网格交易。

### 特点

- ✅ **现货交易**：无杠杆风险，适合稳健投资
- ✅ **动态网格**：自动根据价格变化买入卖出
- ✅ **智能建仓**：首次建仓选择最接近价格的网格，后续链式建仓
- ✅ **状态持久化**：自动保存和恢复交易状态
- ✅ **交易日志**：完整记录每笔交易
- ✅ **多策略支持**：可同时运行多个不同配置的策略

## 🚀 快速开始

### 1. 配置 API 密钥

编辑 `backpack-grid-config.json`，填入你的 Backpack API 密钥：

```json
{
  "strategies": {
    "sol_conservative": {
      "apiKey": "your_actual_api_key",
      "apiSecret": "your_actual_api_secret",
      ...
    }
  }
}
```

### 2. 查看可用策略

```bash
node backpack-grid-runner.js list
```

### 3. 运行策略

```bash
node backpack-grid-runner.js sol_conservative
```

## 📊 策略配置说明

### 基础参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `symbol` | 交易对 | `SOL_USDC` |
| `gridLower` | 网格下限价格 | `135` |
| `gridUpper` | 网格上限价格 | `165` |
| `gridNumber` | 网格数量 | `10` |
| `amountPerGrid` | 每格交易数量（基础币） | `0.1` |

### 交易参数

| 参数 | 说明 | 可选值 |
|------|------|--------|
| `orderType` | 订单类型 | `Limit`（限价）/ `Market`（市价） |
| `timeInForce` | 订单有效期 | `Gtc`（成交为止）/ `Ioc`（立即成交或取消） |
| `checkInterval` | 检查间隔（毫秒） | `10000` - `30000` |
| `stopLossPercent` | 止损百分比 | `0.05`（5%） |

## 💡 策略说明

### 网格交易原理

1. **网格划分**：在价格区间内均匀划分多个价格网格
2. **低买高卖**：价格下跌时买入，价格上涨时卖出
3. **循环套利**：在震荡行情中反复买卖获利

### 建仓逻辑

```
首次建仓：在最接近当前价格的网格建仓
后续建仓：价格跌破网格价格时，且上方网格有持仓（链式建仓）
平仓逻辑：价格上涨到下一个网格时卖出
```

### 示例场景

假设 SOL 当前价格 $150，配置如下：

```json
{
  "gridLower": 135,
  "gridUpper": 165,
  "gridNumber": 10,
  "amountPerGrid": 0.1
}
```

网格划分：
```
等级 0: $135 ⚪
等级 1: $138 ⚪
等级 2: $141 ⚪
等级 3: $144 ⚪
等级 4: $147 ⚪
等级 5: $150 🟢 ← 首次建仓
等级 6: $153 ⚪
等级 7: $156 ⚪
等级 8: $159 ⚪
等级 9: $162 ⚪
等级10: $165 ⚪
```

交易流程：
1. 价格 $150 → 在等级5建仓（买入 0.1 SOL）
2. 价格跌到 $147 → 在等级4建仓（买入 0.1 SOL）
3. 价格跌到 $144 → 在等级3建仓（买入 0.1 SOL）
4. 价格涨到 $147 → 平掉等级3仓位（卖出 0.1 SOL，获利 $0.3）
5. 价格涨到 $150 → 平掉等级4仓位（卖出 0.1 SOL，获利 $0.3）
6. 循环往复...

## 📁 文件说明

### 核心文件

- `backpack-grid-strategy.js` - 网格策略核心逻辑
- `backpack-grid-runner.js` - 策略运行器
- `backpack-grid-config.json` - 策略配置文件
- `backpack-api.js` - Backpack API 封装

### 生成文件

- `.backpack-grid-state-*.json` - 策略状态文件（自动生成）
- `.backpack-trade-log-*.jsonl` - 交易日志文件（自动生成）

## 🎯 内置策略

### SOL 策略

1. **sol_conservative** - 保守型（±10%，10网格）
2. **sol_moderate** - 温和型（±15%，15网格）
3. **sol_aggressive** - 激进型（±20%，30网格）

### BTC 策略

1. **btc_conservative** - 保守型（±8%，10网格）
2. **btc_aggressive** - 激进型（±15%，30网格）

### ETH 策略

1. **eth_moderate** - 温和型（±12%，15网格）

### 其他代币

1. **jto_aggressive** - JTO 激进型（±25%，20网格）

## ⚙️ 高级使用

### 自定义策略

在 `backpack-grid-config.json` 中添加新策略：

```json
{
  "strategies": {
    "my_custom_strategy": {
      "name": "我的自定义策略",
      "description": "根据我的需求配置",
      "apiKey": "your_api_key",
      "apiSecret": "your_api_secret",
      "symbol": "SOL_USDC",
      "gridLower": 140,
      "gridUpper": 160,
      "gridNumber": 20,
      "amountPerGrid": 0.2,
      "orderType": "Limit",
      "checkInterval": 15000,
      "stopLossPercent": 0.05
    }
  }
}
```

运行：
```bash
node backpack-grid-runner.js my_custom_strategy
```

### 多策略并行

可以在不同终端窗口运行多个策略：

```bash
# 终端 1
node backpack-grid-runner.js sol_conservative

# 终端 2
node backpack-grid-runner.js btc_conservative
```

### 查看交易日志

交易日志以 JSONL 格式保存，每行一个 JSON 对象：

```bash
cat .backpack-trade-log-SOL-USDC.jsonl
```

示例日志：
```json
{"timestamp":"2024-01-01T12:00:00.000Z","type":"BUY","gridLevel":5,"price":150,"quantity":0.1,"value":15}
{"timestamp":"2024-01-01T12:05:00.000Z","type":"SELL","gridLevel":5,"price":153,"quantity":0.1,"profit":0.3}
```

## ⚠️ 风险提示

1. **市场风险**：网格交易适合震荡市场，单边行情可能导致亏损
2. **资金风险**：确保账户有足够资金支持所有网格的买入
3. **技术风险**：API密钥安全，网络连接稳定
4. **测试建议**：建议先用小资金测试策略

## 📊 收益计算

### 单次套利收益

```
收益 = (卖出价 - 买入价) × 数量
收益率 = (卖出价 - 买入价) / 买入价 × 100%
```

### 示例

- 买入价：$147
- 卖出价：$150
- 数量：0.1 SOL
- 收益：($150 - $147) × 0.1 = $0.3
- 收益率：($150 - $147) / $147 × 100% = 2.04%

## 🛠️ 故障排查

### 常见问题

1. **无法获取价格**
   - 检查网络连接
   - 检查代理设置（如需要）
   - 确认交易对名称正确

2. **订单失败**
   - 检查账户余额是否充足
   - 检查交易对是否支持
   - 查看 API 返回的错误信息

3. **API 请求限流**
   - 策略已内置节流机制（最小间隔2秒）
   - 如遇限流，会自动重试

### 日志查看

策略运行时会实时输出日志：
- 🟢 = 有持仓
- ⚪ = 无持仓
- ✅ = 操作成功
- ❌ = 操作失败
- ⚠️ = 警告信息

## 📝 更新日志

### v1.0.0 (2024-10-09)
- ✅ 初始版本发布
- ✅ 支持现货网格交易
- ✅ 状态持久化
- ✅ 交易日志记录
- ✅ 多策略配置

## 📮 联系支持

如有问题或建议，请查看：
- Backpack API 文档：https://docs.backpack.exchange
- 项目源码：查看代码注释

## 📄 许可证

MIT License

---

**免责声明**：本策略仅供学习和研究使用，不构成投资建议。使用本策略进行实盘交易的风险由使用者自行承担。

