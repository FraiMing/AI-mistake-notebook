"use server";

import { auth } from "@/lib/auth";
import { initDb, saveDb, problems, problemTags } from "@ai-notebook/database";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadImage } from "@/lib/minio-client";
import { suggestTags } from "@/lib/ai-tagging-action";
import { randomUUID } from "crypto";
import type { TagSuggestion } from "@/lib/ai-tagging-action";

const problemSchema = z.object({
  content: z.string().min(1).max(5000),
  answer: z.string().min(1),
  correctAnswer: z.string().optional(),
});

export type AnalyzeResult = { error?: string; aiSuggestions?: TagSuggestion[] | null };

export async function analyzeProblem(formData: FormData): Promise<AnalyzeResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  const raw = { content: formData.get("content"), answer: formData.get("answer") };
  const parsed = problemSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "表单数据无效" };

  let aiSuggestions: TagSuggestion[] | null = null;
  try { aiSuggestions = await suggestTags(parsed.data.content, parsed.data.answer); } catch (e) { console.error("AI 标注失败:", e); }
  return { aiSuggestions };
}

export interface SaveProblemInput {
  content: string;
  answer: string;
  correctAnswer?: string | null;
  imageKey?: string | null;
  tagEntries: { tagId: number; source: "AI" | "MANUAL" }[];
}

export async function saveProblem(input: SaveProblemInput): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  const parsed = problemSchema.safeParse({ content: input.content, answer: input.answer, correctAnswer: input.correctAnswer });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "表单数据无效" };

  try {
    const db = await initDb();
    const now = new Date();
    const userId = Number(session.user.id);

    const result = db.insert(problems).values({
      userId, content: parsed.data.content, answer: parsed.data.answer,
      correctAnswer: input.correctAnswer ?? undefined,
      imageKey: input.imageKey ?? undefined, createdAt: now, updatedAt: now,
    }).returning({ id: problems.id }).get();

    const newProblemId = result?.id;
    if (newProblemId && input.tagEntries.length > 0) {
      for (const { tagId, source } of input.tagEntries) {
        db.insert(problemTags).values({ problemId: newProblemId, tagId, source }).run();
      }
    }
    saveDb();
  } catch (e) {
    console.error("保存题目失败:", e);
    return { error: "保存失败，请稍后重试" };
  }

  revalidatePath("/problems");
  redirect("/problems");
}

export async function uploadProblemImage(formData: FormData): Promise<{ imageKey?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };
  const file = formData.get("file") as File | null;
  if (!file) return { error: "未上传文件" };
  if (file.type !== "image/jpeg" && file.type !== "image/png") return { error: "仅支持 JPG 和 PNG 格式" };
  if (file.size > 10 * 1024 * 1024) return { error: "图片大小不能超过 10MB" };
  try {
    const userId = session.user.id;
    const ext = file.type === "image/png" ? "png" : "jpg";
    const imageKey = `problems/${userId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadImage(buffer, imageKey);
    return { imageKey };
  } catch (e) {
    console.error("图片上传失败:", e);
    return { error: "图片上传失败，请稍后重试" };
  }
}