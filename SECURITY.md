# 🔐 安全政策和最佳实践

## 📋 目录

- [重要声明](#重要声明)
- [API 密钥安全](#api-密钥安全)
- [环境变量管理](#环境变量管理)
- [Git 安全检查](#git-安全检查)
- [报告安全问题](#报告安全问题)
- [安全检查清单](#安全检查清单)

## ⚠️ 重要声明

**本仓库为公开仓库**，任何提交到此仓库的内容都将对全世界可见。请务必遵守以下安全准则：

### 🚫 绝对禁止

- ❌ 在代码中硬编码 API 密钥
- ❌ 提交 `.env` 文件到 Git
- ❌ 在 Issues、Pull Requests 中分享真实密钥
- ❌ 在截图中暴露敏感配置
- ❌ 提交包含交易记录的日志文件
- ❌ 分享包含持仓信息的状态文件

### ✅ 必须遵守

- ✅ 所有密钥通过 `.env` 文件管理
- ✅ 确保 `.env` 在 `.gitignore` 中
- ✅ 使用 `env.example` 作为配置模板
- ✅ 定期检查 Git 状态，避免误提交
- ✅ 提交前审查代码变更

## 🔑 API 密钥安全

### 获取 API 密钥

1. 前往交易所后台生成 API 密钥
2. **建议**：测试时使用只读权限的密钥
3. **建议**：为此项目单独创建一个 API 密钥
4. **建议**：设置 IP 白名单限制

### 存储 API 密钥

**正确方式** ✅
```json
// grid-config.json（不会被提交到 Git）
{
  "strategies": {
    "my_strategy": {
      "apiKey": "your_actual_api_key_here",
      "secretKey": "your_actual_secret_key_here",
      "symbol": "BTCUSD",
      ...
    }
  }
}
```

```json
// backpack-grid-config.json（不会被提交到 Git）
{
  "strategies": {
    "my_strategy": {
      "apiKey": "your_backpack_api_key_here",
      "apiSecret": "your_backpack_api_secret_here",
      "symbol": "SOL_USDC",
      ...
    }
  }
}
```

**错误方式** ❌
```javascript
// 不要这样做！
const apiKey = "abc123...";  // 危险！硬编码密钥
const secretKey = "xyz789...";  // 危险！
```

### 使用 API 密钥

**正确方式** ✅
```bash
# 从配置文件运行（推荐）
node grid-strategy-runner.js btc_conservative
node backpack-grid-runner.js sol_strategy
```

```javascript
// 或在代码中从配置文件读取
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('grid-config.json', 'utf8'));
const strategy = config.strategies['my_strategy'];
const api = new BumpinAPI(strategy.apiKey, strategy.secretKey);
```

**错误方式** ❌
```javascript
// 不要这样做！
const api = new BumpinAPI("abc123...", "xyz789...");  // 硬编码！
```

## 📁 配置文件管理

### 创建配置文件

**Bumpin 交易所**:
```bash
# 从模板创建配置文件
cp grid-config-template.json grid-config.json

# 编辑 grid-config.json，填入你的 API 密钥
```

**Backpack 交易所**:
```bash
# 从模板创建配置文件
cp backpack-grid-config-template.json backpack-grid-config.json

# 编辑 backpack-grid-config.json，填入你的 API 密钥
```

### 配置文件结构

**Bumpin 配置示例**:
```json
{
  "strategies": {
    "btc_conservative": {
      "name": "BTC保守型策略",
      "apiKey": "你的真实API密钥",
      "secretKey": "你的真实Secret密钥",
      "symbol": "BTCUSD",
      "marketIndex": 0,
      "gridLower": 58000,
      "gridUpper": 62000,
      "gridNumber": 5,
      "investmentPerGrid": 5,
      "leverage": 5,
      "checkInterval": 30000
    }
  }
}
```

**Backpack 配置示例**:
```json
{
  "strategies": {
    "sol_strategy": {
      "name": "SOL网格策略",
      "apiKey": "你的Backpack API Key",
      "apiSecret": "你的Backpack API Secret",
      "symbol": "SOL_USDC",
      "gridLower": 140,
      "gridUpper": 160,
      "gridNumber": 10,
      "amountPerGrid": 0.1,
      "orderType": "Limit",
      "checkInterval": 20000
    }
  }
}
```

### 配置文件安全

- ✅ 已自动添加到 `.gitignore`
- ✅ 不会被 Git 跟踪
- ✅ 本地文件，不会上传到 GitHub
- ✅ 每个开发者自己创建和管理
- ✅ 支持多策略配置

## 🛡️ Git 安全检查

### 提交前检查

每次提交代码前，请运行以下检查：

```bash
# 1. 查看将要提交的文件
git status

# 2. 审查文件变更内容
git diff

# 3. 确认配置文件不在列表中
git status | grep -E "grid-config.json|backpack-grid-config.json|\.env$"
# 应该没有任何输出！

# 4. 检查 .gitignore 配置
cat .gitignore | grep -E "config.json|\.env"
# 应该能看到配置文件被忽略
```

### 搜索潜在的敏感信息

```bash
# 搜索可能硬编码的密钥
grep -r "apiKey.*:" --include="*.js" --exclude-dir=node_modules . | \
  grep -v "process.env" | \
  grep -v "your_api_key" | \
  grep -v "config.apiKey" | \
  grep -v "strategy.apiKey"

# 如果有可疑输出，说明可能有硬编码的密钥！

# 搜索 JSON 文件中的真实密钥（排除模板）
grep -r "apiKey" --include="*-config.json" --exclude="*-template.json" . 2>/dev/null
# 应该没有输出（配置文件应该被忽略）
```

### 查看 Git 历史

```bash
# 检查配置文件是否曾经被提交
git log --all --full-history -- grid-config.json
git log --all --full-history -- backpack-grid-config.json
git log --all --full-history -- .env

# 应该都显示 "no commits found" 或为空
```

### 检查暂存区

```bash
# 查看暂存区内容
git diff --cached

# 检查暂存区文件名
git diff --cached --name-only | grep -E "config.json|\.env|state|trade-log"

# 应该没有敏感文件
```

## 🚨 已泄露密钥的应急处理

如果你不慎将密钥提交到了 Git 或公开分享：

### 1. 立即撤销密钥 ⚡

**这是最重要的步骤！**

1. 立即登录交易所后台
2. 撤销/删除被泄露的 API 密钥
3. 生成新的 API 密钥
4. 更新本地 `.env` 文件

### 2. 从 Git 历史中清除（可选）

如果密钥已经提交到 Git：

```bash
# 方法1: 使用 git filter-branch 删除敏感文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch grid-config.json backpack-grid-config.json .env" \
  --prune-empty --tag-name-filter cat -- --all

# 方法2: 使用 BFG Repo-Cleaner (更快)
# 下载 BFG: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files grid-config.json
java -jar bfg.jar --delete-files backpack-grid-config.json
java -jar bfg.jar --delete-files .env

# 清理和强制推送
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

⚠️ **警告**：`git push --force` 会重写远程仓库历史，谨慎使用！

### 3. 通知相关方

如果是团队项目：
- 通知所有团队成员密钥已更新
- 要求所有人更新本地 `.env` 文件
- 检查是否有异常交易记录

## 📋 安全检查清单

在公开代码前，请确认：

### 代码层面

- [ ] 没有硬编码的 API 密钥
- [ ] 没有硬编码的 Secret 密钥
- [ ] 所有敏感配置都从环境变量读取
- [ ] 使用 `env.example` 作为配置模板

### Git 层面

- [ ] `grid-config.json` 在 `.gitignore` 中
- [ ] `backpack-grid-config.json` 在 `.gitignore` 中
- [ ] `.env` 文件在 `.gitignore` 中（如有使用）
- [ ] 配置文件未被 Git 跟踪
- [ ] Git 历史中没有配置文件
- [ ] 交易日志文件已忽略（`.trade-log-*.jsonl`, `.backpack-trade-log-*.jsonl`）
- [ ] 状态文件已忽略（`.grid-state-*.json`, `.backpack-grid-state-*.json`）

### 文档层面

- [ ] README 中的示例使用占位符
- [ ] 文档截图不包含真实密钥
- [ ] 配置示例标注为"示例"或"占位符"

### 测试层面

- [ ] 运行 `git status` 确认无敏感文件
- [ ] 运行搜索命令检查硬编码密钥
- [ ] 查看 `git diff` 确认提交内容安全

## 🔍 定期安全审计

建议每月进行一次安全审计：

```bash
# 1. 检查是否有新的敏感文件
git status

# 2. 审查 .gitignore 配置
cat .gitignore

# 3. 搜索可能的密钥泄露
grep -r "sk_\|pk_\|api_key\|secret" --include="*.js" . | grep -v node_modules

# 4. 检查环境变量使用
grep -r "process.env" --include="*.js" . | grep -v node_modules

# 5. 更新 API 密钥（推荐）
# 定期到交易所后台重新生成密钥
```

## 📞 报告安全问题

如果你发现了安全漏洞或潜在的安全问题：

### 请勿公开披露

- ❌ 不要在 GitHub Issues 中公开
- ❌ 不要在社交媒体上分享
- ❌ 不要在公开论坛中讨论

### 负责任的披露

1. 通过私密渠道联系项目维护者
2. 提供详细的问题描述
3. 如有可能，提供修复建议
4. 等待确认和修复

## 🔗 相关资源

- [GitHub 安全最佳实践](https://docs.github.com/en/code-security/getting-started/best-practices-for-preventing-data-leaks-in-your-organization)
- [Git 敏感信息清理工具 BFG](https://rtyley.github.io/bfg-repo-cleaner/)
- [环境变量最佳实践](https://12factor.net/config)

## 📝 最佳实践总结

1. **永远不要硬编码密钥** - 使用环境变量
2. **定期更换 API 密钥** - 建议每月更换
3. **使用只读权限测试** - 测试时降低风险
4. **设置 IP 白名单** - 限制 API 访问来源
5. **备份密钥要加密** - 使用密码管理器
6. **提交前仔细检查** - 养成审查习惯
7. **发现泄露立即行动** - 第一时间撤销密钥

---

**记住：密钥保护是交易安全的第一道防线！** 🛡️

任何关于安全的疑问，宁可多问一次，也不要冒险！

