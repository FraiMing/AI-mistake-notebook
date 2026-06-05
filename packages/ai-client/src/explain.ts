import { getAIClient } from "./index";
import { EXPLAIN_SYSTEM_PROMPT, buildExplainUserMessage } from "./prompts/explain";

export interface ExplainInput {
  content: string;
  answer: string;
  correctAnswer: string | null;
  confusedText: string;
}

/** 调用 AI 生成解答，失败返回 null */
export async function explainProblem(input: ExplainInput): Promise<string | null> {
  try {
    const client = getAIClient();
    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      temperature: 0.6,
      max_tokens: 800,
      messages: [
        { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
        { role: "user", content: buildExplainUserMessage(
          input.content, input.answer, input.correctAnswer, input.confusedText
        )},
      ],
    });
    const text = response.choices[0]?.message?.content?.trim();
    if (!text || text.length === 0) return null;
    // 基础校验：解答应包含题目关键词或非空有意义内容
    return text;
  } catch (e) {
    console.error("[explain] AI 解答失败:", e);
    return null;
  }
}