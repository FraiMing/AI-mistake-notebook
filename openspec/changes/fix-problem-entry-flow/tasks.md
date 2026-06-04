## 1. 重构 suggestTags

- [x] 1.1 修改 apps/web/src/lib/ai-tagging-action.ts
  - suggestTags(problemId) -> suggestTags(content, answer)
  - 移除 DB 查询题目的逻辑，直接使用 content/answer 参数
  - 内部逻辑不变：调用 AI -> 匹配/创建 Tag -> 返回 TagSuggestion[]
- [x] 1.2 删除 confirmTags Action（功能合并到 saveProblem）

## 2. 重构 problem-actions

- [x] 2.1 重命名 createProblem -> analyzeProblem
  - 仅校验表单 + 调用 suggestTags + 返回 aiSuggestions
  - 移除 DB insert、saveDb 调用
- [x] 2.2 新建 saveProblem Action
  - 接收 { content, answer, imageKey?, tagEntries }
  - INSERT Problem + INSERT ProblemTag x N + saveDb
  - revalidatePath + redirect

## 3. 前端流程调整

- [x] 3.1 修改 problem-form.tsx
  - 表单按钮文案：保存 -> 下一步
  - onSubmit 调用 analyzeProblem 替代 createProblem
  - handleConfirm 调用 saveProblem 替代 confirmTags
  - 新增 formData state 保存 content/answer 跨步骤传递

## 4. 测试

- [x] 4.1 全量回归：59 tests passed, 7 files
