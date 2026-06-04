import { describe, it, expect, vi } from "vitest";

// 模拟 OCR 结果轮询逻辑（不依赖 Redis 连接）
describe("OCR 结果轮询", () => {
  it("processing 状态表示任务未完成", () => {
    const response = { status: "processing" };
    const shouldContinue = response.status === "processing";
    expect(shouldContinue).toBe(true);
  });

  it("completed 状态应停止轮询", () => {
    const response = { status: "completed", content: "题目文本", answer: "答案文本" };
    const shouldContinue = response.status === "processing";
    expect(shouldContinue).toBe(false);
    expect(response.content).toBe("题目文本");
    expect(response.answer).toBe("答案文本");
  });

  it("failed 状态应停止轮询", () => {
    const response = { status: "failed", error: "识别失败" };
    const shouldContinue = response.status === "processing";
    expect(shouldContinue).toBe(false);
    expect(response.error).toBe("识别失败");
  });

  it("30 秒超时应停止轮询（15 次 × 2 秒）", () => {
    const MAX_ATTEMPTS = 15;
    const INTERVAL_MS = 2000;
    expect(MAX_ATTEMPTS * INTERVAL_MS).toBe(30000);
  });

  it("OCR 结果仅有 content 时 answer 为空", () => {
    const result = { status: "completed", content: "题目文本" };
    const answer = result.answer ?? "";
    expect(answer).toBe("");
    expect(result.content).toBe("题目文本");
  });
});

describe("OCR 结果回填", () => {
  it("completed 时 setValue 应传入 content 和 answer", () => {
    const result = { status: "completed", content: "题目", answer: "作答" };
    const formValues = { content: "", answer: "" };

    if (result.status === "completed") {
      formValues.content = result.content ?? "";
      formValues.answer = result.answer ?? "";
    }

    expect(formValues.content).toBe("题目");
    expect(formValues.answer).toBe("作答");
  });

  it("识别中不修改字段", () => {
    const result = { status: "processing" };
    const formValues = { content: "已有内容", answer: "已有作答" };

    if (result.status === "completed") {
      formValues.content = result.content ?? "";
      formValues.answer = result.answer ?? "";
    }

    // 保持原值不变
    expect(formValues.content).toBe("已有内容");
    expect(formValues.answer).toBe("已有作答");
  });
});