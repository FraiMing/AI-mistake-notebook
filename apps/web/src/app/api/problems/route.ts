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

    let allProblems = db.select().from(problems).all()
      .filter((p) => p.userId === userId);

    const { searchParams } = new URL(request.url);
    const zoneParam = searchParams.get("zone");
    if (zoneParam === "TEMPORARY" || zoneParam === "ARCHIVED") {
      allProblems = allProblems.filter((p) => p.zone === zoneParam);
    }

    const allPT = db.select().from(problemTags).all();
    const allTags = db.select().from(tags).all();

    const result: any[] = allProblems.map((p) => {
      const ptRows = allPT.filter((pt) => pt.problemId === p.id);
      const tagRows = ptRows
        .map((pt) => {
          const tag = allTags.find((t) => t.id === pt.tagId);
          if (!tag) return null;
          const source = pt.source ?? "MANUAL";
          return { id: tag.id, name: tag.name, type: tag.type, source };
        })
        .filter(Boolean);
      return { ...p, tags: tagRows };
    });

    const tagIdsParam = searchParams.get("tagIds");
    if (tagIdsParam) {
      const filterIds = tagIdsParam.split(",").map(Number).filter((n) => !isNaN(n));
      if (filterIds.length > 0) {
        const filtered = result.filter((p: any) =>
          filterIds.every((fid) =>
            (p.tags ?? []).some((t: any) => t && t.id === fid)
          )
        );
        filtered.sort((a: any, b: any) => {
          const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt);
          const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt);
          return tb - ta;
        });

        const pageStr = searchParams.get("page");
        if (pageStr) {
          const page = Math.max(1, parseInt(pageStr) || 1);
          const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit")!) || 20));
          const total = filtered.length;
          const start = (page - 1) * limit;
          return NextResponse.json({ items: filtered.slice(start, start + limit), total, page, limit });
        }
        return NextResponse.json(filtered);
      }
    }

    result.sort((a, b) => {
      const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt);
      const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt);
      return tb - ta;
    });

    const pageStr = searchParams.get("page");
    if (pageStr) {
      const page = Math.max(1, parseInt(pageStr) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit")!) || 20));
      const total = result.length;
      const start = (page - 1) * limit;
      return NextResponse.json({ items: result.slice(start, start + limit), total, page, limit });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("/api/problems 错误:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
