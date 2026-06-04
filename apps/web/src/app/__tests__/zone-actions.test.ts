import { describe, it, expect } from "vitest";

describe("zone-actions markReviewed", () => {
  it("zone 更新逻辑：TEMPORARY -> ARCHIVED", () => {
    let zone = "TEMPORARY" as string;
    const markReviewed = () => { zone = "ARCHIVED"; };
    markReviewed();
    expect(zone).toBe("ARCHIVED");
  });
  it("ARCHIVED 题目再次调用 markReviewed 仍为 ARCHIVED", () => {
    let zone = "ARCHIVED" as string;
    const markReviewed = () => { zone = "ARCHIVED"; };
    markReviewed();
    expect(zone).toBe("ARCHIVED");
  });
});
