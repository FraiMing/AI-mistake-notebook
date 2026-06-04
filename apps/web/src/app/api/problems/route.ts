import { auth } from "@/lib/auth";
import { initDb, problems } from "@ai-notebook/database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const db = await initDb();
    const allRows = db.select().from(problems).all();
    const rows = allRows
      .filter((p) => p.userId === Number(session.user.id))
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/problems 错误:", e);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}