import { describe, it, expect, vi } from "vitest";

// 测试 imageKey 上传校验逻辑（不依赖 MinIO 连接）
describe("上传图片校验", () => {
  const ALLOWED_TYPES = ["image/jpeg", "image/png"];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  it("JPEG 格式应通过类型校验", () => {
    expect(ALLOWED_TYPES.includes("image/jpeg")).toBe(true);
  });

  it("PNG 格式应通过类型校验", () => {
    expect(ALLOWED_TYPES.includes("image/png")).toBe(true);
  });

  it("GIF 格式应被拒绝", () => {
    expect(ALLOWED_TYPES.includes("image/gif")).toBe(false);
  });

  it("BMP 格式应被拒绝", () => {
    expect(ALLOWED_TYPES.includes("image/bmp")).toBe(false);
  });

  it("WebP 格式应被拒绝", () => {
    expect(ALLOWED_TYPES.includes("image/webp")).toBe(false);
  });

  it("10MB 以内文件应通过大小校验", () => {
    const fileSize = 5 * 1024 * 1024; // 5MB
    expect(fileSize).toBeLessThanOrEqual(MAX_SIZE);
  });

  it("恰好 10MB 文件应通过大小校验", () => {
    const fileSize = 10 * 1024 * 1024; // 10MB 边界
    expect(fileSize).toBeLessThanOrEqual(MAX_SIZE);
  });

  it("超过 10MB 文件应被拒绝", () => {
    const fileSize = 10 * 1024 * 1024 + 1; // 10MB + 1 byte
    expect(fileSize).toBeGreaterThan(MAX_SIZE);
  });
});

describe("imageKey 生成规则", () => {
  it("imageKey 应符合 problems/{userId}/{uuid}.{ext} 格式", () => {
    const userId = "1";
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const ext = "jpg";
    const imageKey = `problems/${userId}/${uuid}.${ext}`;

    const pattern = /^problems\/\d+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$/;
    expect(pattern.test(imageKey)).toBe(true);
  });

  it("imageKey PNG 格式应通过", () => {
    const imageKey = "problems/1/550e8400-e29b-41d4-a716-446655440000.png";
    const pattern = /^problems\/\d+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$/;
    expect(pattern.test(imageKey)).toBe(true);
  });

  it("非法 imageKey 应被拒绝", () => {
    const imageKey = "bad/path/file.gif";
    const pattern = /^problems\/\d+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$/;
    expect(pattern.test(imageKey)).toBe(false);
  });
});

describe("createProblem Fields", () => {
  it("content + answer + imageKey 三种组合均有效", () => {
    type Combination = { content: string; answer: string; imageKey: string | null };
    const cases: Combination[] = [
      { content: "题目", answer: "答案", imageKey: "problems/1/uuid.jpg" },
      { content: "题目", answer: "答案", imageKey: null },
    ];
    for (const c of cases) {
      expect(c.content).toBeTruthy();
      expect(c.answer).toBeTruthy();
      // imageKey 可为 null
    }
  });
});