import { auth } from "@/lib/auth";
import { generateCorrectAnswer } from "@ai-notebook/ai-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content } = body;
    if (!content) {
      return NextResponse.json({ error: "缺少题目内容" }, { status: 400 });
    }

    const answer = await generateCorrectAnswer(content);
    if (!answer) {
      return NextResponse.json({ answer: null, degraded: true });
    }

    return NextResponse.json({ answer });
  } catch (e) {
    console.error("/api/review/correct-answer 错误:", e);
    return NextResponse.json({ answer: null, degraded: true });
  }
}