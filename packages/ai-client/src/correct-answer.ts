import { getAIClient } from "./index";
import { CORRECT_ANSWER_SYSTEM_PROMPT, buildCorrectAnswerUserMessage } from "./prompts/correct-answer";

/** 调用 AI 生成正确作答，失败返回 null */
export async function generateCorrectAnswer(content: string): Promise<string | null> {
  try {
    const client = getAIClient();
    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: "system", content: CORRECT_ANSWER_SYSTEM_PROMPT },
        { role: "user", content: buildCorrectAnswerUserMessage(content) },
      ],
    });
    const text = response.choices[0]?.message?.content?.trim();
    if (!text || text.length === 0) return null;
    return text;
  } catch (e) {
    console.error("[correct-answer] AI 生成失败:", e);
    return null;
  }
}