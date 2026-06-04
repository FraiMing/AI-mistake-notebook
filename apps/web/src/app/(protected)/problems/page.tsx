"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Problem {
  id: number;
  content: string;
  answer: string;
  createdAt: number | string;
}

export default function ProblemsPage() {
  const { data: problems, isLoading } = useQuery<Problem[]>({
    queryKey: ["problems"],
    queryFn: async () => {
      const res = await fetch("/api/problems");
      if (!res.ok) throw new Error("加载失败");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        加载中…
      </div>
    );
  }

  if (!problems || problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-lg font-semibold">错题本</h2>
        <p className="mt-2 text-sm text-muted-foreground">暂无错题</p>
        <Link
          href="/problems/new"
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          录入第一道错题
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">
          错题本
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({problems.length} 题)
          </span>
        </h2>
        <Link
          href="/problems/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          录入错题
        </Link>
      </div>

      <div className="space-y-4">
        {problems.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border p-4 space-y-2"
          >
            <div>
              <span className="text-xs text-muted-foreground">题目</span>
              <p className="mt-1 text-sm whitespace-pre-wrap">{p.content}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">错误作答</span>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                {p.answer}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(p.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: number | string): string {
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}