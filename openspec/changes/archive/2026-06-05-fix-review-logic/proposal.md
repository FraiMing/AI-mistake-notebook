## Why

add-basic-review 实现中存在两个逻辑缺陷：

1. **不理解也显示"复习完成"**：handleMarkReviewed 中 understood=false 时仍渲染绿色"复习完成"横幅，与 spec 要求的"请自行查阅资料后再次理解"提示不符。
2. **"不会做"展示错误作答而非正确作答**：Problem 表从未设有 `correctAnswer` 字段，`answer` 字段存的是错误作答，复习页只能展示错答。PRD 和 spec 均要求展示正确答案。

两个问题的根因不同：问题是纯 UI 逻辑缺陷；问题是数据模型缺口。

## What Changes

- **修复** 复习页 handleMarkReviewed：understood=false 时展示提示文案"请自行查阅资料后再次理解"，非绿色"复习完成"
- **新建** Problem 表 `correctAnswer` 字段（TEXT，可为空），录入表单增加正确作答输入
- **修改** 复习页"不会做"分支：展示 `correctAnswer` 替代 `answer`
- **更新** 录入页表单 Schema 和 Server Action：保存 `correctAnswer`

## Capabilities

### Modified Capabilities
- review: 修复不理解分支的完成态 UI，不会做时展示正确作答
- problem-entry: Problem 表新增 correctAnswer 字段，录入表单扩展

## Impact

- 修改: packages/database/drizzle/schema.ts（Problem 加 correctAnswer）
- 修改: packages/database/src/index.ts（ensureTables 加列）
- 修改: apps/web/src/app/(protected)/problems/new/page.tsx（录入表单加正确作答）
- 修改: apps/web/src/lib/problem-actions.ts（Server Action 保存 correctAnswer）
- 修改: apps/web/src/app/(protected)/problems/[id]/review/page.tsx（不理解 UI + 展示 correctAnswer）
- 修改: apps/web/src/app/api/problems/route.ts（API 返回 correctAnswer）
- 修改: openspec/specs/review/spec.md
- 修改: openspec/specs/problem-entry/spec.md