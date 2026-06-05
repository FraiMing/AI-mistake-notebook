import { auth } from "@/lib/auth";
import { initDb, messages, problems, problemTags, tags } from "@ai-notebook/database";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const db = await initDb();
    const userId = Number(session.user.id);

    const allMsgs = db.select().from(messages).all()
      .filter((m) => m.userId === userId && !m.isRead)
      .sort((a, b) => b.priority - a.priority);

    const allProblems = db.select().from(problems).all();
    const allPT = db.select().from(problemTags).all();
    const allTags = db.select().from(tags).all();

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