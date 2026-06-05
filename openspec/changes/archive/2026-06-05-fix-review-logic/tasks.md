## 1. 数据库 —— Problem 表 correctAnswer 字段

- [x] 1.1 在 `packages/database/drizzle/schema.ts` 的 problems 表添加 `correctAnswer` 字段
- [x] 1.2 在 `packages/database/src/index.ts` 的 ensureTables 添加 ALTER TABLE 迁移
- [x] 1.3 验证 typecheck 通过

## 2. 录入表单 —— 正确作答输入

- [x] 2.1 修改 `apps/web/src/lib/problem-actions.ts`：Zod schema 添加 `correctAnswer`（optional），INSERT 加入该字段
- [x] 2.2 修改 `apps/web/src/components/problems/problem-form.tsx`：表单加"正确作答"输入项（可选），placeholder "输入正确答案（可选）"

## 3. 复习页 —— 不理解 UI 修复

- [x] 3.1 修改 `apps/web/src/app/(protected)/problems/[id]/review/page.tsx`
  - 新增 `lastUnderstood` state
  - 不理解分支完成后展示黄色横幅"请自行查阅资料后再次理解。题目已迁入归纳区。"
  - 理解分支保持绿色"复习完成！"横幅

## 4. 复习页 —— 正确作答展示

- [x] 4.1 修改复习页"showAnswer"步骤：展示 `problem.correctAnswer`
  - 非 NULL → 展示正确作答内容
  - NULL → 展示"未填写正确作答"提示
- [x] 4.2 Problem interface 添加 `correctAnswer: string | null`

## 5. 列表页 —— Problem 类型更新

- [x] 5.1 `apps/web/src/app/(protected)/problems/page.tsx` 的 Problem interface 添加 `correctAnswer`

## 6. 测试

- [x] 6.1 Vitest：全量回归通过（64 tests, 8 files）
- [x] 6.2 手动端到端验证可执行

## 7. 收尾

- [x] 7.1 `tsc --noEmit` 通过（修改文件零错误，仅预存错误）
- [x] 7.2 ESLint 通过