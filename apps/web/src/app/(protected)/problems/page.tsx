"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { X, Maximize2 } from "lucide-react";
import { useTagFilterStore } from "@/stores/tag-filter-store";
import { TimelineGroup } from "@/components/problems/timeline-group";

type Tag = { id: number; name: string; type: string; source?: string };
type TagType = "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON";

interface Problem {
  id: number;
  content: string;
  answer: string;
  imageKey: string | null;
  createdAt: number | string;
  tags?: Tag[];
}

const TYPE_LABEL: Record<TagType, string> = { SUBJECT: "学科", KNOWLEDGE_POINT: "知识点", ERROR_REASON: "错因" };

/** 根据 source 返回标签 Chip 样式 */
function tagChipClass(source?: string) {
  if (source === "AI") return "inline-flex rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs text-blue-700";
  return "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs";
}

/** 图片缩略图组件（含点击放大） */
function ProblemImage({ imageKey }: { imageKey: string }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useState(() => {
    (async () => {
      try {
        const res = await fetch(`/api/images/${encodeURIComponent(imageKey)}`);
        if (res.ok) {
          const data = await res.json();
          setImageUrl(data.url);
        } else {
          setLoadError(true);
        }
      } catch { setLoadError(true); }
    })();
  });

  if (loadError) {
    return <div className="h-18 w-18 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">无图片</div>;
  }

  if (!imageUrl) {
    return <div className="h-18 w-18 rounded-md bg-muted animate-pulse" />;
  }

  return (
    <>
      <button type="button" onClick={() => setPreviewOpen(true)} className="relative group shrink-0">
        <img src={imageUrl} alt="题目图片" className="h-18 w-18 rounded-md object-cover" />
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 group-hover:bg-black/20 transition-colors">
          <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}>
          <button type="button" onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30">
            <X className="h-6 w-6" />
          </button>
          <img src={imageUrl} alt="题目图片大图" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function getProblemDate(p: Problem): Date {
  return typeof p.createdAt === "number" ? new Date(p.createdAt) : new Date(p.createdAt);
}

function renderProblemCard(p: Problem) {
  return (
    <div className="rounded-lg border p-4 flex gap-4">
      {p.imageKey && (
        <div className="shrink-0">
          <ProblemImage imageKey={p.imageKey} />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2">
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
              <span key={t.id} className={tagChipClass(t.source)}>
                {t.source === "AI" && (
                  <span className="text-[10px] font-medium text-blue-400 mr-0.5">AI</span>
                )}
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  const { selectedTagIds, zone, setTagFilter, clearFilters } = useTagFilterStore();

  const allSelectedIds = Object.values(selectedTagIds).flat();
  const hasFilter = allSelectedIds.length > 0;

  // 加载标签列表
  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      return res.ok ? res.json() : [];
    },
  });

  const tagsByType = {
    SUBJECT: allTags.filter((t) => t.type === "SUBJECT"),
    KNOWLEDGE_POINT: allTags.filter((t) => t.type === "KNOWLEDGE_POINT"),
    ERROR_REASON: allTags.filter((t) => t.type === "ERROR_REASON"),
  };

  // 构建查询参数
  const params = new URLSearchParams();
  if (allSelectedIds.length > 0) params.set("tagIds", allSelectedIds.join(","));
  // TODO: step 8 zone tabs —— zone 启用时自动附加
  // if (zone) params.set("zone", zone);
  const queryString = params.toString();

  const { data: problems, isLoading } = useQuery<Problem[]>({
    queryKey: ["problems", allSelectedIds.join(","), zone ?? "all"],
    queryFn: async () => {
      const res = await fetch(`/api/problems${queryString ? "?" + queryString : ""}`);
      if (!res.ok) throw new Error("加载失败");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">
          错题本{problems && problems.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({problems.length} 题)</span>}
        </h2>
        <Link href="/problems/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">录入错题</Link>
      </div>

      {/* 筛选区域 */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
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

      {/* 时间轴分组 */}
      <TimelineGroup
        items={problems ?? []}
        getDate={getProblemDate}
        renderItem={renderProblemCard}
        emptyMessage={hasFilter ? "没有找到匹配的错题" : "暂无错题"}
      />
    </div>
  );
}
