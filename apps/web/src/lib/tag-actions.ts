"use server";

import { auth } from "@/lib/auth";
import { initDb, tags, problemTags } from "@ai-notebook/database";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and } from "@ai-notebook/database";

const TAG_TYPES = ["SUBJECT", "KNOWLEDGE_POINT", "ERROR_REASON"] as const;

// ─── Zod schemas ───

const createTagSchema = z.object({
  name: z.string().min(1, "标签名不能为空").max(50, "标签名不能超过 50 个字符"),
  type: z.enum(TAG_TYPES, { required_error: "标签类型不能为空" }),
});

const updateTagSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "标签名不能为空").max(50, "标签名不能超过 50 个字符"),
});

// ─── Tag CRUD ───

export async function createTag(name: string, type: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  const parsed = createTagSchema.safeParse({ name, type });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "表单数据无效" };
  }

  try {
    const db = initDb();

    // 同名同 type 拒绝
    const existing = db
      .select()
      .from(tags)
      .where(
        and(
          eq(tags.name, parsed.data.name),
          eq(tags.type, parsed.data.type),
          eq(tags.userId, Number(session.user.id))
        )
      )
      .get();
    if (existing) return { error: "标签已存在" };

    db.insert(tags)
      .values({
        name: parsed.data.name,
        type: parsed.data.type,
        userId: Number(session.user.id),
        createdAt: new Date(),
      })
      .run();
    
  } catch (e) {
    console.error("创建标签失败:", e);
    return { error: "创建失败，请稍后重试" };
  }

  revalidatePath("/tags");
  return { success: true };
}

export async function updateTag(id: number, name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  const parsed = updateTagSchema.safeParse({ id, name });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "表单数据无效" };
  }

  try {
    const db = initDb();
    db.update(tags)
      .set({ name: parsed.data.name })
      .where(
        and(eq(tags.id, parsed.data.id), eq(tags.userId, Number(session.user.id)))
      )
      .run();
    
  } catch (e) {
    console.error("更新标签失败:", e);
    return { error: "更新失败，请稍后重试" };
  }

  revalidatePath("/tags");
  return { success: true };
}

export async function deleteTag(id: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  try {
    const db = initDb();
    // 级联删除关联
    db.delete(problemTags).where(eq(problemTags.tagId, id)).run();
    db.delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, Number(session.user.id))))
      .run();
    
  } catch (e) {
    console.error("删除标签失败:", e);
    return { error: "删除失败，请稍后重试" };
  }

  revalidatePath("/tags");
  return { success: true };
}

// ─── ProblemTag 关联 ───

export async function addProblemTags(problemId: number, tagIds: number[]) {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    const db = initDb();
    for (const tagId of tagIds) {
      db.insert(problemTags)
        .values({ problemId, tagId })
        .run(); // 忽略重复关联（already exists）
    }
    
  } catch (e) {
    console.error("关联标签失败:", e);
  }
}