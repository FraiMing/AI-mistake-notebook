"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProblem } from "@/lib/problem-actions";

const formSchema = z.object({
  content: z
    .string()
    .min(1, "题目内容不能为空")
    .max(5000, "题目内容不能超过 5000 个字符"),
  answer: z
    .string()
    .min(1, "错误作答不能为空"),
});

type FormData = z.infer<typeof formSchema>;

export function ProblemForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "", answer: "" },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", data.content);
      formData.set("answer", data.answer);

      const result = await createProblem(formData);

      // createProblem 成功时调用 redirect()（抛出 NEXT_REDIRECT），不会走到这里。
      // 走到这里说明有错误返回。
      if (result?.error) {
        setError("root", { message: result.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* 全局错误 */}
      {errors.root && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      {/* 题目内容 */}
      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">
          题目内容
        </label>
        <textarea
          id="content"
          {...register("content")}
          rows={6}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="请输入题目内容（可包含公式文字）"
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      {/* 错误作答 */}
      <div className="space-y-2">
        <label htmlFor="answer" className="text-sm font-medium">
          错误作答
        </label>
        <textarea
          id="answer"
          {...register("answer")}
          rows={4}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="请输入你的错误作答内容"
        />
        {errors.answer && (
          <p className="text-sm text-destructive">{errors.answer.message}</p>
        )}
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}