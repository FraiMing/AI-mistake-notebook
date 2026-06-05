import OpenAI from "openai";

let _lastKey = "";
let client: OpenAI | null = null;

/** 获取 DeepSeek API 客户端单例 — key 变化时自动重建 */
export function getAIClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY ?? "sk-placeholder";
  const baseURL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  if (!client || _lastKey !== apiKey) {
    _lastKey = apiKey;
    console.log("[ai-client] 初始化客户端, key 末尾:", apiKey.slice(-4), "总长度:", apiKey.length, "来源:", typeof process.env.DEEPSEEK_API_KEY === "undefined" ? "undefined(使用占位)" : ".env文件");
    client = new OpenAI({ apiKey, baseURL });
  }
  return client;
}

export { autoTagProblem } from "./tagging";
export type { AutoTagResult } from "./tagging";
export { AutoTaggingError } from "./tagging";
export { SYSTEM_PROMPT, buildTaggingUserMessage } from "./prompts/tagging";

export { explainProblem } from "./explain";
export { generateCorrectAnswer } from "./correct-answer";

export type { ExplainInput } from "./explain";

export { generateSimilarQuestion } from "./similar-question";
export type { SimilarQuestionInput, SimilarQuestionResult } from "./similar-question";
