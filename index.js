import "dotenv/config";
import OpenAI from "openai";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { appendFile, readFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  process.env.SYSTEM_PROMPT ||
  "你是一个专业、简洁、友好的 AI 助手。若用户需要创建目录，可调用 create_folder，relativePath 必须为相对项目根目录的路径。";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename));

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_folder",
      description:
        "在当前项目根目录下创建文件夹（支持多级）。仅允许相对路径，禁止跳出项目根目录。",
      parameters: {
        type: "object",
        properties: {
          relativePath: {
            type: "string",
            description: "相对项目根目录的路径，例如 notes 或 a/b/c",
          },
        },
        required: ["relativePath"],
      },
    },
  },
];

function safeResolveUnderRoot(relativePath) {
  const raw = String(relativePath ?? "").trim();
  const normalized = path.normalize(raw);
  if (!raw) throw new Error("路径不能为空");
  if (path.isAbsolute(normalized)) throw new Error("不允许使用绝对路径");

  const target = path.resolve(PROJECT_ROOT, normalized);
  const rel = path.relative(PROJECT_ROOT, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("路径不允许超出项目根目录");
  }
  if (rel === "") throw new Error("请指定子目录名称，不要操作项目根本身");

  return target;
}

async function runCreateFolder(relativePath) {
  const target = safeResolveUnderRoot(relativePath);
  await mkdir(target, { recursive: true });
  return { ok: true, created: path.relative(PROJECT_ROOT, target) };
}

async function consumeStream(stream) {
  let content = "";
  const toolBuffers = new Map();

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.content) {
      content += delta.content;
      process.stdout.write(delta.content);
    }
    if (delta?.tool_calls?.length) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        if (!toolBuffers.has(idx)) {
          toolBuffers.set(idx, { id: "", name: "", arguments: "" });
        }
        const b = toolBuffers.get(idx);
        if (tc.id) b.id = tc.id;
        if (tc.function?.name) b.name += tc.function.name;
        if (tc.function?.arguments) b.arguments += tc.function.arguments;
      }
    }
  }

  const tool_calls = Array.from(toolBuffers.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, b]) => ({
      id: b.id,
      type: "function",
      function: {
        name: b.name,
        arguments: b.arguments || "{}",
      },
    }))
    .filter((tc) => tc.id && tc.function.name);

  return { content, tool_calls };
}

function lastAssistantText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && typeof m.content === "string" && m.content) {
      return m.content;
    }
  }
  return "";
}

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
      const trimmedContext = sessionMessages.slice(-MAX_CONTEXT_ROUNDS * 4);
      const requestMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...trimmedContext,
        userMessage,
      ];

      const msgsForApi = [...requestMessages];
      const newMessagesThisTurn = [];
      let round = 0;

      console.log("AI: ");
      while (true) {
        const stream = await openai.chat.completions.create({
          model: current.model,
          messages: msgsForApi,
          temperature: 0.7,
          stream: true,
          tools: TOOLS,
          tool_choice: "auto",
        });

        const { content, tool_calls } = await consumeStream(stream);

        if (!tool_calls.length) {
          const assistantMsg = { role: "assistant", content: content };
          msgsForApi.push(assistantMsg);
          newMessagesThisTurn.push(assistantMsg);
          break;
        }

        const assistantMsg = {
          role: "assistant",
          content: content || null,
          tool_calls,
        };
        msgsForApi.push(assistantMsg);
        newMessagesThisTurn.push(assistantMsg);

        for (const tc of tool_calls) {
          let result;
          try {
            const args = JSON.parse(tc.function.arguments || "{}");
            if (tc.function.name === "create_folder") {
              result = await runCreateFolder(args.relativePath);
            } else {
              result = { ok: false, error: `未知工具: ${tc.function.name}` };
            }
          } catch (e) {
            result = { ok: false, error: String(e?.message || e) };
          }
          const toolMsg = {
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          };
          msgsForApi.push(toolMsg);
          newMessagesThisTurn.push(toolMsg);
        }

        round += 1;
        if (round > 8) {
          console.error("\n工具调用次数过多，已中止本轮。");
          break;
        }
      }

      console.log("\n");
      const assistantReply = lastAssistantText(newMessagesThisTurn);
      sessionMessages.push(userMessage, ...newMessagesThisTurn);
      sessionMessages = sessionMessages.slice(-MAX_CONTEXT_ROUNDS * 4);

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
