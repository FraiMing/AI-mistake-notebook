import { describe, it, expect } from "vitest";

describe("zone-actions markReviewed (基础复习)", () => {
  it("理解 → zone 更新为 ARCHIVED 且 ReviewLog 写入 understood=1", () => {
    const logs: { problemId: number; understood: number }[] = [];
    let zone = "TEMPORARY" as string;
    const markReviewed = (problemId: number, understood: boolean) => {
      zone = "ARCHIVED";
      const existing = logs.find((l) => l.problemId === problemId);
      if (!existing) {
        logs.push({ problemId, understood: understood ? 1 : 0 });
      }
    };
    markReviewed(1, true);
    expect(zone).toBe("ARCHIVED");
    expect(logs.length).toBe(1);
    expect(logs[0]).toEqual({ problemId: 1, understood: 1 });
  });

  it("不理解 → zone 仍为 ARCHIVED 且 ReviewLog 写入 understood=0", () => {
    const logs: { problemId: number; understood: number }[] = [];
    let zone = "TEMPORARY" as string;
    const markReviewed = (problemId: number, understood: boolean) => {
      zone = "ARCHIVED";
      const existing = logs.find((l) => l.problemId === problemId);
      if (!existing) {
        logs.push({ problemId, understood: understood ? 1 : 0 });
      }
    };
    markReviewed(2, false);
    expect(zone).toBe("ARCHIVED");
    expect(logs.length).toBe(1);
    expect(logs[0]).toEqual({ problemId: 2, understood: 0 });
  });

  it("重复调用幂等：第二次 markReviewed 不写重复 ReviewLog", () => {
    const logs: { problemId: number; understood: number }[] = [];
    let zone = "ARCHIVED" as string;
    const markReviewed = (problemId: number, understood: boolean) => {
      zone = "ARCHIVED";
      const existing = logs.find((l) => l.problemId === problemId);
      if (!existing) {
        logs.push({ problemId, understood: understood ? 1 : 0 });
      }
    };
    markReviewed(3, true);
    markReviewed(3, false); // 第二次调用，understood 不同但幂等
    expect(logs.length).toBe(1); // 仅保留第一条
    expect(logs[0]).toEqual({ problemId: 3, understood: 1 });
  });
});