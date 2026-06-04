import { getAIClient } from "./index.js";
import { SYSTEM_PROMPT, buildTaggingUserMessage } from "./prompts/tagging.js";

/** AI 标签建议结果 */
export interface AutoTagResult {
  subject: string;
  knowledgePoint: string;
  errorReason: string;
}

/** AI 标签生成错误 */
export class AutoTaggingError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AutoTaggingError";
  }
}

/**
 * 调用 DeepSeek API 自动分析错题，返回三个标签建议
 * @param content 题目内容
 * @param answer 错误作答
 * @param timeoutMs 超时毫秒数，默认 30000
 * @returns AutoTagResult 学科/知识点/错因
 * @throws AutoTaggingError 调用失败、JSON 解析失败、超时等情况
 */
export async function autoTagProblem(
  content: string,
  answer: string,
  timeoutMs = 30_000
): Promise<AutoTagResult> {
  const client = getAIClient();
  const userMessage = buildTaggingUserMessage(content, answer);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.chat.completions.create(
      {
        model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal }
    );

    const raw = response.choices[0]?.message?.content;
    if (!raw?.trim()) {
      throw new AutoTaggingError("AI 返回空内容");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AutoTaggingError("AI 返回非 JSON 格式", raw.slice(0, 200));
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new AutoTaggingError("AI 返回数据格式错误");
    }

    const obj = parsed as Record<string, unknown>;
    const subject = typeof obj.subject === "string" ? obj.subject.trim() : "";
    const knowledgePoint = typeof obj.knowledgePoint === "string" ? obj.knowledgePoint.trim() : "";
    const errorReason = typeof obj.errorReason === "string" ? obj.errorReason.trim() : "";

    if (!subject || !knowledgePoint || !errorReason) {
      throw new AutoTaggingError(
        `AI 返回标签不完整: subject=${subject}, knowledgePoint=${knowledgePoint}, errorReason=${errorReason}`
      );
    }

    return { subject, knowledgePoint, errorReason };
  } catch (e) {
    if (e instanceof AutoTaggingError) throw e;
    if ((e as Error).name === "AbortError") {
      throw new AutoTaggingError(`AI 调用超时 (${timeoutMs}ms)`);
    }
    throw new AutoTaggingError(
      `AI 调用失败: ${(e as Error).message ?? String(e)}`,
      e
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
