"use client";

import { useQuery } from "@tanstack/react-query";
import { X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type Tag = { id: number; name: string; type: string; source?: "AI" | "MANUAL" };
type TagType = "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON";
type SelectedMap = Record<TagType, Tag[]>;

interface Props {
  selected: SelectedMap;
  onChange: (type: TagType, tags: Tag[]) => void;
}

const TYPE_LABEL: Record<TagType, string> = {
  SUBJECT: "学科",
  KNOWLEDGE_POINT: "知识点",
  ERROR_REASON: "错因",
};

/** 根据 source 返回 Chip 样式类名 */
function chipClass(source?: string) {
  if (source === "AI") {
    return "border-blue-300 bg-blue-50 text-blue-700";
  }
  return "bg-primary/10 text-primary";
}

export function TagSelector({ selected, onChange }: Props) {
  const [openType, setOpenType] = useState<TagType | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      return res.ok ? res.json() : [];
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenType(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleTag(tag: Tag) {
    const current = selected[tag.type as TagType] ?? [];
    const exists = current.find((t) => t.id === tag.id);
    if (exists) {
      onChange(tag.type as TagType, current.filter((t) => t.id !== tag.id));
    } else {
      onChange(tag.type as TagType, [...current, tag]);
    }
  }

  function removeTag(type: TagType, tagId: number) {
    onChange(type, (selected[type] ?? []).filter((t) => t.id !== tagId));
  }

  const allSelected = Object.values(selected).flat();

  return (
    <div ref={ref} className="relative space-y-2">
      <label className="text-sm font-medium">标签（可选）</label>

      {/* 已选标签 */}
      {allSelected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allSelected.map((t) => (
            <span key={t.id}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${chipClass(t.source)}`}>
              {t.source === "AI" && (
                <span className="text-[10px] font-medium opacity-70">AI</span>
              )}
              {t.name}
              <button onClick={() => removeTag(t.type as TagType, t.id)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 三个下拉 */}
      <div className="flex gap-2">
        {(["SUBJECT", "KNOWLEDGE_POINT", "ERROR_REASON"] as TagType[]).map((type) => (
          <div key={type} className="relative">
            <button
              type="button"
              onClick={() => setOpenType(openType === type ? null : type)}
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              {TYPE_LABEL[type]}
              <ChevronDown className="h-3 w-3" />
            </button>
            {openType === type && (
              <div className="absolute top-full left-0 mt-1 z-10 w-40 rounded-md border bg-popover shadow-md p-1">
                {allTags
                  .filter((t) => t.type === type)
                  .map((tag) => {
                    const checked = selected[type]?.some((s) => s.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-accent text-left"
                      >
                        <input type="checkbox" checked={!!checked} readOnly className="h-3 w-3" />
                        {tag.name}
                      </button>
                    );
                  })}
                {allTags.filter((t) => t.type === type).length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">暂无标签</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
