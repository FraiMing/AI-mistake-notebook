"use server";

import { auth } from "@/lib/auth";
import { initDb, saveDb, problems, reviewLogs, eq, and } from "@ai-notebook/database";

/** 完成复习：更新掌握度、迁移题目、写入 ReviewLog */
export async function markReviewed(
  problemId: number,
  understood: boolean,
  confusedText?: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  try {
    const db = await initDb();
    const userId = Number(session.user.id);

    // 读取当前题目状态
    const problem = db.select()
      .from(problems)
      .where(and(eq(problems.id, problemId), eq(problems.userId, userId)))
      .get();
    if (!problem) return { error: "题目不存在" };

    // 掌握度计算
    const delta = understood ? 10 : -15;
    const newScore = Math.max(0, Math.min(100, (problem.masteryScore ?? 50) + delta));

    // zone 迁移：仅理解时迁入归纳区，不理解时保持暂存区
    if (understood) {
      db.update(problems)
        .set({ zone: "ARCHIVED", masteryScore: newScore })
        .where(and(eq(problems.id, problemId), eq(problems.userId, userId)))
        .run();
    } else {
      db.update(problems)
        .set({ masteryScore: newScore })
        .where(and(eq(problems.id, problemId), eq(problems.userId, userId)))
        .run();
    }

    // ReviewLog：幂等 — 一条记录，可增量更新
    const existing = db.select()
      .from(reviewLogs)
      .where(eq(reviewLogs.problemId, problemId))
      .get();

    if (!existing) {
      db.insert(reviewLogs).values({
        problemId,
        understood: understood ? 1 : 0,
        confusedText: confusedText ?? undefined,
        reviewedAt: new Date(),
      }).run();
    } else {
      // 增量更新：confusedText 仅首次写入，understood 可被后续"理解"覆盖
      if (!existing.confusedText && confusedText) {
        db.update(reviewLogs)
          .set({ confusedText })
          .where(eq(reviewLogs.id, existing.id))
          .run();
      }
      if (understood) {
        db.update(reviewLogs)
          .set({ understood: 1 })
          .where(eq(reviewLogs.id, existing.id))
          .run();
      }
    }

    saveDb();
    return {};
  } catch (e) {
    console.error("复习完成操作失败:", e);
    return { error: "操作失败，请稍后重试" };
  }
}