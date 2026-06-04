"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createProblem } from "@/lib/problem-actions";
import { confirmTags } from "@/lib/ai-tagging-action";
import { TagSelector } from "@/components/tags/tag-selector";
import { ImagePlus, Loader2, X, Sparkles, AlertCircle } from "lucide-react";
import type { TagSuggestion } from "@/lib/ai-tagging-action";

type Tag = { id: number; name: string; type: string; source?: "AI" | "MANUAL" };
type TagType = "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON";
type SelectedMap = Record<TagType, Tag[]>;

const formSchema = z.object({
  content: z.string().min(1, "题目内容不能为空").max(5000, "题目内容不能超过 5000 个字符"),
  answer: z.string().min(1, "错误作答不能为空"),
});

type FormData = z.infer<typeof formSchema>;

/** 前端图片压缩：Canvas API 等比压缩宽度 > 2048px 的图片 */
function compressImage(file: File): Promise<{ base64: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const MAX_WIDTH = 2048;

      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 不可用")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("压缩失败")); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result !== "string") { reject(new Error("读取失败")); return; }
          const base64 = result.split(",")[1];
          if (!base64) { reject(new Error("图片数据无效")); return; }
          resolve({ base64, fileName: file.name.replace(/.[^.]+$/, ".jpg") });
        };
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("图片加载失败")); };
    img.src = url;
  });
}

export function ProblemForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<"form" | "ai-loading" | "confirm">("form");
  const [selectedTags, setSelectedTags] = useState<SelectedMap>({
    SUBJECT: [], KNOWLEDGE_POINT: [], ERROR_REASON: [],
  });
  const [aiSuggestions, setAiSuggestions] = useState<TagSuggestion[] | null>(null);
  const [aiError, setAiError] = useState(false);
  const [problemId, setProblemId] = useState<number | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setError, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "", answer: "" },
  });

  // 图片预览
  useEffect(() => {
    if (!imageKey) { setImagePreviewUrl(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/images/${encodeURIComponent(imageKey)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setImagePreviewUrl(data.url);
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [imageKey]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setUploadError("仅支持 JPG 和 PNG 格式");
      setUploadStatus("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("图片大小不能超过 10MB");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setUploadError(null);

    try {
      const { base64, fileName } = await compressImage(file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, fileName }),
      });
      const data = await res.json();

      if (data.error) {
        setUploadError(data.error);
        setUploadStatus("error");
        return;
      }

      setImageKey(data.imageKey);
      setUploadStatus("done");

      if (data.ocrContent) {
        setValue("content", data.ocrContent, { shouldDirty: true });
      }
    } catch {
      setUploadError("上传失败，请重试");
      setUploadStatus("error");
    }
  }, [setValue]);

  const removeImage = useCallback(() => {
    setImageKey(null);
    setImagePreviewUrl(null);
    setUploadStatus("idle");
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", data.content);
      formData.set("answer", data.answer);
      if (imageKey) formData.set("imageKey", imageKey);

      // 进入 AI 加载态
      setStep("ai-loading");
      setAiError(false);

      const result = await createProblem(formData);
      if (result?.error) {
        setError("root", { message: result.error });
        setStep("form");
        return;
      }

      if (result.problemId) {
        setProblemId(result.problemId);
      }

      if (result.aiSuggestions && result.aiSuggestions.length > 0) {
        setAiSuggestions(result.aiSuggestions);
      } else {
        setAiError(true);
      }

      setStep("confirm");
    });
  }

  function handleConfirm() {
    if (!problemId) return;

    startTransition(async () => {
      const entries: { tagId: number; source: "AI" | "MANUAL" }[] = [];

      // AI 标签
      for (const s of (aiSuggestions ?? [])) {
        entries.push({ tagId: s.tagId, source: "AI" });
      }

      // 手动标签
      for (const [, tags] of Object.entries(selectedTags)) {
        for (const t of tags) {
          if (!entries.some((e) => e.tagId === t.id)) {
            entries.push({ tagId: t.id, source: "MANUAL" });
          }
        }
      }

      const result = await confirmTags(problemId, entries);
      if (result?.error) {
        setError("root", { message: result.error });
        return;
      }

      router.push("/problems");
    });
  }

  function removeAiSuggestion(index: number) {
    setAiSuggestions((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }

  const TYPE_LABEL: Record<string, string> = { SUBJECT: "学科", KNOWLEDGE_POINT: "知识点", ERROR_REASON: "错因" };

  // 确认阶段 UI
  if (step === "ai-loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium">AI 正在分析错题...</p>
        <p className="text-sm text-muted-foreground">识别学科、知识点和错因，预计 5 秒</p>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">确认标签</h2>
          <p className="text-sm text-muted-foreground">AI 已生成标签建议，你可以修改后确认。</p>
        </div>

        {errors.root && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.root.message}</div>
        )}

        {/* AI 建议区 */}
        {aiSuggestions && aiSuggestions.length > 0 ? (
          <div className="rounded-md border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              AI 建议标签
            </div>
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((s, idx) => (
                <span key={idx}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  <span className="text-xs font-medium text-blue-500">AI</span>
                  <span className="text-blue-800">{TYPE_LABEL[s.tagType]}: {s.tagName}</span>
                  <button onClick={() => removeAiSuggestion(idx)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* AI 降级提示 */}
        {aiError && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4" />
            AI 标注暂不可用，请手动添加标签
          </div>
        )}

        {/* 手动标签区 */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">手动补充标签</p>
          <TagSelector
            selected={selectedTags}
            onChange={(type, tags) => setSelectedTags((prev) => ({ ...prev, [type]: tags }))}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep("form")} disabled={isPending}
            className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
            返回修改
          </button>
          <button onClick={handleConfirm} disabled={isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
            {isPending ? "确认中..." : "确认并保存"}
          </button>
        </div>
      </div>
    );
  }

  // 表单 UI
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {errors.root && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.root.message}</div>
      )}

      {/* 图片上传区域 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">题目图片（可选）</label>
        <div className="flex items-start gap-4">
          {imagePreviewUrl ? (
            <div className="relative inline-flex">
              <img src={imagePreviewUrl} alt="题目图片预览" className="h-48 w-auto rounded-md border object-cover" />
              <button type="button" onClick={removeImage}
                className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-destructive-foreground hover:bg-destructive/90">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadStatus === "uploading"}
              className="flex h-48 w-48 items-center justify-center rounded-md border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
              {uploadStatus === "uploading" ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-xs">上传并识别中...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">拍照或选择图片</span>
                </div>
              )}
            </button>
          )}
          <div className="flex-1 space-y-2">
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
            {uploadStatus === "done" && (
              <p className="text-sm text-green-600">上传完成，OCR 识别结果已自动填入</p>
            )}
            {uploadStatus === "error" && !uploadError && (
              <p className="text-sm text-destructive">OCR 识别失败，请手动输入</p>
            )}
            <p className="text-xs text-muted-foreground">支持 JPG/PNG 格式，最大 10MB，自动压缩大图</p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" capture="environment"
          onChange={handleFileSelect} className="hidden" />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">题目内容</label>
        <textarea id="content" {...register("content")} rows={6}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="请输入题目内容" />
        {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="answer" className="text-sm font-medium">错误作答</label>
        <textarea id="answer" {...register("answer")} rows={4}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="请输入你的错误作答内容" />
        {errors.answer && <p className="text-sm text-destructive">{errors.answer.message}</p>}
      </div>

      <button type="submit" disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
        {isPending ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
