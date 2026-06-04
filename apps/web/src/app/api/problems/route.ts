import { auth } from "@/lib/auth";
import { initDb, problems, problemTags, tags } from "@ai-notebook/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const db = await initDb();
    const userId = Number(session.user.id);

    // 查询所有题目
    const allProblems = db.select().from(problems).all()
      .filter((p) => p.userId === userId);

    // 查询所有关联及标签
    const allPT = db.select().from(problemTags).all();
    const allTags = db.select().from(tags).all();

    // 为每个题目附加标签（含 source 信息）
    let result = allProblems.map((p) => {
      const ptRows = allPT.filter((pt) => pt.problemId === p.id);
      const tagRows = ptRows
        .map((pt) => {
          const tag = allTags.find((t) => t.id === pt.tagId);
          return tag ? { ...tag, source: pt.source } : null;
        })
        .filter(Boolean);
      return { ...p, tags: tagRows };
    });

    // 筛选
    const { searchParams } = new URL(request.url);
    const tagIdsParam = searchParams.get("tagIds");
    if (tagIdsParam) {
      const filterIds = tagIdsParam.split(",").map(Number).filter((n) => !isNaN(n));
      if (filterIds.length > 0) {
        result = result.filter((p) =>
          filterIds.every((fid) =>
            (p.tags as typeof allTags).some((t) => t && t.id === fid)
          )
        );
      }
    }

    // 按时间倒序
    result.sort((a, b) => {
      const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt);
      const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt);
      return tb - ta;
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("/api/problems 错误:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
