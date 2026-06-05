## Why

第九步实现了基础复习骨架——会做/不会做 → 理解确认 → zone 迁移。但"不理解"时直接结束缺乏教学深度，复习完成后的巩固也停留在单道题。PRD 设计的完整复习闭环包含三个增强：AI 解答疑惑、AI 生成相似题、隐性掌握度计算。

不理解追问让复习从"机械判断"变为"对话式辅导"——学生说出困惑点，AI 针对性解答，然后再次确认理解。相似题巩固利用 AI 生成同类新题，多轮循环以提升掌握度。掌握度隐藏系数为第十一步推送引擎提供排序权重。

## What Changes

- **新建** AI 解答追问：用户输入困惑点 → DeepSeek 生成解答 → 展示 → 追问"现在理解了吗？"
- **新建** AI 相似题生成：复习完成 → 询问"需要同类题？"→ DeepSeek 生成 → 作答 → 再次确认
- **新建** 掌握度计算：Problem.masteryScore 理解 +10 / 不理解 -15，边界 0-100
- **修改** ReviewLog 表：新增 confusedText、similarQuestionGenerated 字段
- **修改** 复习页状态机：不理解不再直接结束，引入混淆态（confused → explanation → recheck）

## Capabilities

### Modified Capabilities
- review: 不理解追问循环、相似题巩固循环、掌握度计算、ReviewLog 扩展

## Impact

- 修改: apps/web/src/app/(protected)/problems/[id]/review/page.tsx（状态机 + AI 交互）
- 新建: packages/ai-client/src/prompts/explain.ts（解答疑惑 prompt）
- 新建: packages/ai-client/src/prompts/similar-question.ts（相似题 prompt）
- 新建: packages/ai-client/src/explain.ts（解答 Action）
- 新建: packages/ai-client/src/similar-question.ts（相似题 Action）
- 新建: apps/web/src/lib/review-actions.ts（掌握度计算 + review 管理）
- 修改: packages/database/drizzle/schema.ts（ReviewLog 加字段）
- 修改: packages/database/src/index.ts（ensureTables 迁移）
- 修改: openspec/specs/review/spec.md