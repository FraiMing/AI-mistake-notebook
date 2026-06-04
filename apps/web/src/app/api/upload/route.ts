import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** POST /api/upload — 接收 Base64 编码的图片，上传到 MinIO 并返回 imageKey */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { imageBase64, fileName } = await request.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "缺少图片数据" }, { status: 400 });
    }

    // 将 Base64 转 FormData 调用 Server Action
    const formData = new FormData();
    const buffer = Buffer.from(imageBase64, "base64");
    const blob = new Blob([buffer], { type: fileName?.endsWith(".png") ? "image/png" : "image/jpeg" });
    formData.set("file", blob, fileName ?? "photo.jpg");

    const { uploadProblemImage } = await import("@/lib/problem-actions");
    const result = await uploadProblemImage(formData);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ imageKey: result.imageKey });
  } catch (e) {
    console.error("上传失败:", e);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}