import { auth } from "@/lib/auth";
import { generateSimilarQuestion } from "@ai-notebook/ai-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, knowledgePoint, errorReason } = body;
    if (!content) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const result = await generateSimilarQuestion({
      content,
      knowledgePoint: knowledgePoint ?? "未知",
      errorReason: errorReason ?? "未知",
    });

    if (!result) {
      return NextResponse.json({ question: null, degraded: true });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("/api/review/similar-question 错误:", e);
    return NextResponse.json({ question: null, degraded: true });
  }
}