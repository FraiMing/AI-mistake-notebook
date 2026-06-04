"use server";

import { auth } from "@/lib/auth";
import { initDb, saveDb, problems } from "@ai-notebook/database";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const createProblemSchema = z.object({
  content: z
    .string({ required_error: "题目内容不能为空" })
    .min(1, "题目内容不能为空")
    .max(5000, "题目内容不能超过 5000 个字符"),
  answer: z
    .string({ required_error: "错误作答不能为空" })
    .min(1, "错误作答不能为空"),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;

export async function createProblem(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "未登录" };
  }

  const raw = {
    content: formData.get("content"),
    answer: formData.get("answer"),
  };

  const parsed = createProblemSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "表单数据无效";
    return { error: firstError };
  }

  try {
    const db = await initDb();
    const now = new Date();
    db.insert(problems).values({
      userId: Number(session.user.id),
      content: parsed.data.content,
      answer: parsed.data.answer,
      createdAt: now,
      updatedAt: now,
    }).run();
    saveDb();
  } catch (e) {
    console.error("保存题目失败:", e);
    return { error: "保存失败，请稍后重试" };
  }

  revalidatePath("/problems");
  redirect("/problems");
}