"use server";

import { auth } from "@/lib/auth";
import { initDb, saveDb, problems, eq, and } from "@ai-notebook/database";

// TODO: step 10 review loop —— 复习闭环中调用，将题目从暂存区迁移到归纳区
export async function markReviewed(problemId: number): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  try {
    const db = await initDb();
    const userId = Number(session.user.id);
    db.update(problems)
      .set({ zone: "ARCHIVED" })
      .where(and(eq(problems.id, problemId), eq(problems.userId, userId)))
      .run();
    saveDb();
    return {};
  } catch (e) {
    console.error("迁移题目失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}
