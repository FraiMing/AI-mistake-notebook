"use server";

import { auth } from "@/lib/auth";
import { initDb, saveDb, tags, eq, and } from "@ai-notebook/database";
import { autoTagProblem, AutoTaggingError } from "@ai-notebook/ai-client";

export interface TagSuggestion {
  tagName: string;
  tagType: "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON";
  tagId: number;
  source: "AI";
}

export async function suggestTags(content: string, answer: string): Promise<TagSuggestion[] | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    const db = await initDb();
    const userId = Number(session.user.id);
    const result = await autoTagProblem(content, answer);
    const suggestions: TagSuggestion[] = [];
    const dimensions = [
      { key: "subject", type: "SUBJECT" },
      { key: "knowledgePoint", type: "KNOWLEDGE_POINT" },
      { key: "errorReason", type: "ERROR_REASON" },
    ];
    for (const { key, type } of dimensions) {
      const tagName = result[key as keyof typeof result];
      if (!tagName) continue;
      const existing = db.select({ id: tags.id }).from(tags)
        .where(and(eq(tags.name, tagName), eq(tags.type, type as any), eq(tags.userId, userId))).get();
      let tagId: number;
      if (existing) { tagId = existing.id; }
      else {
        db.insert(tags).values({ name: tagName, type: type as any, userId, createdAt: new Date() }).run();
        saveDb();
        const created = db.select({ id: tags.id }).from(tags)
          .where(and(eq(tags.name, tagName), eq(tags.type, type as any), eq(tags.userId, userId))).get();
        tagId = created?.id ?? 0;
      }
      if (tagId > 0) suggestions.push({ tagName, tagType: type as any, tagId, source: "AI" });
    }
    return suggestions.length > 0 ? suggestions : null;
  } catch (e) {
    const msg = e instanceof AutoTaggingError ? e.message : String(e);
    console.error("AI 标注失败:", msg);
    return null;
  }
}
