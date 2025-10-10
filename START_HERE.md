# 🎉 开始使用 - 环境变量配置版本

## ✨ 更新说明

现在所有的 API 密钥和配置都已经迁移到 `.env` 文件中管理，更加安全和便捷！

## 🚀 3步快速开始

### 第 1 步：安装依赖

```bash
npm install
```

### 第 2 步：创建配置文件

```bash
npm run setup
```

这会自动创建 `.env` 文件。

### 第 3 步：填写密钥

编辑 `.env` 文件，填入你的真实 API 密钥：

```bash
# 打开 .env 文件
# 将以下内容替换为你的实际密钥

API_KEY=
SECRET_KEY=

# 其他配置可以保持默认或根据需要调整
GRID_LOWER=60000
GRID_UPPER=70000
GRID_NUMBER=10
INVESTMENT_PER_GRID=10
```

## ✅ 验证配置

运行测试确保配置正确：

```bash
npm run grid-test
```

如果看到 ✅ 表示配置成功！

## 🎯 启动策略

```bash
# 使用默认配置启动
npm run grid

# 或选择预设策略
npm run grid-btc-conservative  # 保守型（推荐新手）
npm run grid-btc-neutral       # 中性型
npm run grid-btc-aggressive    # 激进型
```

## 📝 配置说明

### 必需配置

```bash
API_KEY=你的API密钥          # 必须填写
SECRET_KEY=你的Secret密钥    # 必须填写
```

### 网格策略配置（可选）

```bash
GRID_LOWER=60000           # 网格下限（建议当前价格的-10%）
GRID_UPPER=70000           # 网格上限（建议当前价格的+10%）
GRID_NUMBER=10             # 网格数量（5-20个）
INVESTMENT_PER_GRID=10     # 每格投资金额
DEFAULT_LEVERAGE=10        # 杠杆倍数（5-20）
CHECK_INTERVAL=10000       # 检查间隔（毫秒）
```

## 🔐 安全性

- ✅ `.env` 文件已自动添加到 `.gitignore`
- ✅ 不会被提交到 Git 仓库
- ✅ 请妥善保管你的密钥
- ✅ 不要在公开场合分享 `.env` 文件

## 📚 详细文档

- **快速入门**: [QUICKSTART.md](QUICKSTART.md)
- **环境变量配置**: [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md)
- **网格策略详解**: [GRID_STRATEGY_README.md](GRID_STRATEGY_README.md)
- **完整说明**: [README.md](README.md)

## 🆘 遇到问题？

### 问题1: 找不到配置文件

**解决方案**:
```bash
npm run setup
```

### 问题2: API 连接失败

**检查项**:
1. `.env` 文件是否存在
2. API_KEY 和 SECRET_KEY 是否正确
3. 运行 `npm run grid-test` 查看详细错误

### 问题3: 配置不生效

**解决方案**:
修改 `.env` 后需要重启程序才能生效。

## 💡 最佳实践

1. **先小额测试**: 建议先用 $50-100 测试 1-2 天
2. **定期检查**: 每天至少查看 1-2 次策略运行状况
3. **备份配置**: 备份 `.env` 文件到安全的地方
4. **监控行情**: 重大新闻前建议暂停策略
5. **风险控制**: 不要投入超过总资金的 30%

## 🎁 可用命令总览

| 命令 | 功能 |
|------|------|
| `npm run setup` | 创建 .env 配置文件 |
| `npm run grid-test` | 测试配置是否正确 |
| `npm run grid` | 启动网格策略 |
| `npm run grid-list` | 查看所有预设策略 |
| `npm run example` | 运行 API 示例 |

## 🎉 开始交易

配置完成后，运行：

```bash
npm run grid-test    # 先测试
npm run grid         # 再启动
```

---

**祝交易顺利！** 🚀💰

有任何问题请查看详细文档或在 Issues 中提问。

