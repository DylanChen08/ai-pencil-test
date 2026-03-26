import "dotenv/config";
import OpenAI from "openai";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { appendFile, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const provider = (process.env.PROVIDER || "dashscope").toLowerCase();

const providerConfig = {
  dashscope: {
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: process.env.DASHSCOPE_MODEL || "qwen-plus",
  },
  kimi: {
    apiKey: process.env.KIMI_API_KEY,
    baseURL: "https://api.moonshot.cn/v1",
    model: process.env.KIMI_MODEL || "moonshot-v1-8k",
  },
};

const current = providerConfig[provider];
if (!current) {
  console.error("不支持的 PROVIDER，请使用 dashscope 或 kimi");
  process.exit(1);
}

if (!current.apiKey) {
  console.error(`未配置 API Key，请检查 ${provider.toUpperCase()} 的密钥环境变量`);
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: current.apiKey,
  baseURL: current.baseURL,
});

const HISTORY_FILE = process.env.HISTORY_FILE || "./chat-history.jsonl";
const MAX_CONTEXT_ROUNDS = Number(process.env.MAX_CONTEXT_ROUNDS || 10);
const SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT || "你是一个专业、简洁、友好的 AI 助手。";

async function getUserPrompt(rl) {
  const cliPrompt = process.argv.slice(2).join(" ").trim();
  if (cliPrompt) return cliPrompt;

  const answer = (await rl.question("请输入你的问题: ")).trim();
  return answer || "你好，请简单介绍一下自己";
}

async function saveHistory(entry) {
  await appendFile(HISTORY_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}

async function loadUserQuestions(limit = 20) {
  try {
    const content = await readFile(HISTORY_FILE, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);
    const items = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter((item) => item.role === "user")
      .slice(-limit);
    return items;
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function runChat() {
  let sessionId = randomUUID();
  let sessionMessages = [];
  const rl = readline.createInterface({ input, output });

  console.log(`当前提供商：${provider}，模型：${current.model}`);
  console.log("进入连续对话模式，输入 exit/quit 结束。");
  console.log("输入 /new 开启新会话，输入 /history 查看历史提问。\n");

  try {
    let pendingPrompt = await getUserPrompt(rl);

    while (true) {
      const userInput =
        pendingPrompt ?? (await rl.question("你: ")).trim();
      pendingPrompt = null;
      if (!userInput) continue;

      const lowerInput = userInput.toLowerCase();
      if (["exit", "quit"].includes(lowerInput)) break;

      if (lowerInput === "/new") {
        sessionId = randomUUID();
        sessionMessages = [];
        console.log("已开启新会话，上下文已隔离清空。\n");
        continue;
      }

      if (lowerInput.startsWith("/history")) {
        const parts = userInput.split(/\s+/);
        const count = Number(parts[1] || 20);
        const limit = Number.isFinite(count) && count > 0 ? count : 20;
        const questions = await loadUserQuestions(limit);
        if (questions.length === 0) {
          console.log("暂无历史提问。\n");
          continue;
        }
        console.log(`最近 ${questions.length} 条历史提问:`);
        for (const [idx, item] of questions.entries()) {
          console.log(
            `${idx + 1}. [${item.timestamp}] (${item.provider}) ${item.content}`,
          );
        }
        console.log("");
        continue;
      }

      const userMessage = { role: "user", content: userInput };
      const trimmedContext = sessionMessages.slice(-MAX_CONTEXT_ROUNDS * 2);
      const requestMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...trimmedContext,
        userMessage,
      ];

      const stream = await openai.chat.completions.create({
        model: current.model,
        messages: requestMessages,
        temperature: 0.7,
        stream: true,
      });

      let assistantReply = "";
      console.log("AI: ");
      for await (const chunk of stream) {
        // 打印每个流式分片的原始数据，便于调试
        // console.log("\n[Raw Chunk]");
        // console.dir(chunk, { depth: null, colors: true });

        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          process.stdout.write(delta);
          assistantReply += delta;
        }
      }
      console.log("\n");
      const assistantMessage = { role: "assistant", content: assistantReply };
      sessionMessages.push(userMessage, assistantMessage);
      sessionMessages = sessionMessages.slice(-MAX_CONTEXT_ROUNDS * 2);

      const baseHistory = {
        sessionId,
        provider,
        model: current.model,
        timestamp: new Date().toISOString(),
      };
      await saveHistory({ ...baseHistory, role: "user", content: userInput });
      await saveHistory({
        ...baseHistory,
        role: "assistant",
        content: assistantReply,
      });
    }
  } catch (error) {
    console.error("调用失败：", error);
  } finally {
    rl.close();
  }
}

runChat();
