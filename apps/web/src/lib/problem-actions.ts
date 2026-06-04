"use server";

import { auth } from "@/lib/auth";
import { initDb, saveDb, problems, problemTags } from "@ai-notebook/database";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadImage } from "@/lib/minio-client";
import { addOcrJob } from "@/lib/ocr-queue";
import { randomUUID } from "crypto";

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

  // 解析 imageKey（可选）
  const imageKeyRaw = formData.get("imageKey");
  const imageKey = typeof imageKeyRaw === "string" && imageKeyRaw.length > 0 ? imageKeyRaw : null;

  try {
    const db = await initDb();
    const now = new Date();
    const userId = Number(session.user.id);

    // 1. 插入题目
    db.insert(problems).values({
      userId,
      content: parsed.data.content,
      answer: parsed.data.answer,
      imageKey: imageKey ?? undefined,
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

/** 上传图片 Server Action — 接收 FormData，上传到 MinIO 并返回 imageKey */
export async function uploadProblemImage(formData: FormData): Promise<{ imageKey?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登录" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "未上传文件" };

  // 校验文件类型
  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    return { error: "仅支持 JPG 和 PNG 格式" };
  }

  // 校验文件大小（10MB）
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { error: "图片大小不能超过 10MB" };
  }

  try {
    const userId = session.user.id;
    const ext = file.type === "image/png" ? "png" : "jpg";
    const imageKey = `problems/${userId}/${randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadImage(buffer, imageKey);

    // 触发 OCR 任务
    try {
      await addOcrJob(imageKey);
    } catch (e) {
      console.error("OCR 任务投递失败:", e);
      // 不阻塞上传流程——用户仍可手动输入
    }

    return { imageKey };
  } catch (e) {
    console.error("图片上传失败:", e);
    return { error: "图片上传失败，请稍后重试" };
  }
}