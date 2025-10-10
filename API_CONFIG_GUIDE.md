# 🔐 API 密钥配置指南

## 概述

为了方便管理和提高安全性，系统支持两种 API 密钥配置方式，你可以选择最适合你的方式。

---

## ✅ 方式A：使用 .env 文件（推荐）

### 优点
- ✅ **集中管理** - 所有策略共享同一个 API 密钥
- ✅ **更安全** - .env 文件已在 .gitignore 中，不会被提交到代码库
- ✅ **易于维护** - 只需在一个地方配置
- ✅ **更简洁** - 配置文件中不需要 API 密钥字段

### 配置步骤

1. **确保 .env 文件存在并已配置**：
   ```bash
   # 如果没有 .env 文件，运行设置命令
   npm run setup
   ```

2. **编辑 .env 文件**：
   ```bash
   vim .env
   ```

3. **填入你的 API 密钥**：
   ```env
   API_KEY=你的API密钥
   SECRET_KEY=你的Secret密钥
   ```

4. **在 grid-config.json 中无需配置 API 密钥**：
   ```json
   {
     "strategies": {
       "btc_conservative": {
         "name": "BTC保守型策略",
         "symbol": "BTCUSD",
         "marketIndex": 0,
         "gridLower": 114000,
         "gridUpper": 131000,
         ...
         // 注意：不需要 apiKey 和 secretKey 字段
       }
     }
   }
   ```

5. **运行策略**：
   ```bash
   node grid-multi-runner.js btc_conservative
   ```
   
   你会看到：
   ```
   ✓ 已从 .env 文件加载 API 密钥
   ```

---

## 🔧 方式B：直接在配置文件中填写

### 优点
- ✅ **灵活** - 可以为不同策略配置不同的 API 密钥
- ✅ **独立** - 策略配置自包含，不依赖外部文件

### 配置步骤

1. **编辑 grid-config.json**：
   ```bash
   vim grid-config.json
   ```

2. **直接填入 API 密钥**：
   ```json
   {
     "strategies": {
       "btc_conservative": {
         "apiKey": "api_w6M-vOxxx...",
         "secretKey": "yMhp0DOBr6xxx...",
         ...
       }
     }
   }
   ```

3. **运行策略**：
   ```bash
   node grid-multi-runner.js btc_conservative
   ```

### ⚠️ 注意
如果在配置文件中直接填写了 API 密钥，它会**覆盖** .env 文件中的配置。

---

## 🎯 配置优先级

系统按以下优先级加载 API 密钥：

```
1. grid-config.json 中的实际密钥（如果已填写）
   ↓
2. .env 文件中的密钥（如果 grid-config.json 中是占位符）
   ↓
3. 报错：未找到 API 密钥
```

---

## 📋 当前配置

你当前的配置文件 `grid-config.json` 使用的是**方式A（推荐）**：

```json
{
  "strategies": {
    "btc_conservative": {
      "name": "BTC保守型策略",
      "symbol": "BTCUSD",
      "marketIndex": 0,
      "gridLower": 114000,
      "gridUpper": 131000,
      ...
      // ✅ 已删除 apiKey 和 secretKey 字段
    }
  }
}
```

运行时会自动从 `.env` 文件加载真实的 API 密钥：
```
✓ 已从 .env 文件加载 API 密钥
```

---

## 💡 使用建议

### 个人使用（推荐方式A）
```bash
# 1. 配置 .env
echo "API_KEY=你的密钥" > .env
echo "SECRET_KEY=你的密钥" >> .env

# 2. grid-config.json 保持占位符
# 3. 直接运行
npm run grid-multi btc_conservative
```

### 团队使用或多账户
```bash
# 1. 每个策略配置不同的 API 密钥
vim grid-config.json

# 2. 直接在配置文件中填写
{
  "btc_conservative": {
    "apiKey": "账户1的密钥",
    ...
  },
  "btc_aggressive": {
    "apiKey": "账户2的密钥",
    ...
  }
}
```

---

## 🔍 验证配置

### 检查 .env 配置
```bash
cat .env
```

### 测试配置加载
```bash
npm run grid-test
```

### 查看运行日志
运行策略时，注意查看控制台输出：
```
✓ 已从 .env 文件加载 API 密钥  ← 使用 .env
或
✓ 使用配置文件中的 API 密钥  ← 使用 grid-config.json
```

---

## ❓ 常见问题

### Q1: 如何知道系统使用了哪个配置？
A: 运行策略时会显示提示信息：
- `✓ 已从 .env 文件加载 API 密钥` - 使用 .env
- 无提示 - 使用 grid-config.json 中的配置

### Q2: 可以混合使用两种方式吗？
A: 可以！某些策略用 .env，某些策略在配置文件中填写。

### Q3: 修改 .env 后需要重启吗？
A: 是的，修改 .env 后需要重新运行策略。

### Q4: .env 文件会被提交到 Git 吗？
A: 不会，.env 已在 .gitignore 中，确保密钥安全。

---

## 🚀 快速开始

```bash
# 推荐：使用 .env 配置
npm run setup              # 创建 .env
vim .env                   # 填入 API 密钥
node grid-multi-runner.js  # 查看可用策略
npm run grid-multi btc_conservative  # 运行策略
```

---

## 📞 技术支持

- `README.md` - 项目总体说明
- `MULTI_STRATEGY_GUIDE.md` - 多策略运行指南
- `GRID_CONFIG_ANALYSIS.md` - 网格配置详细分析

---

**祝配置顺利！** 🔐✨

