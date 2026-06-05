import { computeAndPush } from "@/lib/push-actions";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await computeAndPush();
  return NextResponse.json(result);
}