## Why

第六步引入 AI 自动标注后，题目录入流程出现逻辑 bug：用户点击「保存」时，`createProblem` Action 已将题目写入数据库——此时题目已出现在列表页。后续的 AI 标签建议面板中「确认并保存」按钮实际上只做了 `confirmTags`（写入 ProblemTag 关联），题目的「保存」早在第一步就完成了。这导致：

1. **孤儿题目**：用户在标签确认前关闭页面，题目已入库但无标签
2. **确认步骤无意义**：按钮名为「确认并保存」但实际上「保存」已经发生过
3. **数据不一致**：题目和标签分两次落库，中间存在无标签的时间窗口

## What Changes

- **重构** `createProblem` Action → 拆为 `analyzeProblem`（仅校验 + AI 分析，不写 DB）+ `saveProblem`（题目 + 标签原子写入）
- **重构** `suggestTags` → 改为基于 `content/answer` 参数而非 `problemId`
- **修改** 前端表单按钮文案：「保存」→「下一步」，「确认并保存」→「确认并保存」（此处真正写入 DB）
- **修改** 前端确认流程：`handleConfirm` 调用 `saveProblem` 而非 `confirmTags`
- **删除** `confirmTags` Action（功能合并到 `saveProblem` 中）

## Capabilities

### Modified Capabilities
- problem-entry: 修复题目保存时机——从「表单提交即落库」改为「标签确认后原子落库」

## Impact

- **修改** `apps/web/src/lib/problem-actions.ts`：createProblem 拆分 + saveProblem 新建
- **修改** `apps/web/src/lib/ai-tagging-action.ts`：suggestTags 改为基于 content/answer，删除 confirmTags
- **修改** `apps/web/src/components/problems/problem-form.tsx`：流程调整
- **DB 不变**：无需 schema 变更
