import { auth } from "@/lib/auth";
import { explainProblem } from "@ai-notebook/ai-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, answer, correctAnswer, confusedText } = body;
    if (!content || !answer || !confusedText) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const explanation = await explainProblem({
      content, answer, correctAnswer: correctAnswer ?? null, confusedText,
    });

    if (!explanation) {
      return NextResponse.json({ explanation: null, degraded: true });
    }

    return NextResponse.json({ explanation });
  } catch (e) {
    console.error("/api/review/explain 错误:", e);
    return NextResponse.json({ explanation: null, degraded: true });
  }
}