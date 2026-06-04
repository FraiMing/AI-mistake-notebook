import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recognizeText } from "@/lib/baidu-ocr";

/** POST /api/upload — 接收 Base64 编码的图片，上传到 MinIO 并调用百度 OCR */
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
    const uploadResult = await uploadProblemImage(formData);

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error }, { status: 400 });
    }

    // 同步调用百度 OCR（静默降级）
    let ocrContent: string | null = null;
    try {
      const ocrResult = await recognizeText(imageBase64);
      if (ocrResult.text) {
        ocrContent = ocrResult.text;
      } else if (ocrResult.error) {
        console.warn("百度 OCR 降级:", ocrResult.error);
      }
    } catch (e) {
      console.warn("百度 OCR 调用异常:", e);
    }

    return NextResponse.json({
      imageKey: uploadResult.imageKey,
      ocrContent,
    });
  } catch (e) {
    console.error("上传失败:", e);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}