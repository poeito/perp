# 🤖 多策略并行运行指南

## 概述

多策略运行器允许你同时运行多个交易对的网格策略，实现投资组合的多元化和风险分散。

---

## ✨ 功能特点

- ✅ **并行运行** - 同时运行多个交易对策略
- ✅ **独立管理** - 每个策略独立状态和交易记录
- ✅ **统一监控** - 定期显示所有策略的运行状态
- ✅ **灵活配置** - 可选择运行部分或全部策略
- ✅ **安全可靠** - 统一的错误处理和优雅退出

---

## 📋 配置准备

### 1. 复制配置模板

```bash
cp grid-config-template.json grid-config.json
```

### 2. 编辑配置文件

在 `grid-config.json` 中配置多个策略：

```json
{
  "strategies": {
    "btc_conservative": {
      "name": "BTC保守型策略",
      "apiKey": "你的API密钥",
      "secretKey": "你的Secret密钥",
      "symbol": "BTCUSD",
      "marketIndex": 0,
      "gridLower": 58000,
      "gridUpper": 62000,
      "gridNumber": 5,
      "investmentPerGrid": 5,
      "leverage": 5
    },
    "eth_moderate": {
      "name": "ETH温和策略",
      "apiKey": "你的API密钥",
      "secretKey": "你的Secret密钥",
      "symbol": "ETHUSD",
      "marketIndex": 1,
      "gridLower": 3000,
      "gridUpper": 3500,
      "gridNumber": 10,
      "investmentPerGrid": 15,
      "leverage": 8
    }
  }
}
```

---

## 🚀 使用方法

### 方式1：列出所有可用策略

```bash
npm run grid-multi
# 或
node grid-multi-runner.js
```

这会显示所有配置的策略及其详细信息。

### 方式2：运行指定策略

运行单个策略：
```bash
node grid-multi-runner.js btc_conservative
```

运行多个策略：
```bash
node grid-multi-runner.js btc_conservative eth_moderate
# 或使用简写
npm run grid-multi btc_conservative eth_moderate
```

### 方式3：运行所有策略

```bash
npm run grid-all
# 或
node grid-multi-runner.js all
```

---

## 📊 运行示例

### 示例1：运行两个BTC策略

```bash
node grid-multi-runner.js btc_conservative btc_neutral
```

输出：
```
================================================================================
🤖 多策略并行网格交易
================================================================================

📋 将启动以下 2 个策略:

1. btc_conservative (BTCUSD)
2. btc_neutral (BTCUSD)

⚠️  风险提示:
   ✓ 多个策略将同时运行
   ✓ 请确保账户余额充足
   ✓ 建议先测试单个策略
   ✓ 按 Ctrl+C 可停止所有策略

⏰ 策略将在 5 秒后启动...
```

### 示例2：运行跨交易对策略

```bash
node grid-multi-runner.js btc_conservative eth_moderate
```

这会同时运行 BTC 和 ETH 的网格策略。

---

## 📈 状态监控

运行后，系统会：

1. **启动时显示** - 每个策略的启动信息
2. **定期报告** - 每5分钟自动显示所有策略状态
3. **实时日志** - 每个策略的交易日志独立记录

### 状态报告示例

```
================================================================================
📊 多策略运行状态
================================================================================

🎯 btc_conservative
   交易对: BTCUSD
   当前价格: $60,123.45
   累计盈利: $12.5600
   活跃持仓: 3/5

🎯 eth_moderate
   交易对: ETHUSD
   当前价格: $3,245.67
   累计盈利: $8.3400
   活跃持仓: 5/10

================================================================================
```

---

## 📁 文件管理

每个策略都有独立的文件：

### 状态文件
```
.grid-state-BTCUSD-0.json    # BTC策略状态
.grid-state-ETHUSD-1.json    # ETH策略状态
```

### 交易记录
```
.trade-log-BTCUSD-0.jsonl    # BTC交易记录
.trade-log-ETHUSD-1.jsonl    # ETH交易记录
```

这些文件互不干扰，每个策略独立维护。

---

## ⚠️  注意事项

### 1. 资金管理
- 确保账户余额足够支持所有策略
- 建议总投资不超过账户的50%
- 预留足够的保证金应对市场波动

### 2. 风险控制
- 首次使用建议先运行1-2个策略
- 不同交易对分散风险
- 设置合理的止损参数

### 3. 系统资源
- 策略越多，系统资源占用越大
- 建议同时运行不超过5个策略
- 确保网络连接稳定

### 4. 策略配置
- 避免同一交易对配置重叠的网格范围
- 合理设置检查间隔，避免频繁请求API
- 每个策略的杠杆和投资金额应独立评估

---

## 🛑 停止策略

按 `Ctrl+C` 可以停止所有运行中的策略。

系统会：
1. 接收到停止信号
2. 依次停止所有策略
3. 保存最新状态
4. 优雅退出

```
⏸️  正在停止所有策略...

✅ btc_conservative 已停止
✅ eth_moderate 已停止

👋 所有策略已停止
```

---

## 💡 最佳实践

### 1. 测试流程
```bash
# 步骤1: 测试单个策略配置
npm run grid-test

# 步骤2: 运行单个策略
node grid-strategy-runner.js btc_conservative

# 步骤3: 确认无误后，运行多个策略
node grid-multi-runner.js btc_conservative eth_moderate
```

### 2. 策略组合建议

**保守组合**（适合新手）：
```bash
node grid-multi-runner.js btc_conservative eth_moderate
```

**激进组合**（适合有经验者）：
```bash
node grid-multi-runner.js btc_aggressive btc_neutral eth_moderate
```

**全市场组合**（最大分散）：
```bash
node grid-multi-runner.js all
```

### 3. 监控建议

- 定期查看交易记录文件
- 关注累计盈利和活跃持仓
- 根据市场情况调整策略参数

---

## 🔧 故障排除

### 问题1：策略启动失败

**可能原因**：
- API密钥配置错误
- 账户余额不足
- 网络连接问题

**解决方法**：
```bash
# 检查配置
npm run grid-test

# 查看错误日志
node grid-multi-runner.js [策略名]
```

### 问题2：策略异常停止

**可能原因**：
- 网络中断
- API请求频率过高
- 系统资源不足

**解决方法**：
- 重启策略（状态会自动恢复）
- 增加检查间隔
- 减少同时运行的策略数量

### 问题3：状态文件冲突

**说明**：
每个策略有独立的状态文件（基于 symbol 和 marketIndex），不会冲突。

---

## 📞 技术支持

如有问题，请查看：
- `GRID_STRATEGY_README.md` - 网格策略详细说明
- `README.md` - 项目总体说明
- 交易记录文件 - 查看历史交易详情

---

## 🎯 快速开始

```bash
# 1. 复制配置文件
cp grid-config-template.json grid-config.json

# 2. 编辑配置（填入API密钥）
vim grid-config.json

# 3. 测试配置
npm run grid-test

# 4. 运行多策略
npm run grid-multi btc_conservative eth_moderate

# 或运行所有策略
npm run grid-all
```

祝交易顺利！📈✨

