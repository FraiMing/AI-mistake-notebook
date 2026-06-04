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

export { autoTagProblem } from "./tagging.js";
export type { AutoTagResult } from "./tagging.js";
export { AutoTaggingError } from "./tagging.js";
export { SYSTEM_PROMPT, buildTaggingUserMessage } from "./prompts/tagging.js";
