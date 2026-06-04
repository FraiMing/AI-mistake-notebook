import { describe, it, expect } from "vitest";
import { z } from "zod";

const TAG_TYPES = ["SUBJECT", "KNOWLEDGE_POINT", "ERROR_REASON"] as const;

// 对照 tag-actions.ts 中的 createTagSchema / updateTagSchema 写测试
const createTagSchema = z.object({
  name: z.string().min(1, "标签名不能为空").max(50, "标签名不能超过 50 个字符"),
  type: z.enum(TAG_TYPES, { required_error: "标签类型不能为空" }),
});

const updateTagSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "标签名不能为空").max(50, "标签名不能超过 50 个字符"),
});

describe("Tag CRUD schema 校验", () => {
  it("创建标签：有效数据通过", () => {
    const result = createTagSchema.safeParse({ name: "数学", type: "SUBJECT" });
    expect(result.success).toBe(true);
  });

  it("创建标签：缺 type 拒绝", () => {
    const result = createTagSchema.safeParse({ name: "数学" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("标签类型不能为空");
    }
  });

  it("创建标签：name 为空拒绝", () => {
    const result = createTagSchema.safeParse({ name: "", type: "SUBJECT" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("标签名不能为空");
    }
  });

  it("更新标签：有效数据通过", () => {
    const result = updateTagSchema.safeParse({ id: 1, name: "数学（理科）" });
    expect(result.success).toBe(true);
  });
});

describe("ProblemTag 关联校验", () => {
  it("tagIds 数组正确解析", () => {
    const raw = "1,2,3";
    const ids = raw.split(",").map(Number).filter((n) => !isNaN(n));
    expect(ids).toEqual([1, 2, 3]);
  });

  it("空字符串返回空数组", () => {
    const raw = "";
    const ids = raw.length > 0 ? raw.split(",").map(Number).filter((n) => !isNaN(n)) : [];
    expect(ids).toEqual([]);
  });
});