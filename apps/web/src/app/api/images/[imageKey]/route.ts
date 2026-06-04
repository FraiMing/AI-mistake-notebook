import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUrl } from "@/lib/minio-client";

/** GET /api/images/[imageKey] — 生成 MinIO 预签名 URL */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageKey: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { imageKey } = await params;

  try {
    const url = await getPresignedUrl(imageKey, 300);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("生成预签名 URL 失败:", e);
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }
}