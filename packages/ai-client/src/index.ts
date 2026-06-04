import OpenAI from "openai";

let client: OpenAI | null = null;

/** 获取 DeepSeek API 客户端单例 */
export function getAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "sk-placeholder",
      baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    });
  }
  return client;
}

/** 占位：后续步骤实现具体 AI 调用 */
export { getAIClient as default };
