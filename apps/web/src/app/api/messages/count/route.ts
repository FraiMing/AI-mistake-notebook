import { auth } from "@/lib/auth";
import { initDb, messages, eq, and } from "@ai-notebook/database";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ count: 0 });
  try {
    const db = await initDb();
    const userId = Number(session.user.id);
    const count = db.select().from(messages)
      .where(and(eq(messages.userId, userId), eq(messages.isRead, 0)))
      .all().length;
    return NextResponse.json({ count });
  } catch (e) {
    console.error("/api/messages/count 错误:", e);
    return NextResponse.json({ count: 0 });
  }
}