import { auth } from "@/lib/auth";
import { initDb, messages, problems, problemTags, tags, eq, and, inArray } from "@ai-notebook/database";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const db = await initDb();
    const userId = Number(session.user.id);

    const allMsgs = db.select().from(messages)
      .where(and(eq(messages.userId, userId), eq(messages.isRead, 0)))
      .all()
      .sort((a, b) => b.priority - a.priority);

    const problemIds = [...new Set(allMsgs.map((m) => m.problemId))];
    const allProblems = problemIds.length > 0
      ? db.select().from(problems).where(inArray(problems.id, problemIds)).all()
      : [];
    const allPT = problemIds.length > 0
      ? db.select().from(problemTags).where(inArray(problemTags.problemId, problemIds)).all()
      : [];
    const tagIds = [...new Set(allPT.map((pt) => pt.tagId))];
    const allTags = tagIds.length > 0
      ? db.select().from(tags).where(inArray(tags.id, tagIds)).all()
      : [];

    const result = allMsgs.map((msg) => {
      const p = allProblems.find((pr) => pr.id === msg.problemId);
      const ptRows = allPT.filter((pt) => pt.problemId === msg.problemId);
      const tagRows = ptRows.map((pt) => allTags.find((t) => t.id === pt.tagId)).filter(Boolean);
      const kp = tagRows.find((t) => t && t.type === "KNOWLEDGE_POINT");
      const er = tagRows.find((t) => t && t.type === "ERROR_REASON");
      return {
        id: msg.id,
        problemId: msg.problemId,
        priority: msg.priority,
        content: p ? (p.content.length > 80 ? p.content.slice(0, 80) + "..." : p.content) : null,
        knowledgePoint: kp?.name ?? null,
        errorReason: er?.name ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("/api/messages 错误:", e);
    return NextResponse.json([], { status: 500 });
  }
}