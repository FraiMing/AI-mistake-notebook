import { describe, it, expect } from "vitest";
import { z } from "zod";

const testSchema = z.object({
  content: z
    .string()
    .min(1, "题目内容不能为空")
    .max(5000, "题目内容不能超过 5000 个字符"),
  answer: z
    .string()
    .min(1, "错误作答不能为空"),
});

describe("createProblem Server Action — schema 校验", () => {
  it("有效数据应通过校验", () => {
    const data = { content: "求解 x²+2x+1=0", answer: "x=1" };
    const result = testSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("content 为空应返回错误", () => {
    const data = { content: "", answer: "x=1" };
    const result = testSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("题目内容不能为空");
    }
  });

  it("content 超长应返回错误", () => {
    const data = { content: "a".repeat(5001), answer: "x=1" };
    const result = testSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe(
        "题目内容不能超过 5000 个字符"
      );
    }
  });

  it("answer 为空应返回错误", () => {
    const data = { content: "测试题", answer: "" };
    const result = testSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("错误作答不能为空");
    }
  });

  it("content 恰为 5000 字符应通过", () => {
    const data = { content: "a".repeat(5000), answer: "测试" };
    const result = testSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});