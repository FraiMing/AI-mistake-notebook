"use server";

import { auth } from "@/lib/auth";
import { initDb, problems } from "@ai-notebook/database";
import { addProblemTags } from "@/lib/tag-actions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const createProblemSchema = z.object({
  content: z.string({ required_error: "题目内容不能为空" }).min(1, "题目内容不能为空").max(5000, "题目内容不能超过 5000 个字符"),
  answer: z.string({ required_error: "错误作答不能为空" }).min(1, "错误作答不能为空"),
});

export async function createProblem(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  const raw = { content: formData.get("content"), answer: formData.get("answer") };
  const parsed = createProblemSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "表单数据无效" };

  // tagIds
  const tagIdsRaw = formData.get("tagIds");
  const tagIds = typeof tagIdsRaw === "string" && tagIdsRaw.length > 0
    ? tagIdsRaw.split(",").map(Number).filter((n) => !isNaN(n))
    : [];

  let newProblemId = 0;
  try {
    const db = initDb();
    const now = new Date();
    const result = db.insert(problems).values({
      userId: Number(session.user.id),
      content: parsed.data.content,
      answer: parsed.data.answer,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: problems.id }).get();
    if (result) newProblemId = result.id;
  } catch (e) {
    console.error("保存题目失败:", e);
    return { error: "保存失败，请稍后重试" };
  }

  if (newProblemId > 0 && tagIds.length > 0) {
    await addProblemTags(newProblemId, tagIds);
  }

  revalidatePath("/problems");
  redirect("/problems");
}