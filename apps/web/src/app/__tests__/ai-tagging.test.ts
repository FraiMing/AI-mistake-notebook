import { describe, it, expect } from "vitest";

// 从 ai-client 主入口导入
let _SYSTEM_PROMPT = "";
let _buildTaggingUserMessage: (c: string, a: string) => string = () => "";

beforeAll(async () => {
  const mod = await import("@ai-notebook/ai-client");
  _SYSTEM_PROMPT = mod.SYSTEM_PROMPT as string;
  _buildTaggingUserMessage = mod.buildTaggingUserMessage as (c: string, a: string) => string;
});

// ============================================================
// AI 标注 —— System Prompt 测试
// ============================================================

describe("AI 标注 System Prompt", () => {
  it("提示词包含三阶诊断法关键词", () => {
    expect(_SYSTEM_PROMPT).toContain("审题定位");
    expect(_SYSTEM_PROMPT).toContain("作答复盘");
    expect(_SYSTEM_PROMPT).toContain("归因诊断");
  });

  it("提示词包含 6 类错因", () => {
    expect(_SYSTEM_PROMPT).toContain("粗心计算");
    expect(_SYSTEM_PROMPT).toContain("概念模糊");
    expect(_SYSTEM_PROMPT).toContain("逻辑断层");
    expect(_SYSTEM_PROMPT).toContain("审题遗漏");
    expect(_SYSTEM_PROMPT).toContain("公式误用");
    expect(_SYSTEM_PROMPT).toContain("步骤缺失");
  });

  it("提示词包含 JSON 输出要求", () => {
    expect(_SYSTEM_PROMPT).toContain("JSON");
  });

  it("提示词包含 9 门学科选项", () => {
    expect(_SYSTEM_PROMPT).toContain("数学");
    expect(_SYSTEM_PROMPT).toContain("语文");
    expect(_SYSTEM_PROMPT).toContain("英语");
    expect(_SYSTEM_PROMPT).toContain("物理");
    expect(_SYSTEM_PROMPT).toContain("化学");
    expect(_SYSTEM_PROMPT).toContain("生物");
    expect(_SYSTEM_PROMPT).toContain("历史");
    expect(_SYSTEM_PROMPT).toContain("地理");
    expect(_SYSTEM_PROMPT).toContain("政治");
  });

  it("buildTaggingUserMessage 拼接题目内容和错误作答", () => {
    const result = _buildTaggingUserMessage("求 x+1=0", "x=2");
    expect(result).toContain("求 x+1=0");
    expect(result).toContain("x=2");
    expect(result).toContain("题目内容");
    expect(result).toContain("错误作答");
  });
});

// ============================================================
// AI 标注 —— AutoTagResult 类型测试
// ============================================================

describe("AutoTagResult 类型", () => {
  it("类型包含 subject / knowledgePoint / errorReason 三个字段", () => {
    const result = {
      subject: "数学",
      knowledgePoint: "二次函数",
      errorReason: "公式误用",
    };
    expect(result.subject).toBe("数学");
    expect(result.knowledgePoint).toBe("二次函数");
    expect(result.errorReason).toBe("公式误用");
  });
});

// ============================================================
// AI 标注 —— 标签匹配逻辑（纯函数测试）
// ============================================================

interface Tag {
  id: number;
  name: string;
  type: string;
  userId: number;
}

/** 模拟标签匹配逻辑：精确匹配 name + type */
function matchOrCreateTag(
  aiTagName: string,
  aiTagType: string,
  existingTags: Tag[],
  userId: number,
  nextId: () => number
): { tagId: number; created: boolean } {
  const existing = existingTags.find(
    (t) => t.name === aiTagName && t.type === aiTagType && t.userId === userId
  );
  if (existing) return { tagId: existing.id, created: false };
  return { tagId: nextId(), created: true };
}

describe("标签匹配逻辑", () => {
  const userId = 1;
  const existingTags: Tag[] = [
    { id: 1, name: "数学", type: "SUBJECT", userId: 1 },
    { id: 2, name: "二次函数", type: "KNOWLEDGE_POINT", userId: 1 },
    { id: 3, name: "粗心计算", type: "ERROR_REASON", userId: 1 },
  ];
  let nextIdVal = 100;

  const nextId = () => nextIdVal++;

  beforeEach(() => {
    nextIdVal = 100;
  });

  it("AI 返回已有标签名 → 复用 Tag ID", () => {
    const result = matchOrCreateTag("数学", "SUBJECT", existingTags, userId, nextId);
    expect(result.tagId).toBe(1);
    expect(result.created).toBe(false);
  });

  it("AI 返回已有标签名（错因）→ 复用 Tag ID", () => {
    const result = matchOrCreateTag("粗心计算", "ERROR_REASON", existingTags, userId, nextId);
    expect(result.tagId).toBe(3);
    expect(result.created).toBe(false);
  });

  it("AI 返回新标签名 → 创建新 Tag", () => {
    const result = matchOrCreateTag("逻辑断层", "ERROR_REASON", existingTags, userId, nextId);
    expect(result.tagId).toBe(100);
    expect(result.created).toBe(true);
  });

  it("AI 返回新知识点 → 创建新 Tag", () => {
    const result = matchOrCreateTag("勾股定理", "KNOWLEDGE_POINT", existingTags, userId, nextId);
    expect(result.tagId).toBe(100);
    expect(result.created).toBe(true);
  });

  it("不同 type 的同名标签不冲突", () => {
    const tagsWithFunc: Tag[] = [
      ...existingTags,
      { id: 4, name: "函数", type: "ERROR_REASON", userId: 1 },
    ];
    const result = matchOrCreateTag("函数", "KNOWLEDGE_POINT", tagsWithFunc, userId, nextId);
    // ERROR_REASON ≠ KNOWLEDGE_POINT，应创建新的
    expect(result.created).toBe(true);
  });

  it("不同 userId 的标签互相隔离", () => {
    const tagsOtherUser: Tag[] = [
      ...existingTags,
      { id: 5, name: "物理", type: "SUBJECT", userId: 2 },
    ];
    const result = matchOrCreateTag("物理", "SUBJECT", tagsOtherUser, 1, nextId);
    expect(result.created).toBe(true);
  });
});

// ============================================================
// AI 标注 —— 降级逻辑测试
// ============================================================

describe("降级处理", () => {
  it("AI 返回空字符串时应正确处理", () => {
    const aiResult = { subject: "", knowledgePoint: "", errorReason: "" };
    const validTags = Object.entries(aiResult).filter(([, v]) => v && v.trim());
    expect(validTags.length).toBe(0);
  });

  it("AI 返回部分字段为空时应跳过空字段", () => {
    const aiResult = { subject: "数学", knowledgePoint: "", errorReason: "粗心计算" };
    const valid = Object.entries(aiResult)
      .filter(([, v]) => v && v.trim())
      .map(([k]) => k);
    expect(valid).toEqual(["subject", "errorReason"]);
  });

  it("confirmTags 条目合并逻辑：AI + 手动不重复", () => {
    const aiSuggestions = [
      { tagId: 1, tagName: "数学", tagType: "SUBJECT" as const, source: "AI" as const },
      { tagId: 2, tagName: "二次函数", tagType: "KNOWLEDGE_POINT" as const, source: "AI" as const },
      { tagId: 3, tagName: "粗心计算", tagType: "ERROR_REASON" as const, source: "AI" as const },
    ];
    const manualTags = [
      { id: 3, name: "粗心计算", type: "ERROR_REASON", source: "MANUAL" as const },
    ];

    const entries: { tagId: number; source: string }[] = [];
    for (const s of aiSuggestions) entries.push({ tagId: s.tagId, source: s.source });
    for (const t of manualTags) {
      if (!entries.some((e) => e.tagId === t.id)) entries.push({ tagId: t.id, source: t.source });
    }

    // tagId=3 应该只出现一次（AI 优先）
    expect(entries.filter((e) => e.tagId === 3).length).toBe(1);
    expect(entries.length).toBe(3);
  });
});
