import { auth } from "@/lib/auth";
import { initDb, problems, eq, desc } from "@ai-notebook/database";
import { NextResponse } from "next/server";
import { z } from "zod";

const problemResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  answer: z.string(),
  createdAt: z.number().or(z.string()),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const db = initDb();
  const rows = db
    .select()
    .from(problems)
    .where(eq(problems.userId, Number(session.user.id)))
    .orderBy(desc(problems.createdAt))
    .all();

  const parsed = z.array(problemResponseSchema).safeParse(rows);
  if (!parsed.success) {
    return NextResponse.json({ error: "数据格式异常", details: parsed.error.errors }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}