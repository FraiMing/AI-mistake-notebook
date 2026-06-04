import { auth } from "@/lib/auth";
import { initDb, tags } from "@ai-notebook/database";
import { eq } from "@ai-notebook/database";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const db = initDb();
  const rows = db
    .select()
    .from(tags)
    .where(eq(tags.userId, Number(session.user.id)))
    .all();

  return NextResponse.json(rows);
}