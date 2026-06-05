"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";

interface Message {
  id: number; problemId: number; priority: number;
  content?: string; knowledgePoint?: string; errorReason?: string;
}

export default function MessagesPage() {
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">加载中...</div>;

  if (!messages || messages.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-6">复习消息</h2>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <Bell className="h-10 w-10 opacity-30" />
          <p className="text-sm">暂无需要复习的题目</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">复习消息</h2>
      <div className="space-y-3">
        {messages.map((msg) => (
          <Link
            key={msg.id}
            href={`/problems/${msg.problemId}/review?from=message`}
            className="block rounded-lg border p-4 hover:border-primary hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {msg.knowledgePoint && (
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{msg.knowledgePoint}</span>
                  )}
                  {msg.errorReason && (
                    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">{msg.errorReason}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {msg.content ?? "(无题目内容)"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}