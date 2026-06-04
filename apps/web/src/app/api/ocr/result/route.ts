import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRedis } from "@/lib/redis-client";

/** GET /api/ocr/result?imageKey=xxx — 轮询 OCR 识别结果 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const imageKey = request.nextUrl.searchParams.get("imageKey");
  if (!imageKey) {
    return NextResponse.json({ error: "缺少 imageKey" }, { status: 400 });
  }

  try {
    const redis = getRedis();
    const raw = await redis.get(`ocr-result:${imageKey}`);

    if (!raw) {
      return NextResponse.json({ status: "processing" });
    }

    const result = JSON.parse(raw);
    return NextResponse.json(result);
  } catch (e) {
    console.error("OCR 结果查询失败:", e);
    return NextResponse.json({ status: "error", error: "查询失败" }, { status: 500 });
  }
}