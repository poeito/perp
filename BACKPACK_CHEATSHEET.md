# Backpack 网格策略速查表 📋

## 快速命令

```bash
# 安装依赖
npm install

# 查看所有策略
npm run backpack-list

# 运行策略
npm run backpack-sol-conservative    # SOL保守
npm run backpack-sol-aggressive      # SOL激进
npm run backpack-btc-conservative    # BTC保守

# 运行示例
npm run backpack-example

# 或直接使用 node
node backpack-grid-runner.js list
node backpack-grid-runner.js sol_conservative
```

## 配置文件位置

```
backpack-grid-config.json        # 主配置文件
backpack-grid-config-template.json  # 模板
```

## 生成文件

```
.backpack-grid-state-SOL-USDC.json     # 状态文件
.backpack-trade-log-SOL-USDC.jsonl     # 交易日志
```

## 最小配置

```json
{
  "strategies": {
    "my_strategy": {
      "apiKey": "your_key",
      "apiSecret": "your_secret",
      "symbol": "SOL_USDC",
      "gridLower": 140,
      "gridUpper": 160,
      "gridNumber": 10,
      "amountPerGrid": 0.1
    }
  }
}
```

## 参数速查

| 参数 | 说明 | 示例 |
|------|------|------|
| `symbol` | 交易对 | `SOL_USDC` |
| `gridLower` | 下限 | `140` |
| `gridUpper` | 上限 | `160` |
| `gridNumber` | 网格数 | `10` |
| `amountPerGrid` | 每格数量 | `0.1` |
| `orderType` | 订单类型 | `Limit` |
| `checkInterval` | 检查间隔(ms) | `20000` |

## 支持的交易对

- `SOL_USDC`
- `BTC_USDC`
- `ETH_USDC`
- `JTO_USDC`
- 更多...

## 常用操作

### 停止策略
```
按 Ctrl+C
```

### 查看日志
```bash
cat .backpack-trade-log-SOL-USDC.jsonl
```

### 查看状态
```bash
cat .backpack-grid-state-SOL-USDC.json
```

### 清理状态（重新开始）
```bash
rm .backpack-grid-state-*.json
rm .backpack-trade-log-*.jsonl
```

## 网格计算

```javascript
// 网格间距
gridStep = (gridUpper - gridLower) / gridNumber

// 网格价格
gridPrice[i] = gridLower + (gridStep × i)

// 所需资金
maxFunds = gridUpper × amountPerGrid × (gridNumber + 1)
```

## 推荐配置

### 保守型
```
网格范围: ±10%
网格数量: 10
检查间隔: 30秒
```

### 温和型
```
网格范围: ±15%
网格数量: 15
检查间隔: 20秒
```

### 激进型
```
网格范围: ±20%
网格数量: 30
检查间隔: 10秒
```

## 故障排查

### API Key 错误
```
检查 backpack-grid-config.json 中的密钥
确认启用了 Trading 权限
```

### 余额不足
```
减少 amountPerGrid
减少 gridNumber
充值 USDC
```

### 网络问题
```
检查网络连接
配置代理（如需要）
```

## 文档链接

- 📖 快速入门：`BACKPACK_QUICKSTART.md`
- 📚 详细指南：`BACKPACK_GRID_GUIDE.md`
- 🏠 主文档：`BACKPACK_README.md`
- 💻 示例代码：`backpack-grid-example.js`

## 获取 API Key

1. 访问 https://backpack.exchange
2. Settings → API Keys
3. Create New API Key
4. 启用 Trading 权限
5. 保存 Key 和 Secret

## 快速测试

```bash
# 1. 复制模板
cp backpack-grid-config-template.json backpack-grid-config.json

# 2. 编辑配置（填入API密钥）
vim backpack-grid-config.json

# 3. 运行测试
npm run backpack-sol-conservative
```

## 紧急停止

```bash
# 方法1: Ctrl+C
# 方法2: 
killall node

# 方法3: 找到进程
ps aux | grep backpack
kill <PID>
```

## 状态说明

```
🟢 = 有持仓
⚪ = 无持仓
✅ = 操作成功
❌ = 操作失败
⚠️ = 警告
💹 = 价格
📊 = 状态
💰 = 资金
```

## 性能数据

- API 请求间隔：最小 2 秒
- 状态检查间隔：10-30 秒（可配置）
- 自动重试次数：3 次
- 重试延迟：3 秒

## 风险等级

| 配置 | 风险 | 收益 | 适合 |
|------|------|------|------|
| 保守 | 低 | 低 | 新手 |
| 温和 | 中 | 中 | 大众 |
| 激进 | 高 | 高 | 高手 |

---

**提示**：建议从保守型开始，熟悉后再尝试激进型。

