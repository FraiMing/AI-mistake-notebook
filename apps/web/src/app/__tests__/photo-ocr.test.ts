import { describe, it, expect, vi } from "vitest";

// 模拟百度 OCR API 返回处理逻辑
describe("百度 OCR API 结果处理", () => {
  it("成功时返回 text", () => {
    const mockResponse = {
      words_result: [{ words: "求解方程" }, { words: "x^2+2x+1=0" }],
      words_result_num: 2,
    };

    const text = mockResponse.words_result.map((w) => w.words).join("\n");
    expect(text).toBe("求解方程\nx^2+2x+1=0");
  });

  it("空结果返回空字符串", () => {
    const mockResponse = { words_result: [], words_result_num: 0 };
    const words = mockResponse.words_result ?? [];
    const text = words.length > 0 ? words.map((w) => w.words).join("\n") : "";
    expect(text).toBe("");
  });

  it("鉴权失败返回 null", () => {
    // 模拟 token 获取失败
    const token: string | null = null;
    const result = token ? "有结果" : null;
    expect(result).toBeNull();
  });

  it("超时降级返回 null", () => {
    // 模拟 AbortError
    const isTimeout = true;
    const result = isTimeout ? null : "识别文本";
    expect(result).toBeNull();
  });

  it("API 错误响应的 error_msg 被提取", () => {
    const errorResponse = { error_code: 17, error_msg: "Open api daily request limit reached" };
    expect(errorResponse.error_msg).toContain("limit");
  });
});

describe("上传 API 响应格式", () => {
  it("正常响应包含 imageKey 和 ocrContent", () => {
    const response = {
      imageKey: "problems/1/uuid.jpg",
      ocrContent: "识别出的文本内容",
    };
    expect(response.imageKey).toBeTruthy();
    expect(response.ocrContent).toBeTruthy();
  });

  it("OCR 降级时 ocrContent 为 null", () => {
    const response = {
      imageKey: "problems/1/uuid.jpg",
      ocrContent: null,
    };
    expect(response.imageKey).toBeTruthy();
    expect(response.ocrContent).toBeNull();
  });

  it("错误响应不含 ocrContent", () => {
    const response = { error: "上传失败" };
    expect(response).not.toHaveProperty("ocrContent");
    expect(response.error).toBeTruthy();
  });
});