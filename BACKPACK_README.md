# Backpack 网格交易策略 📈

## 概述

基于 Backpack 交易所 API 的动态网格交易策略，支持现货自动化交易。

## 核心文件

### 1. 策略核心
- `backpack-grid-strategy.js` - 网格策略核心逻辑
- `backpack-api.js` - Backpack API 封装
- `logger.js` - 日志工具

### 2. 运行器
- `backpack-grid-runner.js` - 策略运行器（推荐使用）
- `backpack-grid-example.js` - 示例代码（学习用）

### 3. 配置文件
- `backpack-grid-config.json` - 策略配置（需要创建）
- `backpack-grid-config-template.json` - 配置模板

### 4. 文档
- `BACKPACK_QUICKSTART.md` - ⭐ 5分钟快速入门
- `BACKPACK_GRID_GUIDE.md` - 详细使用指南
- `BACKPACK_README.md` - 本文件

## 快速开始

### 方法一：使用运行器（推荐）

1. **复制配置模板**
   ```bash
   cp backpack-grid-config-template.json backpack-grid-config.json
   ```

2. **编辑配置文件**
   ```bash
   # 修改 backpack-grid-config.json
   # 填入你的 API Key 和 API Secret
   ```

3. **查看可用策略**
   ```bash
   npm run backpack-list
   # 或
   node backpack-grid-runner.js list
   ```

4. **运行策略**
   ```bash
   npm run backpack-sol-conservative
   # 或
   node backpack-grid-runner.js sol_conservative
   ```

### 方法二：使用示例代码

1. **编辑示例文件**
   ```bash
   # 修改 backpack-grid-example.js
   # 填入你的配置
   ```

2. **运行示例**
   ```bash
   npm run backpack-example
   # 或
   node backpack-grid-example.js
   ```

## NPM 脚本

```bash
# 列出所有可用策略
npm run backpack-list

# 运行指定策略
npm run backpack-sol-conservative  # SOL保守型
npm run backpack-sol-aggressive    # SOL激进型
npm run backpack-btc-conservative  # BTC保守型

# 运行示例
npm run backpack-example
```

## 核心功能

### ✅ 已实现

1. **智能建仓**
   - 首次建仓：选择最接近当前价格的网格
   - 后续建仓：链式建仓（上方网格有持仓时才建仓）
   - 避免过度建仓

2. **自动交易**
   - 价格下跌时自动买入
   - 价格上涨时自动卖出
   - 循环套利

3. **状态管理**
   - 状态持久化（自动保存/恢复）
   - 交易日志记录（JSONL格式）
   - 异常恢复

4. **风险控制**
   - API 请求节流（防止限流）
   - 价格范围检查
   - 止损配置

5. **用户体验**
   - 实时状态显示
   - 清晰的日志输出
   - 优雅退出处理

## 策略参数详解

### 必需参数

```javascript
{
  apiKey: "your_api_key",          // Backpack API Key
  apiSecret: "your_api_secret",    // Backpack API Secret
  symbol: "SOL_USDC",               // 交易对
  gridLower: 140,                   // 网格下限
  gridUpper: 160,                   // 网格上限
  gridNumber: 10,                   // 网格数量
  amountPerGrid: 0.1                // 每格交易数量
}
```

### 可选参数

```javascript
{
  orderType: "Limit",               // 订单类型：Limit/Market
  timeInForce: "Gtc",              // 订单有效期
  checkInterval: 20000,            // 检查间隔（毫秒）
  stopLossPercent: 0.05,           // 止损比例
  maxPositionValue: 1000           // 最大持仓价值
}
```

## 支持的交易对

Backpack 支持的任何现货交易对，例如：
- `SOL_USDC`
- `BTC_USDC`
- `ETH_USDC`
- `JTO_USDC`
- 等等...

## 文件说明

### 自动生成的文件

运行策略后会自动生成以下文件：

1. **状态文件**
   ```
   .backpack-grid-state-SOL-USDC.json
   ```
   - 保存网格状态
   - 保存持仓信息
   - 保存累计盈利

2. **交易日志**
   ```
   .backpack-trade-log-SOL-USDC.jsonl
   ```
   - JSONL 格式（每行一个JSON）
   - 记录所有交易
   - 可用于分析和回测

### 日志示例

```json
{"timestamp":"2024-10-09T12:00:00.000Z","type":"BUY","gridLevel":5,"price":150.23,"quantity":0.1,"value":15.023}
{"timestamp":"2024-10-09T12:30:00.000Z","type":"SELL","gridLevel":5,"price":153.45,"quantity":0.1,"profit":0.322}
```

## 网格交易原理

### 工作流程

```
1. 初始化
   ├─ 划分网格
   ├─ 加载历史状态
   └─ 获取当前价格

2. 运行循环
   ├─ 获取当前价格
   ├─ 检查买入机会
   │  ├─ 首次建仓？
   │  └─ 价格触发？
   ├─ 检查卖出机会
   │  └─ 价格达到？
   └─ 更新状态

3. 停止
   ├─ 保存状态
   └─ 打印报告
```

### 收益来源

1. **价格波动**：买低卖高
2. **多次套利**：反复交易
3. **复利效应**：利润再投资

## 风险提示

### ⚠️ 主要风险

1. **价格风险**
   - 单边下跌：资金被套
   - 单边上涨：踏空错失收益

2. **技术风险**
   - 网络中断：可能错过交易机会
   - API 故障：交易执行失败

3. **配置风险**
   - 参数不当：收益降低或风险增加
   - 资金不足：无法完成网格

### ✅ 风险控制

1. **合理配置**
   - 根据市场情况调整参数
   - 留足资金缓冲

2. **定期监控**
   - 每天检查运行状态
   - 关注市场趋势

3. **及时止损**
   - 设置止损线
   - 趋势确认后及时退出

## 性能优化

### API 请求优化

1. **全局节流**：最小间隔2秒
2. **自动重试**：失败后自动重试
3. **错误处理**：完善的异常处理

### 资金效率

1. **智能建仓**：避免过度建仓
2. **链式建仓**：提高资金利用率
3. **动态调整**：根据行情调整

## 对比 Bumpin 策略

| 特性 | Backpack 策略 | Bumpin 策略 |
|------|--------------|-------------|
| 交易类型 | 现货 | 合约 |
| 杠杆 | 无 | 支持 |
| 保证金 | 全额 | 部分 |
| 风险 | 较低 | 较高 |
| 收益 | 稳定 | 波动大 |
| 适合人群 | 稳健投资者 | 激进交易者 |

## 故障排查

### 常见错误

1. **API Key 错误**
   ```
   ❌ 无法获取账户信息
   ```
   - 检查 API Key 是否正确
   - 确认权限是否启用

2. **余额不足**
   ```
   ❌ 订单执行失败
   ```
   - 检查账户余额
   - 减少每格数量

3. **网络问题**
   ```
   ❌ 获取价格失败
   ```
   - 检查网络连接
   - 配置代理（如需要）

### 调试技巧

1. **查看日志**
   - 终端输出有详细信息
   - 检查错误提示

2. **检查状态**
   - 查看状态文件
   - 验证配置参数

3. **测试 API**
   - 单独测试 API 连接
   - 确认交易对可用

## 更新计划

### 未来功能

- [ ] WebSocket 实时价格
- [ ] 动态网格调整
- [ ] 多账户管理
- [ ] Web 管理界面
- [ ] 邮件/推送通知
- [ ] 策略回测工具

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

**免责声明**：本策略仅供学习研究使用，不构成投资建议。使用本策略的风险由使用者自行承担。

