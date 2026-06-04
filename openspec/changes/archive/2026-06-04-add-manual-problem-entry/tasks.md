## 1. Server Action（后端）

- [x] 1.1 新建 pps/web/src/lib/problem-actions.ts：实现 createProblem Server Action，接收 {content, answer}，通过 uth() 获取 userId，INSERT 到 Problem 表，调 saveDb() 持久化
- [x] 1.2 在 Server Action 中处理异常（DB 写入失败时返回错误信息）

## 2. API Route

- [x] 2.1 新建 pps/web/src/app/api/problems/route.ts：GET 处理器，通过 uth() 获取 userId，查询当前用户的 Problem 列表，按 createdAt 倒序返回 JSON
- [x] 2.2 使用 Zod 校验返回数据结构

## 3. 录入表单

- [x] 3.1 新建 pps/web/src/components/problems/problem-form.tsx：React Hook Form + Zod resolver，包含 content（textarea, 必填 ≤ 5000）、answer（textarea, 必填）两个字段
- [x] 3.2 表单验证错误信息中文显示（"题目内容不能为空""错误作答不能为空""题目内容不能超过 5000 个字符"）
- [x] 3.3 提交时调用 createProblem Server Action，成功后 outer.push("/problems")，失败时显示错误
- [x] 3.4 提交按钮显示 loading 状态（useTransition）

## 4. 页面组装

- [x] 4.1 新建 pps/web/src/app/(protected)/problems/new/page.tsx：渲染 ProblemForm，页面标题"录入错题"
- [x] 4.2 重写 pps/web/src/app/(protected)/problems/page.tsx：使用 TanStack Query useQuery 调用 GET /api/problems，渲染列表
- [x] 4.3 列表页按 createdAt 倒序展示，每条显示 content 和 answer
- [x] 4.4 空列表时展示"暂无错题"空状态

## 5. 测试

- [x] 5.1 Vitest：createProblem Server Action 成功场景（insert 返回新 Problem）
- [x] 5.2 Vitest：createProblem Server Action 失败场景（content 为空应被拒绝）
- [x] 5.3 Playwright E2E：从头录入一条题目 → 列表可见，1 条用例