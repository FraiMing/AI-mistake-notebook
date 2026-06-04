"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { X } from "lucide-react";
import { useTagFilterStore } from "@/stores/tag-filter-store";
import { useQuery as useTagsQuery } from "@tanstack/react-query";

type Tag = { id: number; name: string; type: string };
type TagType = "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON";

interface Problem {
  id: number;
  content: string;
  answer: string;
  createdAt: number | string;
  tags?: Tag[];
}

const TYPE_LABEL: Record<TagType, string> = { SUBJECT: "学科", KNOWLEDGE_POINT: "知识点", ERROR_REASON: "错因" };

export default function ProblemsPage() {
  const { selectedTagIds, setTagFilter, clearFilters } = useTagFilterStore();

  // 收集所有选中的 tagId
  const allSelectedIds = Object.values(selectedTagIds).flat();
  const hasFilter = allSelectedIds.length > 0;

  // 加载标签列表（用于筛选 UI）
  const { data: allTags = [] } = useTagsQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      return res.ok ? res.json() : [];
    },
  });

  // 按 type 分组
  const tagsByType = {
    SUBJECT: allTags.filter((t) => t.type === "SUBJECT"),
    KNOWLEDGE_POINT: allTags.filter((t) => t.type === "KNOWLEDGE_POINT"),
    ERROR_REASON: allTags.filter((t) => t.type === "ERROR_REASON"),
  };

  // 加载题目
  const queryParams = allSelectedIds.length > 0 ? `?tagIds=${allSelectedIds.join(",")}` : "";
  const { data: problems, isLoading } = useQuery<Problem[]>({
    queryKey: ["problems", allSelectedIds.join(",")],
    queryFn: async () => {
      const res = await fetch(`/api/problems${queryParams}`);
      if (!res.ok) throw new Error("加载失败");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">加载中…</div>;
  }

  if (!problems || problems.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">错题本</h2>
          <Link href="/problems/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">录入错题</Link>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-sm text-muted-foreground">
            {hasFilter ? "没有找到匹配的错题" : "暂无错题"}
          </p>
          {hasFilter && (
            <button onClick={clearFilters} className="mt-2 text-sm text-primary hover:underline">清除筛选</button>
          )}
          {!hasFilter && (
            <Link href="/problems/new" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">录入第一道错题</Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">
          错题本 <span className="ml-2 text-sm font-normal text-muted-foreground">({problems.length} 题)</span>
        </h2>
        <Link href="/problems/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">录入错题</Link>
      </div>

      {/* 筛选区域 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(TYPE_LABEL) as TagType[]).map((type) => (
          <div key={type} className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{TYPE_LABEL[type]}:</span>
            <select
              value={selectedTagIds[type]?.[0] ?? ""}
              onChange={(e) => setTagFilter(type, e.target.value ? [Number(e.target.value)] : [])}
              className="rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">全部</option>
              {tagsByType[type].map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        ))}
        {hasFilter && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
            <X className="h-3 w-3" /> 清除筛选
          </button>
        )}
      </div>

      {/* 题目列表 */}
      <div className="space-y-4">
        {problems.map((p) => (
          <div key={p.id} className="rounded-lg border p-4 space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">题目</span>
              <p className="mt-1 text-sm whitespace-pre-wrap">{p.content}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">错误作答</span>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{p.answer}</p>
            </div>
            {p.tags && p.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <span key={t.id} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: number | string): string {
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}