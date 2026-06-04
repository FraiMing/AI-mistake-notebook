"use server";

import { auth } from "@/lib/auth";
import { initDb, saveDb, problems, tags, problemTags, eq, and } from "@ai-notebook/database";
import { autoTagProblem, AutoTaggingError } from "@ai-notebook/ai-client";

/** AI 标签建议项 */
export interface TagSuggestion {
  tagName: string;
  tagType: "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON";
  tagId: number;
  source: "AI";
}

const TAG_TYPE_MAP: Record<string, "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON"> = {
  subject: "SUBJECT",
  knowledgePoint: "KNOWLEDGE_POINT",
  errorReason: "ERROR_REASON",
};

/**
 * 为题目自动生成标签建议
 * 调用 DeepSeek API 分析，匹配/创建 Tag，返回建议列表
 * 失败时返回 null（不抛异常，由调用方降级处理）
 */
export async function suggestTags(problemId: number): Promise<TagSuggestion[] | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const db = await initDb();
    const userId = Number(session.user.id);

    // 获取题目内容
    const problem = db
      .select({ content: problems.content, answer: problems.answer })
      .from(problems)
      .where(and(eq(problems.id, problemId), eq(problems.userId, userId)))
      .get();

    if (!problem) return null;

    // 调用 AI
    const result = await autoTagProblem(problem.content, problem.answer);

    // 对三个维度逐一匹配/创建 Tag
    const suggestions: TagSuggestion[] = [];
    const dimensions: { key: keyof typeof result; type: string }[] = [
      { key: "subject", type: "SUBJECT" },
      { key: "knowledgePoint", type: "KNOWLEDGE_POINT" },
      { key: "errorReason", type: "ERROR_REASON" },
    ];

    for (const { key, type } of dimensions) {
      const tagName = result[key];
      if (!tagName) continue;

      // 精确匹配：同名同 type 同 userId
      const existing = db
        .select({ id: tags.id })
        .from(tags)
        .where(
          and(
            eq(tags.name, tagName),
            eq(tags.type, type as "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON"),
            eq(tags.userId, userId)
          )
        )
        .get();

      let tagId: number;
      if (existing) {
        tagId = existing.id;
      } else {
        // 创建新 Tag
        db.insert(tags)
          .values({ name: tagName, type: type as "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON", userId, createdAt: new Date() })
          .run();
        saveDb();

        // 获取刚创建的 Tag ID
        const created = db
          .select({ id: tags.id })
          .from(tags)
          .where(
            and(
              eq(tags.name, tagName),
              eq(tags.type, type as "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON"),
              eq(tags.userId, userId)
            )
          )
          .get();
        tagId = created?.id ?? 0;
      }

      if (tagId > 0) {
        suggestions.push({
          tagName,
          tagType: type as "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON",
          tagId,
          source: "AI",
        });
      }
    }

    return suggestions.length > 0 ? suggestions : null;
  } catch (e) {
    const msg = e instanceof AutoTaggingError ? e.message : String(e);
    console.error("AI 标注失败:", msg);
    return null;
  }
}

/**
 * 确认标签：清除旧关联，写入新关联（含 source 标记）
 */
export async function confirmTags(
  problemId: number,
  entries: { tagId: number; source: "AI" | "MANUAL" }[]
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  try {
    const db = await initDb();

    // 清除该题目的所有旧 ProblemTag 关联
    db.delete(problemTags).where(eq(problemTags.problemId, problemId)).run();

    // 批量写入新关联
    for (const { tagId, source } of entries) {
      db.insert(problemTags).values({ problemId, tagId, source }).run();
    }

    saveDb();
    return {};
  } catch (e) {
    console.error("确认标签失败:", e);
    return { error: "保存失败，请稍后重试" };
  }
}
