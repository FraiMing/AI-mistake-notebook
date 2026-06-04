import { describe, it, expect } from "vitest";

// ============================================================
// TimelineGroup 分组逻辑测试
// ============================================================

/** 纯函数版本：与组件内 groupByDate 逻辑一致 */
function groupByDate<T>(items: T[], getDate: (item: T) => Date): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const date = getDate(item);
    const key = formatDateKey(date);
    const arr = groups.get(key);
    if (arr) {
      arr.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

describe("TimelineGroup 分组逻辑", () => {
  const items = [
    { id: 1, date: new Date("2026-06-04T10:00:00Z") },
    { id: 2, date: new Date("2026-06-04T14:00:00Z") },
    { id: 3, date: new Date("2026-06-03T09:00:00Z") },
    { id: 4, date: new Date("2026-06-01T12:00:00Z") },
  ];

  it("同日多题折叠到同一分组", () => {
    const groups = groupByDate(items, (i) => i.date);
    expect(groups.size).toBe(3);
    expect(groups.get("2026-06-04")?.length).toBe(2);
    expect(groups.get("2026-06-03")?.length).toBe(1);
    expect(groups.get("2026-06-01")?.length).toBe(1);
  });

  it("空数组返回空 Map", () => {
    const groups = groupByDate([], (i: { date: Date }) => i.date);
    expect(groups.size).toBe(0);
  });

  it("单日单题返回 1 个分组", () => {
    const groups = groupByDate([{ id: 1, date: new Date("2026-06-04T10:00:00Z") }], (i) => i.date);
    expect(groups.size).toBe(1);
    expect(groups.get("2026-06-04")?.length).toBe(1);
  });

  it("日期 key 按 YYYY-MM-DD 格式生成", () => {
    const key = formatDateKey(new Date(2026, 5, 4, 12, 0, 0));
    expect(key).toBe("2026-06-04");
  });

  it("跨月日期正确分组", () => {
    const items2 = [
      { id: 1, date: new Date("2026-06-30T10:00:00Z") },
      { id: 2, date: new Date("2026-07-01T10:00:00Z") },
    ];
    const groups = groupByDate(items2, (i) => i.date);
    expect(groups.size).toBe(2);
    expect(groups.get("2026-06-30")).toBeDefined();
    expect(groups.get("2026-07-01")).toBeDefined();
  });
});

// ============================================================
// 日期格式化测试
// ============================================================

function formatDateLabel(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

describe("日期格式化", () => {
  it("标准日期生成中文格式", () => {
    expect(formatDateLabel(new Date("2026-06-04T00:00:00"))).toBe("2026年6月4日");
  });

  it("月初和月末正确格式化", () => {
    expect(formatDateLabel(new Date("2026-01-01T00:00:00"))).toBe("2026年1月1日");
    expect(formatDateLabel(new Date("2026-12-31T00:00:00"))).toBe("2026年12月31日");
  });

  it("两位数月份正确格式化", () => {
    expect(formatDateLabel(new Date("2026-10-15T00:00:00"))).toBe("2026年10月15日");
  });
});

// ============================================================
// Zone store 测试
// ============================================================

// 模拟 store 初始状态和行为
function createMockStore() {
  let state: { selectedTagIds: Record<string, number[]>; zone?: string } = {
    selectedTagIds: { SUBJECT: [], KNOWLEDGE_POINT: [], ERROR_REASON: [] },
    zone: undefined,
  };

  return {
    getState: () => state,
    setZone: (zone?: string) => { state = { ...state, zone }; },
    clearZone: () => { state = { ...state, zone: undefined }; },
  };
}

describe("Zone store 行为", () => {
  it("初始 zone 为 undefined", () => {
    const store = createMockStore();
    expect(store.getState().zone).toBeUndefined();
  });

  it("setZone 正确设置 zone", () => {
    const store = createMockStore();
    store.setZone("TEMPORARY");
    expect(store.getState().zone).toBe("TEMPORARY");
  });

  it("clearZone 恢复为 undefined", () => {
    const store = createMockStore();
    store.setZone("ARCHIVED");
    store.clearZone();
    expect(store.getState().zone).toBeUndefined();
  });

  it("setZone 不影响 selectedTagIds", () => {
    const store = createMockStore();
    store.setZone("TEMPORARY");
    expect(store.getState().selectedTagIds.SUBJECT).toEqual([]);
  });
});
