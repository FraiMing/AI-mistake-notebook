import { auth } from "@/lib/auth";
import { initDb, messages } from "@ai-notebook/database";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ count: 0 });
  try {
    const db = await initDb();
    const userId = Number(session.user.id);
    const count = db.select().from(messages).all()
      .filter((m) => m.userId === userId && !m.isRead).length;
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}