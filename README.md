# multi-provider-openai-sdk

使用 OpenAI 官方 Node.js SDK 调用阿里云通义千问或 Moonshot Kimi（OpenAI 兼容接口）的极简示例项目。

## 运行要求

- Node.js 18+

## 快速开始

1. 安装依赖：

```bash
npm install
```

2. 配置环境变量（编辑 `.env`）：

```env
PROVIDER=dashscope
DASHSCOPE_API_KEY=你的通义千问API密钥
DASHSCOPE_MODEL=qwen-plus
KIMI_API_KEY=你的Kimi API密钥
KIMI_MODEL=moonshot-v1-8k
```

3. 运行：

```bash
npm start
```

## 服务商切换

- 使用阿里云千问：`PROVIDER=dashscope`
- 使用 Kimi：`PROVIDER=kimi`

程序会自动根据 `PROVIDER` 读取对应 API Key、`baseURL` 和 `model`。

## 文件结构

```text
.
├── .env
├── index.js
├── package.json
└── README.md
```
