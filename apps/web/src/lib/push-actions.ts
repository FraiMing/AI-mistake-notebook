"use server";

import { auth } from "@/lib/auth";
import {
  initDb, saveDb,
  problems, messages, tags, problemTags, reviewLogs,
  eq, and, inArray,
} from "@ai-notebook/database";

const DAY_MS = 86400000;
const THRESHOLD_TEMPORARY = 1 * DAY_MS;
const THRESHOLD_ARCHIVED = 3 * DAY_MS;
const ZONE_FACTOR_TEMPORARY = 2.0;
const ZONE_FACTOR_ARCHIVED = 1.0;

/** 推送调度：按知识点+错因分组 → 遗忘曲线 → 优先级 → 写入 Message */
export async function computeAndPush(): Promise<{ created: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { created: 0, error: "未登录" };

  try {
    const db = await initDb();
    const userId = Number(session.user.id);
    const now = Date.now();

    const allProblems = db.select().from(problems).where(eq(problems.userId, userId)).all();
    const problemIds = allProblems.map((p) => p.id);

    const allPT = problemIds.length > 0
      ? db.select().from(problemTags).where(inArray(problemTags.problemId, problemIds)).all()
      : [];
    const tagIdsFromPT = [...new Set(allPT.map((pt) => pt.tagId))];
    const allTags = tagIdsFromPT.length > 0
      ? db.select().from(tags).where(inArray(tags.id, tagIdsFromPT)).all()
      : [];
    const allRL = problemIds.length > 0
      ? db.select().from(reviewLogs).where(inArray(reviewLogs.problemId, problemIds)).all()
      : [];
    const allMsgs = db.select().from(messages).where(eq(messages.userId, userId)).all();

    const enriched = allProblems.map((p) => {
      const ptRows = allPT.filter((pt) => pt.problemId === p.id);
      const tagRows = ptRows
        .map((pt) => allTags.find((t) => t.id === pt.tagId))
        .filter((t): t is NonNullable<typeof t> => t != null);
      const lastReview = allRL
        .filter((rl) => rl.problemId === p.id)
        .sort((a, b) => {
          const ta = a.reviewedAt instanceof Date ? a.reviewedAt.getTime() : Number(a.reviewedAt);
          const tb = b.reviewedAt instanceof Date ? b.reviewedAt.getTime() : Number(b.reviewedAt);
          return tb - ta;
        })[0];
      return { ...p, tags: tagRows, lastReview };
    });

    // 分组
    const groups = new Map<string, typeof enriched>();
    for (const ep of enriched) {
      const kp = ep.tags.find((t) => t.type === "KNOWLEDGE_POINT");
      const er = ep.tags.find((t) => t.type === "ERROR_REASON");
      if (!kp || !er) continue;
      const key = `${kp.id}:${er.id}`;
      const arr = groups.get(key);
      if (arr) arr.push(ep);
      else groups.set(key, [ep]);
    }

    const candidates: { problemId: number; priority: number }[] = [];

    for (const [, group] of groups) {
      const sorted = [...group].sort((a, b) => {
        if (a.zone === "TEMPORARY" && b.zone !== "TEMPORARY") return -1;
        if (a.zone !== "TEMPORARY" && b.zone === "TEMPORARY") return 1;
        if (a.zone === "TEMPORARY") {
          const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt);
          const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt);
          return ta - tb;
        }
        return (a.masteryScore ?? 50) - (b.masteryScore ?? 50);
      });
      const pick = sorted[0];
      if (!pick) continue;

      const baseTime = pick.lastReview
        ? (pick.lastReview.reviewedAt instanceof Date
            ? pick.lastReview.reviewedAt.getTime()
            : Number(pick.lastReview.reviewedAt))
        : (pick.createdAt instanceof Date
            ? pick.createdAt.getTime()
            : Number(pick.createdAt));

      const threshold = pick.zone === "TEMPORARY" ? THRESHOLD_TEMPORARY : THRESHOLD_ARCHIVED;
      const ms = pick.masteryScore ?? 50;
      const thresholdAdjusted = threshold * (1 + ms / 100);

      const elapsed = now - baseTime;
      if (elapsed <= thresholdAdjusted) continue;

      const zoneFactor = pick.zone === "TEMPORARY" ? ZONE_FACTOR_TEMPORARY : ZONE_FACTOR_ARCHIVED;
      const intervalDays = elapsed / DAY_MS;
      const masteryFactor = (100 - ms + 1) / 100;
      const priority = zoneFactor * intervalDays * masteryFactor;

      const hasUnread = allMsgs.some((m) => m.problemId === pick.id && !m.isRead);
      if (hasUnread) continue;

      candidates.push({ problemId: pick.id, priority });
    }

    candidates.sort((a, b) => b.priority - a.priority);

    let created = 0;
    for (const c of candidates) {
      db.insert(messages).values({
        userId,
        problemId: c.problemId,
        priority: Math.round(c.priority * 100) / 100,
        isRead: 0,
        createdAt: new Date(),
      }).run();
      created++;
    }

    saveDb();
    return { created };
  } catch (e) {
    console.error("推送计算失败", e);
    return { created: 0, error: String(e) };
  }
}

/** 将指定题目的消息标记为已读 */
export async function markMessageRead(problemId: number): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  try {
    const db = await initDb();
    const userId = Number(session.user.id);
    db.update(messages)
      .set({ isRead: 1 })
      .where(
        and(
          eq(messages.problemId, problemId),
          eq(messages.userId, userId),
          eq(messages.isRead, 0),
        )
      )
      .run();
    saveDb();
    return {};
  } catch (e) {
    console.error("标记消息失败:", e);
    return { error: "操作失败" };
  }
}