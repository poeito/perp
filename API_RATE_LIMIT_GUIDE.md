# ⏱️ API 频率限制处理指南

## 问题说明

Bumpin API 有频率限制保护，当短时间内发送过多请求时，会返回 HTTP 429 错误：

```json
{
  "code": 429,
  "msg": "RATE_LIMITED",
  "success": false
}
```

---

## 🛡️ 已实现的防护措施

### 1. 多策略启动延迟

**问题**：启动多个策略时，每个策略都会立即调用 `getAccountInfo()` 验证账户，导致请求过于集中。

**解决方案**：
```javascript
// 策略之间间隔 3 秒依次启动
for (let i = 0; i < strategies.length; i++) {
    await startStrategy(strategies[i]);
    if (i < strategies.length - 1) {
        await sleep(3000); // 等待 3 秒
    }
}
```

**效果**：
```
[1/3] 正在启动策略: btc_conservative...
✅ btc_conservative 启动成功

⏱️  等待 3 秒后启动下一个策略...

[2/3] 正在启动策略: btc_neutral...
✅ btc_neutral 启动成功

⏱️  等待 3 秒后启动下一个策略...

[3/3] 正在启动策略: eth_moderate...
✅ eth_moderate 启动成功
```

---

### 1.5. 检查周期自动错开 ⭐ 新增

**问题**：即使启动时有延迟，但多个策略的定期检查（价格查询）会同时触发，导致 API 请求叠加。

**示例问题**：
```
时间轴：
0秒  - BTC策略启动，立即查询价格
3秒  - ETH策略启动，立即查询价格  ← 启动时已错开
30秒 - BTC策略定期检查，查询价格
33秒 - ETH策略定期检查，查询价格  
60秒 - BTC策略定期检查，查询价格  } 
63秒 - ETH策略定期检查，查询价格  } ← 又变成同时请求！
```

**解决方案**：
```javascript
// 根据策略数量，计算每个策略的初始延迟
const checkInterval = 30000; // 30秒
const totalStrategies = 3;
const initialDelay = (checkInterval / totalStrategies) * strategyIndex;

// 策略1: 延迟 0秒 后开始检查
// 策略2: 延迟 10秒 后开始检查
// 策略3: 延迟 20秒 后开始检查
```

**效果**：
```
时间轴（检查间隔30秒，3个策略）：
0秒  - 策略1 首次检查 ✓
10秒 - 策略2 首次检查 ✓  ← 错开10秒
20秒 - 策略3 首次检查 ✓  ← 错开20秒
30秒 - 策略1 定期检查 ✓
40秒 - 策略2 定期检查 ✓  ← 持续错开
50秒 - 策略3 定期检查 ✓
60秒 - 策略1 定期检查 ✓
...
```

**日志显示**：
```
🚀 启动网格交易策略...
⏱️  检查间隔: 30秒
⏱️  初始延迟: 10秒（错开检查周期）  ← 自动计算
```

---

### 1.6. 全局API节流器 ⭐ 新增

**问题**：即使检查周期错开，但启动阶段的多个API调用（验证账户 → 查询价格）间隔太短。

**示例问题**：
```
策略启动时的API调用：
0.0秒 - BTC策略: getAccountInfo()
0.1秒 - BTC策略: getCurrentPrice()  ← 间隔太短！
3.0秒 - ETH策略: getAccountInfo()
3.1秒 - ETH策略: getCurrentPrice()  ← HTTP 429错误
```

**解决方案**：
```javascript
// 全局API节流器（所有策略共享）
class APIThrottler {
    constructor(minInterval = 2000) {
        this.minInterval = 2000; // 强制最小间隔2秒
        this.lastRequestTime = 0;
    }

    async throttle() {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minInterval) {
            const waitTime = this.minInterval - timeSinceLastRequest;
            await sleep(waitTime); // 等待
        }
        
        this.lastRequestTime = Date.now();
    }
}

// 在每个API调用前强制节流
async getCurrentPrice() {
    await globalThrottler.throttle(); // 确保间隔至少2秒
    return await this.api.getPrice(this.symbol);
}
```

**效果**：
```
实际执行时间轴：
0.0秒 - BTC策略: getAccountInfo() ✓
2.0秒 - BTC策略: getCurrentPrice() ✓  ← 强制等待2秒
5.0秒 - ETH策略: getAccountInfo() ✓   ← 启动延迟3秒
7.0秒 - ETH策略: getCurrentPrice() ✓  ← 再等待2秒

✅ 所有API请求间隔至少2秒
```

**日志显示**：
```
⏱️  API节流：等待 1500ms（避免请求过快）
✅ 请求成功
```

---

### 2. API 请求自动重试

**问题**：即使有延迟，偶尔还是可能触发限流。

**解决方案**：
```javascript
async retryApiCall(apiCall, maxRetries = 3, retryDelay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const result = await apiCall();
        
        // 检测到 429 错误，自动重试
        if (result && result.code === 429) {
            console.log(`⏱️  API限流 (429)，等待后重试 (${attempt}/${maxRetries})...`);
            if (attempt < maxRetries) {
                await sleep(retryDelay);
                continue;
            }
        }
        return result;
    }
}
```

**效果**：
```
⏱️  API限流 (429)，等待 2000ms 后重试 (1/3)...
⏱️  API限流 (429)，等待 2000ms 后重试 (2/3)...
✅ 请求成功
```

---

### 3. 已应用防护机制的 API

以下 API 调用已自动支持多重防护：

| API 方法 | 全局节流 | 重试次数 | 重试间隔 | 说明 |
|---------|---------|---------|---------|------|
| `getAccountInfo()` | ✅ 2秒 | 3次 | 3秒 | 账户信息查询 |
| `getCurrentPrice()` | ✅ 2秒 | 3次 | 2秒 | 价格查询 |
| `getCurrentPositions()` | ✅ 2秒 | - | - | 持仓查询 |
| `executeBuyOrder()` | ❌ | 内置 | - | 买入订单（不节流，保证及时） |
| `executeSellOrder()` | ❌ | 内置 | - | 卖出订单（不节流，保证及时） |

**说明**：
- ✅ = 应用全局节流，确保与其他API请求间隔至少2秒
- ❌ = 不应用节流，确保订单执行的及时性

---

## 📋 使用建议

### 1. 启动策略数量

**建议**：
- **1-2个策略**：无需特别注意，系统自动处理
- **3-5个策略**：推荐，启动时间约 6-12 秒
- **5个以上**：谨慎，启动时间较长

**计算公式**：
```
启动时间 ≈ (策略数量 - 1) × 3秒 + 每个策略验证时间(~2秒)
```

**示例**：
```bash
# 2个策略：约 5 秒
node grid-multi-runner.js btc_conservative eth_moderate

# 4个策略：约 11 秒
node grid-multi-runner.js all
```

---

### 2. 检查间隔配置

在 `grid-config.json` 中调整每个策略的检查间隔：

```json
{
  "btc_conservative": {
    "checkInterval": 30000,  // 30秒（保守，推荐）
    ...
  },
  "btc_aggressive": {
    "checkInterval": 5000,   // 5秒（激进，慎用）
    ...
  }
}
```

**建议**：
- **保守策略**：≥ 30秒
- **激进策略**：≥ 10秒  
- **多个策略同时运行**：建议每个策略间隔 ≥ 15秒

---

### 3. 错开检查时间

如果运行多个策略，可以手动错开它们的启动时间：

```bash
# 终端1：立即启动 BTC 策略
node grid-strategy-runner.js btc_conservative

# 等待 5 秒后

# 终端2：启动 ETH 策略
node grid-strategy-runner.js eth_moderate
```

这样它们的检查周期会自然错开。

---

## 🔍 如何判断是否触发限流

### 日志特征

**触发限流**：
```
⏱️  API限流 (429)，等待 2000ms 后重试 (1/3)...
```

**请求成功**：
```
✅ btc_conservative 启动成功
💼 账户信息:
   可用余额: 1234.56
```

**重试失败**：
```
❌ 获取账户信息失败: API请求失败 (429)
❌ btc_neutral: 无法获取账户信息
```

---

## 🛠️ 故障排除

### 问题1：多个策略启动时部分失败

**症状**：
```
✅ 成功启动 1/3 个策略
❌ eth_moderate: 无法获取账户信息
```

**原因**：启动间隔不够，触发限流

**解决**：
1. 系统已自动增加到 3 秒间隔
2. 如果仍失败，可以手动分批启动：

```bash
# 第一批
node grid-multi-runner.js btc_conservative btc_neutral

# 等待 10 秒后

# 第二批
node grid-multi-runner.js eth_moderate
```

---

### 问题2：策略运行中频繁限流

**症状**：
```
⏱️  API限流 (429)，等待 2000ms 后重试 (1/3)...
⏱️  API限流 (429)，等待 2000ms 后重试 (2/3)...
```

**原因**：检查间隔太短或运行策略过多

**解决**：
1. 增加 `checkInterval`（从 5 秒改为 15-30 秒）
2. 减少同时运行的策略数量

**修改配置**：
```json
{
  "btc_aggressive": {
    "checkInterval": 15000,  // 从 5000 改为 15000
    ...
  }
}
```

---

### 问题3：所有策略都无法启动

**症状**：
```
✅ 成功启动 0/4 个策略
```

**可能原因**：
1. API 密钥错误
2. 网络连接问题
3. 短时间内启动过多次

**解决**：
1. 检查 `.env` 文件中的 API 密钥
2. 测试网络连接：`npm run grid-test`
3. 等待 1-2 分钟后重试

---

## 📊 API 限流恢复时间

根据观察，Bumpin API 的限流策略：

| 限流类型 | 恢复时间 | 建议间隔 |
|---------|---------|---------|
| 轻度限流 | 2-3 秒 | 增加间隔到 15 秒 |
| 中度限流 | 10-30 秒 | 暂停策略，等待恢复 |
| 严重限流 | 1-5 分钟 | 检查配置，减少请求频率 |

---

## ✅ 最佳实践总结

### 启动阶段
1. ✅ 使用 `grid-multi-runner.js`（已内置多重防护）
   - 策略间隔3秒启动
   - 检查周期自动错开
   - 全局API节流（2秒）
2. ✅ 一次启动不超过 5 个策略
3. ✅ 观察启动日志，确保都成功
4. ✅ 注意 "API节流" 提示是正常现象

### 运行阶段
1. ✅ 保守策略：`checkInterval` ≥ 30 秒
2. ✅ 激进策略：`checkInterval` ≥ 10 秒
3. ✅ 多策略运行：每个策略 ≥ 15 秒
4. ✅ 系统自动确保API请求间隔 ≥ 2秒

### 故障处理
1. ✅ 系统会自动重试（最多 3 次）
2. ✅ 全局节流器自动控制请求频率
3. ✅ 如果仍失败，等待 1-2 分钟后重启
4. ✅ 调整配置，增加检查间隔

---

## 🚀 推荐配置

### 单个策略（快速测试）
```json
{
  "btc_test": {
    "checkInterval": 10000  // 10秒，快速响应
  }
}
```

### 2-3个策略（平衡配置）
```json
{
  "btc_conservative": {
    "checkInterval": 20000  // 20秒
  },
  "eth_moderate": {
    "checkInterval": 20000  // 20秒
  }
}
```

### 4个以上策略（保守配置）
```json
{
  "btc_conservative": {
    "checkInterval": 30000  // 30秒
  },
  "btc_neutral": {
    "checkInterval": 30000
  },
  "eth_moderate": {
    "checkInterval": 30000
  },
  "btc_aggressive": {
    "checkInterval": 30000
  }
}
```

---

## 📞 技术支持

如果频繁遇到限流问题：

1. 查看 `API_CONFIG_GUIDE.md` - API 配置说明
2. 查看 `MULTI_STRATEGY_GUIDE.md` - 多策略运行指南
3. 调整配置后重试

---

**记住**：耐心是网格交易的美德，不需要过于频繁地检查价格！ ⏱️✨

