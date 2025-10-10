# 🚀 快速开始 - 网格交易策略

## 5分钟上手指南

### 步骤1: 准备配置文件

复制配置模板：
```bash
cp grid-config-template.json grid-config.json
```

### 步骤2: 填入API密钥

编辑 `grid-config.json`，将 API 密钥替换为你的实际密钥：

```json
{
  "strategies": {
    "btc_conservative": {
      "apiKey": "你的_API_密钥",
      "secretKey": "你的_Secret_密钥",
      ...
    }
  }
}
```

### 步骤3: 调整网格参数（可选）

根据当前市场价格调整网格范围：

```json
{
  "gridLower": 60000,  // 调整为合理的下限
  "gridUpper": 70000,  // 调整为合理的上限
  "gridNumber": 10,    // 网格数量
  "investmentPerGrid": 10  // 每格投资金额
}
```

### 步骤4: 查看可用策略

```bash
npm run grid-list
```

或

```bash
node grid-strategy-runner.js list
```

### 步骤5: 启动策略

**方式1: 使用预设策略（推荐新手）**

```bash
# 保守型策略（低风险）
npm run grid-btc-conservative

# 中性策略（中等风险）
npm run grid-btc-neutral

# 激进型策略（高风险）
npm run grid-btc-aggressive
```

**方式2: 使用内置示例**

```bash
npm run grid
```

**方式3: 指定自定义策略**

```bash
node grid-strategy-runner.js <策略名称>
```

### 步骤6: 监控策略

策略启动后会实时显示：
- 当前价格
- 网格状态
- 持仓情况
- 累计盈利

```
💹 当前价格: $65432.10

📊 网格状态:
   等级 0: 🟢 持仓 $60000.00 | 入场: $60100.00 | 数量: 0.001661
   等级 1: ⚪ 空闲 $61000.00
   等级 2: 🟢 持仓 $62000.00 | 入场: $61900.00 | 数量: 0.001616
   ...

📈 活跃持仓: 5
💰 已投资金额: $500.00
💵 累计盈利: $12.45
```

### 步骤7: 停止策略

按 `Ctrl + C` 停止策略，程序会生成最终报告。

## 命令速查表

| 命令 | 说明 |
|------|------|
| `npm run grid-list` | 列出所有可用策略 |
| `npm run grid-btc-conservative` | 启动BTC保守型策略 |
| `npm run grid-btc-neutral` | 启动BTC中性策略 |
| `npm run grid-btc-aggressive` | 启动BTC激进型策略 |
| `npm run grid` | 启动内置示例策略 |

## 推荐配置

### 新手入门（总投资 $50-100）
```json
{
  "gridLower": 当前价格 × 0.95,
  "gridUpper": 当前价格 × 1.05,
  "gridNumber": 5,
  "investmentPerGrid": 10,
  "leverage": 5,
  "checkInterval": 30000
}
```

### 稳健交易（总投资 $200-500）
```json
{
  "gridLower": 当前价格 × 0.90,
  "gridUpper": 当前价格 × 1.10,
  "gridNumber": 10,
  "investmentPerGrid": 20,
  "leverage": 10,
  "checkInterval": 15000
}
```

### 积极套利（总投资 $1000+）
```json
{
  "gridLower": 当前价格 × 0.85,
  "gridUpper": 当前价格 × 1.15,
  "gridNumber": 20,
  "investmentPerGrid": 50,
  "leverage": 15,
  "checkInterval": 10000
}
```

## 常见问题速解

**Q: 如何获取当前BTC价格？**
```bash
node -e "const {BumpinAPI} = require('./bumpin-api'); new BumpinAPI('key','secret').getPrice('BTCUSD').then(r => console.log(r.data.price));"
```

**Q: 如何查看当前持仓？**
```bash
npm run example
# 取消注释第44行的持仓查询代码
```

**Q: 策略一直不交易？**
- 检查当前价格是否在网格范围内
- 确认账户余额是否充足
- 查看日志中的错误信息

**Q: 如何调整运行中的策略？**
- 停止当前策略 (Ctrl+C)
- 修改配置文件
- 重新启动策略

**Q: 可以同时运行多个策略吗？**
- 可以，但要确保：
  1. 使用不同的交易对
  2. 账户余额充足
  3. 分别在不同终端运行

## 安全提示 ⚠️

1. **先小额测试**：建议先用 $50-100 测试1-2天
2. **设置止损**：确保配置了合理的止损比例
3. **分散风险**：不要把全部资金投入单一策略
4. **定期检查**：每天至少检查1-2次策略运行状况
5. **新闻事件**：重大新闻前暂停策略
6. **保护密钥**：不要在公开场合分享你的API密钥

## 盈利预期

**震荡行情**（理想情况）：
- 保守策略：日收益 0.3-0.8%
- 中性策略：日收益 0.5-1.5%
- 激进策略：日收益 1.0-3.0%

**单边行情**（不利情况）：
- 可能出现浮动亏损
- 建议及时调整网格区间或暂停策略

**长期收益**：
- 取决于市场波动性和参数调优
- 建议每周复盘和优化

## 下一步

- 📖 阅读完整文档：`GRID_STRATEGY_README.md`
- 🔧 学习高级配置：`grid-config-template.json`
- 💡 了解策略原理：`grid-trading-strategy.js`
- 📊 查看API文档：`bumpin-api.js`

## 获取帮助

遇到问题？
1. 查看日志中的错误信息
2. 阅读 FAQ 部分
3. 检查网络连接和API密钥
4. 查看 API 官方文档

---

**祝交易顺利！** 🎯💰

