"use server";

import { auth } from "@/lib/auth";
import { initDb, saveDb, problems, problemTags } from "@ai-notebook/database";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const createProblemSchema = z.object({
  content: z.string({ required_error: "题目内容不能为空" }).min(1, "题目内容不能为空").max(5000, "题目内容不能超过 5000 个字符"),
  answer: z.string({ required_error: "错误作答不能为空" }).min(1, "错误作答不能为空"),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;

export async function createProblem(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  const raw = { content: formData.get("content"), answer: formData.get("answer") };
  const parsed = createProblemSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "表单数据无效" };

  // 解析 tagIds
  const tagIdsRaw = formData.get("tagIds");
  const tagIds =
    typeof tagIdsRaw === "string" && tagIdsRaw.length > 0
      ? tagIdsRaw.split(",").map(Number).filter((n) => !isNaN(n))
      : [];

  try {
    const db = await initDb();
    const now = new Date();
    const userId = Number(session.user.id);

    // 1. 插入题目
    db.insert(problems).values({
      userId,
      content: parsed.data.content,
      answer: parsed.data.answer,
      createdAt: now,
      updatedAt: now,
    }).run();

    // 2. 获取刚插入的题目 ID（通过查最新一条）
    const allProblems = db.select().from(problems).all();
    const myProblems = allProblems.filter((p) => p.userId === userId);
    const newProblemId = myProblems.length > 0 ? Math.max(...myProblems.map((p) => p.id)) : 0;

    // 3. 关联标签（必须在 saveDb 之前，保证同一实例）
    if (newProblemId > 0 && tagIds.length > 0) {
      for (const tagId of tagIds) {
        db.insert(problemTags).values({ problemId: newProblemId, tagId }).run();
      }
    }

    // 4. 统一持久化
    saveDb();
  } catch (e) {
    console.error("保存题目失败:", e);
    return { error: "保存失败，请稍后重试" };
  }

  revalidatePath("/problems");
  redirect("/problems");
}