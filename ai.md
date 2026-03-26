
# 基于 OpenAI SDK 调用阿里云通义千问 Node.js 项目
极简可运行版，直接复制给 Cursor 即可生成完整项目

## 项目概述
- 运行环境：Node.js
- 核心依赖：openai（官方SDK）
- 模型服务：阿里云通义千问（兼容OpenAI接口格式）
- 核心特性：无需修改OpenAI调用代码，仅通过配置切换模型服务商

## 项目结构
```
your-project/
├── .env           # 环境变量配置（API密钥）
├── index.js       # 主程序入口
├── package.json   # 项目依赖配置
└── README.md      # 项目说明
```

## 1. package.json（项目依赖）
```json
{
  "name": "dashscope-openai-sdk",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "dotenv": "^16.4.7",
    "openai": "^4.76.3"
  },
  "scripts": {
    "start": "node index.js"
  }
}
```

## 2. .env（环境变量配置）
```env
# 阿里云通义千问 API Key（去阿里云控制台获取）
DASHSCOPE_API_KEY=你的通义千问API密钥
```

## 3. index.js（主程序代码）
```javascript
// 导入依赖
import 'dotenv/config';
import OpenAI from 'openai';

// 初始化客户端：使用OpenAI SDK，对接阿里云通义千问接口
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://coding.dashscope.aliyuncs.com/v1/',
});

// 调用AI接口
async function runChat() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'qwen3.5-plus', // 通义千问模型
      messages: [
        { role: 'user', content: '你好，请简单介绍一下自己' }
      ],
      temperature: 0.7,
    });

    // 输出结果
    console.log('AI 回复：', completion.choices[0].message.content);
  } catch (error) {
    console.error('调用失败：', error);
  }
}

// 执行
runChat();
```

## 4. 运行步骤
1. 安装依赖：`npm install`
2. 配置 `.env` 文件中的通义千问API Key
3. 启动项目：`npm start`

## 核心说明
1. **SDK**：使用官方 `openai` npm 包
2. **服务**：`baseURL` 指向阿里云通义千问，非OpenAI官方接口
3. **密钥**：使用 `DASHSCOPE_API_KEY`（阿里云密钥）
4. **模型**：使用通义千问 `qwen3.5-plus`

---

### 给Cursor的指令
请根据这份文档，**自动生成完整可直接运行的 Node.js 项目**，包含所有文件、自动安装依赖、可直接启动运行。
要求：极简、无冗余代码、可直接测试调用AI接口。

---

### 总结
- 这是**极简纯Node.js项目**，无框架、无复杂配置，复制就能用
- 用OpenAI SDK + 阿里云通义千问，完全符合你给的源码逻辑
- 直接把这个Markdown丢给Cursor，它会一键生成完整项目