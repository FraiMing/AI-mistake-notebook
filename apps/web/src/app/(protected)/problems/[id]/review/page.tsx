"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, X, Maximize2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { markReviewed } from "@/lib/zone-actions";

type Tag = { id: number; name: string; type: string; source?: string };
interface Problem {
  id: number; content: string; answer: string;
  correctAnswer: string | null; imageKey: string | null; zone: string; tags?: Tag[];
}

type Step =
  | "initial"
  | "showAnswer"
  | "understandCheck"
  | "confused"
  | "explanation"
  | "recheck"
  | "done"
  | "similarAsk"
  | "similarGenerate"
  | "similarDisplay"
  | "similarCheck";

function tagChipClass(source?: string) {
  if (source === "AI") return "inline-flex rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs text-blue-700";
  return "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs";
}

function ProblemImage({ imageKey }: { imageKey: string }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  useState(() => {
    (async () => {
      try {
        const res = await fetch(`/api/images/${encodeURIComponent(imageKey)}`);
        if (res.ok) { const data = await res.json(); setImageUrl(data.url); }
        else { setLoadError(true); }
      } catch { setLoadError(true); }
    })();
  });
  if (loadError) return <div className="h-24 w-24 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">无图片</div>;
  if (!imageUrl) return <div className="h-24 w-24 rounded-md bg-muted animate-pulse" />;
  return (<>
    <button type="button" onClick={() => setPreviewOpen(true)} className="relative group shrink-0">
      <img src={imageUrl} alt="题目图片" className="h-24 w-24 rounded-md object-cover" />
      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 group-hover:bg-black/20 transition-colors">
        <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
    {previewOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewOpen(false)}>
      <button type="button" onClick={() => setPreviewOpen(false)} className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"><X className="h-6 w-6" /></button>
      <img src={imageUrl} alt="题目图片大图" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
    </div>)}
  </>);
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = Number(params.id);

  const [step, setStep] = useState<Step>("initial");
  const [lastUnderstood, setLastUnderstood] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AI 交互状态
  const [confusedText, setConfusedText] = useState("");
  const [explanationText, setExplanationText] = useState("");
  const [similarQuestion, setSimilarQuestion] = useState<string>("");
  const [similarCorrectAnswer, setSimilarCorrectAnswer] = useState<string>("");

  const { data: problem, isLoading } = useQuery<Problem>({
    queryKey: ["problem", problemId],
    queryFn: async () => {
      const res = await fetch(`/api/problems/${problemId}`);
      if (!res.ok) throw new Error("加载题目失败");
      return res.json();
    },
    enabled: !isNaN(problemId),
  });

  // ---- 复习确认 ----
  const handleMarkReviewed = async (understood: boolean, confused?: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await markReviewed(problemId, understood, confused);
      if (result.error) {
        setError(result.error);
      } else {
        setLastUnderstood(understood);
        if (understood) {
          setStep("done");
        } else {
          setConfusedText("");
          setStep("confused");
        }
      }
    } catch {
      setError("操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // ---- AI 解答 ----
  const handleExplain = async () => {
    if (!confusedText.trim() || !problem) return;
    setLoading(true);
    setStep("explanation");
    try {
      const res = await fetch("/api/review/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: problem.content,
          answer: problem.answer,
          correctAnswer: problem.correctAnswer,
          confusedText: confusedText.trim(),
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setExplanationText(data.explanation);
      } else {
        setExplanationText("");
      }
    } catch {
      setExplanationText("");
    } finally {
      setLoading(false);
    }
  };

  // 确认理解（追问循环的终点）
  const handleRecheck = (understood: boolean) => {
    if (understood) {
      handleMarkReviewed(true, confusedText);
    } else {
      setStep("confused");
    }
  };

  // ---- AI 相似题 ----
  const handleSimilarAsk = async (want: boolean) => {
    if (!want || !problem) {
      router.push("/problems");
      return;
    }
    setStep("similarGenerate");
    const kp = problem.tags?.find((t) => t.type === "KNOWLEDGE_POINT")?.name ?? "未知";
    const er = problem.tags?.find((t) => t.type === "ERROR_REASON")?.name ?? "未知";
    try {
      const res = await fetch("/api/review/similar-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: problem.content,
          knowledgePoint: kp,
          errorReason: er,
        }),
      });
      const data = await res.json();
      if (data.question) {
        setSimilarQuestion(data.question);
        setSimilarCorrectAnswer(data.correctAnswer ?? "");
        setStep("similarDisplay");
      } else {
        setStep("done"); // 降级
      }
    } catch {
      setStep("done");
    }
  };

  const handleSimilarCheck = (understood: boolean) => {
    // 相似题作答的理解/不理解 — 仅记录掌握度 +10
    if (understood) markReviewed(problemId, true);
    else markReviewed(problemId, false);
    setStep("similarAsk");
  };

  // ---- 渲染 ----
  if (isLoading) return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">加载中...</div>;
  if (!problem) return (<div className="flex flex-col items-center justify-center h-48 gap-4"><p className="text-muted-foreground">题目不存在或无权访问</p><Link href="/problems" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">返回列表</Link></div>);
  if (problem.zone === "ARCHIVED") return (<div className="flex flex-col items-center justify-center h-48 gap-4"><p className="text-muted-foreground">此题目已完成复习</p><Link href="/problems" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">返回列表</Link></div>);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> 返回列表</button>
        <h2 className="text-lg font-semibold">复习</h2>
        <div className="w-16" />
      </div>

      {/* 题目卡片 */}
      <div className="rounded-lg border p-6 mb-6 space-y-4">
        {problem.imageKey && <div className="flex justify-center"><ProblemImage imageKey={problem.imageKey} /></div>}
        <div><span className="text-xs text-muted-foreground">题目</span><p className="mt-1 whitespace-pre-wrap">{problem.content}</p></div>
        {problem.tags && problem.tags.length > 0 && (<div className="flex flex-wrap gap-1">{problem.tags.map((t) => (<span key={t.id} className={tagChipClass(t.source)}>{t.source === "AI" && <span className="text-[10px] font-medium text-blue-400 mr-0.5">AI</span>}{t.name}</span>))}</div>)}
      </div>

      {/* 正确作答展示 */}
      {step === "showAnswer" && (<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6"><span className="text-xs text-amber-700 font-medium">正确作答</span>{problem.correctAnswer ? (<p className="mt-1 text-sm whitespace-pre-wrap">{problem.correctAnswer}</p>) : (<div className="mt-1 flex items-center gap-2 text-sm text-amber-600"><AlertCircle className="h-4 w-4" />未填写正确作答</div>)}</div>)}

      {/* Initial: 会做/不会做 */}
      {step === "initial" && (<div className="flex gap-4 justify-center"><button onClick={() => setStep("understandCheck")} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"><Check className="h-4 w-4" />会做</button><button onClick={() => setStep("showAnswer")} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-red-300 px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"><X className="h-4 w-4" />不会做</button></div>)}

      {/* understandCheck: 会做后的理解确认 */}
      {step === "understandCheck" && (<div className="rounded-lg border p-6 text-center space-y-4"><p className="text-sm">你理解这个知识点和错因了吗？</p><div className="flex gap-4 justify-center"><button onClick={() => handleMarkReviewed(true)} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{loading ? "处理中..." : <><Check className="h-4 w-4" />理解</>}</button><button onClick={() => handleMarkReviewed(false)} disabled={loading} className="inline-flex items-center gap-2 rounded-md border px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50">{loading ? "处理中..." : <><X className="h-4 w-4" />不理解</>}</button></div></div>)}

      {/* showAnswer 后的理解确认 */}
      {step === "showAnswer" && (<div className="rounded-lg border p-6 text-center space-y-4"><p className="text-sm">看了答案后，你理解了吗？</p><div className="flex gap-4 justify-center"><button onClick={() => handleMarkReviewed(true)} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{loading ? "处理中..." : <><Check className="h-4 w-4" />理解</>}</button><button onClick={() => handleMarkReviewed(false)} disabled={loading} className="inline-flex items-center gap-2 rounded-md border px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50">{loading ? "处理中..." : <><X className="h-4 w-4" />不理解</>}</button></div></div>)}

      {/* confused: 输入困惑点 */}
      {step === "confused" && (<div className="rounded-lg border p-6 space-y-4"><p className="text-sm font-medium">请说出你的困惑：</p><textarea value={confusedText} onChange={(e) => setConfusedText(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="例如：我不知道这里为什么用这个公式..." /><button onClick={handleExplain} disabled={loading || !confusedText.trim()} className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"><Sparkles className="h-4 w-4" />{loading ? "正在生成解答..." : "请 AI 解答"}</button></div>)}

      {/* explanation: AI 解答中 / 解答展示 */}
      {step === "explanation" && (<div className="rounded-lg border p-6 space-y-4">{loading ? (<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />AI 正在生成解答...</div>) : explanationText ? (<div className="space-y-4"><div className="rounded-md bg-blue-50 p-4 text-sm whitespace-pre-wrap leading-relaxed">{explanationText}</div><p className="text-sm font-medium">现在理解了吗？</p><div className="flex gap-4"><button onClick={() => handleRecheck(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Check className="h-4 w-4" />理解</button><button onClick={() => handleRecheck(false)} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"><X className="h-4 w-4" />仍不理解</button></div></div>) : (<div className="text-center space-y-4"><div className="flex items-center justify-center gap-2 text-sm text-amber-600"><AlertCircle className="h-5 w-5" />AI 解答暂不可用，请自行查阅资料后确认理解</div><div className="flex gap-4 justify-center"><button onClick={() => handleRecheck(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Check className="h-4 w-4" />理解</button><button onClick={() => handleRecheck(false)} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"><X className="h-4 w-4" />仍不理解</button></div></div>)}</div>)}

      {/* done: 复习完成 + 相似题询问 */}
      {step === "done" && lastUnderstood === true && (<div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-4"><Check className="h-8 w-8 text-green-600 mx-auto" /><p className="text-sm text-green-800">复习完成！题目已迁入归纳区。</p><div className="space-y-3"><p className="text-sm text-muted-foreground">需要同类题巩固吗？</p><div className="flex gap-4 justify-center"><button onClick={() => handleSimilarAsk(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Sparkles className="h-4 w-4" />需要</button><button onClick={() => handleSimilarAsk(false)} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">不需要</button></div></div></div>)}

      {step === "done" && lastUnderstood === false && (<div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center space-y-4"><AlertCircle className="h-8 w-8 text-amber-600 mx-auto" /><p className="text-sm text-amber-800">请自行查阅资料后再次理解。题目仍保留在暂存区。</p><Link href="/problems" className="inline-block rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">返回列表</Link></div>)}

      {/* similar 状态组 */}
      {step === "similarGenerate" && (<div className="rounded-lg border p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />AI 正在生成相似题...</div>)}

      {step === "similarDisplay" && similarQuestion && (<div className="space-y-6"><div className="rounded-lg border p-6 space-y-4"><div className="flex items-center gap-2 text-sm font-medium text-blue-700"><Sparkles className="h-4 w-4" />AI 生成的同类题</div><p className="text-sm whitespace-pre-wrap">{similarQuestion}</p></div><div className="rounded-lg border p-6 text-center space-y-4"><p className="text-sm">这道题你会做吗？</p><div className="flex gap-4 justify-center"><button onClick={() => handleSimilarCheck(true)} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"><Check className="h-4 w-4" />会做</button><button onClick={() => handleSimilarCheck(false)} className="inline-flex items-center gap-2 rounded-md border border-red-300 px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50"><X className="h-4 w-4" />不会做</button></div></div></div>)}

      {error && (<div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>)}
    </div>
  );
}