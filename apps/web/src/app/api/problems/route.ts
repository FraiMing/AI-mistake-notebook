import { auth } from "@/lib/auth";
import { initDb, problems, problemTags, tags, eq, and, inArray, desc } from "@ai-notebook/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const db = await initDb();
    const userId = Number(session.user.id);
    const { searchParams } = new URL(request.url);
    const zoneParam = searchParams.get("zone");
    const tagIdsParam = searchParams.get("tagIds");
    const pageStr = searchParams.get("page");
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit")!) || 20));

    let query = db.select().from(problems).where(eq(problems.userId, userId));

    if (zoneParam === "TEMPORARY" || zoneParam === "ARCHIVED") {
      query = query.where(eq(problems.zone, zoneParam));
    }

    if (tagIdsParam) {
      const filterIds = tagIdsParam.split(",").map(Number).filter((n) => !isNaN(n));
      if (filterIds.length > 0) {
        const matchingPT = db.select().from(problemTags).where(inArray(problemTags.tagId, filterIds)).all();
        const matchingProblemIds = [...new Set(matchingPT.map((pt) => pt.problemId))];
        if (matchingProblemIds.length > 0) {
          query = query.where(inArray(problems.id, matchingProblemIds));
        } else {
          query = query.where(eq(problems.id, -1));
        }
      }
    }

    query = query.orderBy(desc(problems.createdAt));

    const total = query.all().length;

    if (pageStr) {
      const page = Math.max(1, parseInt(pageStr) || 1);
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);
    }

    const allProblems = query.all();

    const problemIds = allProblems.map((p) => p.id);
    const allPT = problemIds.length > 0
      ? db.select().from(problemTags).where(inArray(problemTags.problemId, problemIds)).all()
      : [];
    const tagIds = [...new Set(allPT.map((pt) => pt.tagId))];
    const allTags = tagIds.length > 0
      ? db.select().from(tags).where(inArray(tags.id, tagIds)).all()
      : [];

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

    return NextResponse.json(pageStr ? { items: result, total, page: parseInt(pageStr), limit } : result);
  } catch (e) {
    console.error("/api/problems 错误:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}