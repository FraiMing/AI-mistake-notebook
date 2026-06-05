## Why

第八步完成了暂存区/归纳区分区管理，但暂存区题目尚未有复习入口。PRD 设计的复习闭环核心是"会做/不会做 → 理解确认 → zone 迁移"，第九步先实现这一基础骨架：用户进入复习页，对题目做出"会做"或"不会做"的判断，确认理解后将题目从暂存区迁入归纳区。不做 AI 追问、相似题生成、掌握度（留待第十步）。

复习记录的持久化（ReviewLog 表）也是此步建立，为后续第十步的 confusedText、similarQuestion 扩展和第十一步推送引擎提供数据基础。

## What Changes

- **新建** ReviewLog 表（problemId, understood, reviewedAt）
- **新建** 复习页（`/problems/[id]/review`）：展示题目 → "会做"/"不会做"按钮 → 确认理解 → zone 迁移
- **修改** `markReviewed` Server Action：扩展签名为 `markReviewed(problemId, understood)`，写入 ReviewLog
- **修改** 暂存区列表：每题旁增加"复习"按钮

## Capabilities

### New Capabilities
- review: 暂存区题目进入复习，会做/不会做判断，理解确认，zone 迁移至归纳区，ReviewLog 持久化

## Impact

- 新建: packages/database/drizzle/schema.ts（ReviewLog 表定义）
- 新建: apps/web/src/app/(protected)/problems/[id]/review/page.tsx（复习页）
- 新建: apps/web/src/lib/review-actions.ts（markReviewed 升级，含 ReviewLog 写入）
- 修改: apps/web/src/app/(protected)/problems/page.tsx（列表加复习按钮）
- 修改: packages/database/src/index.ts（导出 ReviewLog 相关）
- 新建: openspec/specs/review/spec.md