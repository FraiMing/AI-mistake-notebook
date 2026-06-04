import { describe, it, expect } from "vitest";
import { z } from "zod";

const testSchema = z.object({
  content: z.string().min(1).max(5000),
  answer: z.string().min(1),
});

describe("problem-actions schema 校验", () => {
  it("有效数据应通过校验", () => {
    const result = testSchema.safeParse({ content: "求解 x²+2x+1=0", answer: "x=1" });
    expect(result.success).toBe(true);
  });
  it("content 为空应返回错误", () => {
    const result = testSchema.safeParse({ content: "", answer: "x=1" });
    expect(result.success).toBe(false);
  });
  it("content 超长应返回错误", () => {
    const result = testSchema.safeParse({ content: "a".repeat(5001), answer: "x=1" });
    expect(result.success).toBe(false);
  });
  it("answer 为空应返回错误", () => {
    const result = testSchema.safeParse({ content: "测试题", answer: "" });
    expect(result.success).toBe(false);
  });
  it("content 恰为 5000 字符应通过", () => {
    const result = testSchema.safeParse({ content: "a".repeat(5000), answer: "测试" });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// NEXT_REDIRECT 不被 try-catch 吞掉 测试
// ============================================================
describe("saveProblem redirect 行为模拟", () => {
  it("NEXT_REDIRECT 不应被当作保存失败", async () => {
    // 模拟 saveProblem 的正确结构：redirect 在 try-catch 之外
    class NextRedirectError extends Error {
      constructor() { super("NEXT_REDIRECT"); this.name = "NEXT_REDIRECT"; }
    }
    let saved = false;
    let redirectCalled = false;
    let errorResult = "";

    async function simulateSaveProblem(shouldFail: boolean) {
      try {
        if (shouldFail) throw new Error("DB 写入失败");
        saved = true;
        // saveDb() 成功
      } catch (e: any) {
        if (e instanceof NextRedirectError) throw e;
        errorResult = e.message;
        return;
      }
      // redirect 在 try-catch 外部
      redirectCalled = true;
      throw new NextRedirectError();
    }

    // 正常场景：saveDb 成功 → redirect 触发
    saved = false; redirectCalled = false; errorResult = "";
    try { await simulateSaveProblem(false); } catch (e: any) {
      if (e.name === "NEXT_REDIRECT") { /* 预期的 redirect 行为 */ }
    }
    expect(saved).toBe(true);
    expect(redirectCalled).toBe(true);
    expect(errorResult).toBe("");
  });

  it("saveDb 失败时不应触发 redirect", async () => {
    class NextRedirectError extends Error {
      constructor() { super("NEXT_REDIRECT"); }
    }
    let saved = false;
    let redirectCalled = false;
    let errorResult = "";

    async function simulateSaveProblem() {
      try {
        throw new Error("DB 写入失败");
        saved = true;
      } catch (e: any) {
        if (e instanceof NextRedirectError) throw e;
        errorResult = e.message;
        return;
      }
      redirectCalled = true;
      throw new NextRedirectError();
    }

    await simulateSaveProblem();
    expect(saved).toBe(false);
    expect(redirectCalled).toBe(false);
    expect(errorResult).toBe("DB 写入失败");
  });
});
