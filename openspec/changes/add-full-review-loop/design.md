## Context

第九步已完成基础复习：暂存区 → 复习页（会做/不会做 → 理解确认 → done）→ zone 迁移 + ReviewLog 写入。fix-review-logic 修复了不理解 UI 并添加了 correctAnswer 字段。

当前 ai-client 已有 `getAIClient()` 统一入口（OpenAI 兼容 → DeepSeek）、`autoTagProblem`（标签识别）、`SYSTEM_PROMPT` + `buildTaggingUserMessage`（结构化 prompt 模式）。第十步在此模式上扩展两个新的 AI 能力 + 纯计算逻辑（掌握度）。

## Goals / Non-Goals

**Goals:**
- 不理解追问循环：用户输入困惑点 → AI 解答 → 展示 → "现在理解了吗？"→ 继续循环或确认
- 相似题巩固：复习完成 → 询问是否需要 → AI 生成 → 展示新题 → 用户作答（会做/不会做）→ 再次确认
- 掌握度计算：理解 +10、不理解 -15，边界 0-100，存储在 Problem.masteryScore
- ReviewLog 扩展：confusedText（困惑文本）、similarQuestionGenerated（相似题文本）可选冗余存储

**Non-Goals:**
- 不做推送引擎（第十一步）
- 不做掌握度可视化
- 不做批量复习
- 不做 AI 自动生成正确作答（correctAnswer 保持手动录入）
- 相似题不持久化到 Problem 表

## Decisions

### 1. 复习页状态机重新设计

当前状态机（第九步）：
```
initial → understandCheck → done
         → showAnswer → done
```

第十步扩展为：
```
initial → understandCheck → done（理解时）
         → confused → explanation → recheck → done（最终）
         → showAnswer → understandCheck → done
```

新增步骤：
- `confused`：展示困惑点输入框 + 提交按钮
- `explanation`：调用 AI 获取解答，展示加载态 → 解答文本
- `recheck`："现在理解了吗？"→ [理解]/[仍不理解]→ 理解进 done / 不理解回到 confused（循环）

相似题在"done"之后触发：
```
done → similarAsk → similarGenerate → similarDisplay → similarCheck → done
```

### 2. 不理解追问 Prompt 设计（解答疑惑）

采用四层约束结构，`packages/ai-client/src/prompts/explain.ts`：

```
Layer 1 — 角色：有耐心的中学辅导老师，目标是帮学生理解而非给答案
Layer 2 — 思考框架（隐性）：分析知识点 → 诊断思维偏差 → 定位困惑环节 → 选择最佳解释方式
Layer 3 — 输出规范（显性）：
  - 先确认困惑（"你想问的是...对吗？"）
  - 用 ≤3 句话解释核心概念
  - 一个具体例子辅助理解
  - 引导学生重新思考原题
  - 中文回答，语言平实
Layer 4 — 安全护栏：禁止直接给答案、批评学生、超范围延展
```

```ts
export const EXPLAIN_SYSTEM_PROMPT = `你是一位有耐心的中学辅导老师...`;
export function buildExplainUserMessage(
  content: string, answer: string,
  correctAnswer: string | null,
  confusedText: string
): string { ... }
```

参数：temperature=0.6, max_tokens=800

失败降级：展示通用提示"AI 解答暂不可用，请自行查阅资料后确认理解"，仍可点击"理解"/"不理解"继续。

### 3. 相似题 Prompt 设计

采用结构化 JSON 输出 + 自附正确答案验证，`packages/ai-client/src/prompts/similar-question.ts`：

```ts
export const SIMILAR_QUESTION_SYSTEM_PROMPT = `你要生成一道...`;
export function buildSimilarQuestionUserMessage(
  content: string, knowledgePoint: string, errorReason: string
): string { ... }
```

输出结构：
```json
{
  "question": "新题题干（完整可独立作答）",
  "correctAnswer": "新题的正确答案",
  "knowledgePoint": "考察知识点（应与原题一致）"
}
```

参数：temperature=0.4, max_tokens=600。强制 `response_format: { type: "json_object" }`。

后校验：knowledgePoint 与原题标签不匹配或 correctAnswer 为空 → 降级。

### 4. 掌握度计算

Problem 表已有 `masteryScore: REAL DEFAULT 50`。计算规则：
- 每次 `markReviewed(problemId, true)` → `masteryScore = MIN(100, masteryScore + 10)`
- 每次 `markReviewed(problemId, false)` → `masteryScore = MAX(0, masteryScore - 15)`

在 Server Action 层（`markReviewed` 或新 `review-actions.ts`）中计算，不在前端暴露逻辑。

### 5. ReviewLog 扩展

当前 ReviewLog：id, problemId, understood, reviewedAt

第十步追加：
```sql
ALTER TABLE ReviewLog ADD COLUMN confusedText TEXT;
ALTER TABLE ReviewLog ADD COLUMN similarQuestionGenerated TEXT;
```

两个字段均为 nullable TEXT——仅当对应的交互发生时写入。confusedText 在首次不理解追问时写入（循环中的多次追问不覆盖），similarQuestionGenerated 在 AI 成功生成相似题后写入。

### 6. AI 调用架构

两个 AI 功能均走 `packages/ai-client`：
- `explainProblem(problem, confusedText)` → 返回解答文本
- `generateSimilarQuestion(problem, knowledgePoint, errorReason)` → 返回 `{question, correctAnswer, knowledgePoint}`

在 `apps/web` 层通过 Server Action 调用 `ai-client`，前端通过 `useTransition` 或 fetch 触发。不使用流式输出——用户等待感在 3-5 秒内可接受。

## Risks / Trade-offs

- **AI 解答质量不稳定**：通过四层约束 + 后校验（检查输出非空且包含题目关键词）兜底，失败时降级到通用提示
- **相似题可能不是真"同类"**：通过 JSON 知识点头判断后校验，不匹配时提示"暂无法生成同类题"
- **掌握度边界**：连续 10 次不理解 score 不跌破 0、连续 6 次理解不超过 100（数学上自动保证：50 + 10*6=110 → MIN=100, 50 - 15*4= -10 → MAX=0）
- **不理解不迁移 zone**：学生不理解时题目保持 TEMPORARY，仅当追问循环确认理解后才迁移。这修正了第九步的中间态问题