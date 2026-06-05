import { getAIClient } from "./index";
import { SIMILAR_QUESTION_SYSTEM_PROMPT, buildSimilarQuestionUserMessage } from "./prompts/similar-question";

export interface SimilarQuestionInput {
  content: string;
  knowledgePoint: string;
  errorReason: string;
}

export interface SimilarQuestionResult {
  question: string;
  correctAnswer: string;
  knowledgePoint: string;
}

/** 调用 AI 生成相似题，失败或校验不通过返回 null */
export async function generateSimilarQuestion(
  input: SimilarQuestionInput,
): Promise<SimilarQuestionResult | null> {
  try {
    const client = getAIClient();
    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      temperature: 0.4,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SIMILAR_QUESTION_SYSTEM_PROMPT },
        { role: "user", content: buildSimilarQuestionUserMessage(
          input.content, input.knowledgePoint, input.errorReason
        )},
      ],
    });
    const text = response.choices[0]?.message?.content?.trim();
    if (!text) return null;

    const parsed = JSON.parse(text) as SimilarQuestionResult;
    // 后校验
    if (!parsed.question || !parsed.correctAnswer || !parsed.knowledgePoint) {
      return null;
    }
    // 知识点一致性检查（宽松匹配：包含或相似）
    if (!parsed.knowledgePoint.includes(input.knowledgePoint) &&
        !input.knowledgePoint.includes(parsed.knowledgePoint)) {
      console.warn("[similar-question] 知识点不匹配:", parsed.knowledgePoint, "vs", input.knowledgePoint);
      return null;
    }
    return parsed;
  } catch (e) {
    console.error("[similar-question] AI 生成失败:", e);
    return null;
  }
}