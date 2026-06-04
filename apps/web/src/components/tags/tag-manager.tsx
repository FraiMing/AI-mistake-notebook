"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createTag, updateTag, deleteTag } from "@/lib/tag-actions";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

type Tag = { id: number; name: string; type: string };
type TagType = "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON";

const TAG_TYPES: { value: TagType; label: string }[] = [
  { value: "SUBJECT", label: "学科" },
  { value: "KNOWLEDGE_POINT", label: "知识点" },
  { value: "ERROR_REASON", label: "错因" },
];

export function TagManager() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<TagType>("SUBJECT");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      return res.ok ? res.json() : [];
    },
  });

  const grouped = {
    SUBJECT: allTags.filter((t) => t.type === "SUBJECT"),
    KNOWLEDGE_POINT: allTags.filter((t) => t.type === "KNOWLEDGE_POINT"),
    ERROR_REASON: allTags.filter((t) => t.type === "ERROR_REASON"),
  };

  async function handleCreate() {
    if (!newName.trim()) return;
    const result = await createTag(newName.trim(), newType);
    if (result?.error) setError(result.error);
    else { setNewName(""); setError(""); queryClient.invalidateQueries({ queryKey: ["tags"] }); }
  }

  async function handleUpdate(id: number) {
    if (!editName.trim()) return;
    const result = await updateTag(id, editName.trim());
    if (result?.error) setError(result.error);
    else { setEditingId(null); setError(""); queryClient.invalidateQueries({ queryKey: ["tags"] }); }
  }

  async function handleDelete(id: number) {
    await deleteTag(id);
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">新建标签</h3>
        <div className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="标签名称"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
          <select value={newType} onChange={(e) => setNewType(e.target.value as TagType)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {TAG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={handleCreate}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 shrink-0">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      {TAG_TYPES.map(({ value, label }) => (
        <div key={value} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{label} ({grouped[value].length})</h3>
          <div className="space-y-1">
            {grouped[value].length === 0 ? (
              <p className="text-sm text-muted-foreground italic">暂无</p>
            ) : grouped[value].map((tag) => (
              <div key={tag.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                {editingId === tag.id ? (
                  <>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded border px-2 py-1 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(tag.id)} />
                    <button onClick={() => handleUpdate(tag.id)}><Check className="h-4 w-4 text-green-600" /></button>
                    <button onClick={() => setEditingId(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{tag.name}</span>
                    <button onClick={() => { setEditingId(tag.id); setEditName(tag.name); }}>
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button onClick={() => handleDelete(tag.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}