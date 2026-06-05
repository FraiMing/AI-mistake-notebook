import { auth } from "@/lib/auth";
import { initDb, problems, problemTags, tags } from "@ai-notebook/database";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const db = await initDb();
    const userId = Number(session.user.id);
    const { id } = await params;
    const problemId = Number(id);

    if (isNaN(problemId)) {
      return NextResponse.json({ error: "无效的题目 ID" }, { status: 400 });
    }

    const problem = db.select().from(problems).all()
      .find((p) => p.id === problemId && p.userId === userId);

    if (!problem) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    // 附加标签
    const ptRows = db.select().from(problemTags).all()
      .filter((pt) => pt.problemId === problemId);
    const allTags = db.select().from(tags).all();
    const tagRows = ptRows.map((pt) => {
      const tag = allTags.find((t) => t.id === pt.tagId);
      return tag ? { ...tag, source: pt.source } : null;
    }).filter(Boolean);

    return NextResponse.json({ ...problem, tags: tagRows });
  } catch (e) {
    console.error("/api/problems/[id] 错误:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}