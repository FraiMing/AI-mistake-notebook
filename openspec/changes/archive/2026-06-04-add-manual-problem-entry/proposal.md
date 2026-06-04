## Why

第一步已就绪空壳项目骨架（认证、布局、数据库），但用户无法输入任何错题。第二步是整个产品的最小可用单元——让用户能从「看到一个空壳」变成「能录题、能看到自己录的题」。这是后续所有功能（OCR、标签、复习、推送）的基础，没有录入就没有数据流。

## What Changes

- **新建** 题目录入页面 (/problems/new)：包含 content（题目内容）和 answer（错误作答）两个文本域，imageKey 字段保留但隐藏
- **新建** 题目列表页面 (/problems)：按 createdAt 倒序展示当前用户的所有题目，空列表时展示空状态提示
- **新建** createProblem Server Action：接收表单数据，校验后写入 SQLite
- **新建** GET /api/problems API Route：查询当前用户题目列表，供 TanStack Query 消费
- **新建** 表单校验（Zod + React Hook Form）：content 必填 ≤ 5000 字符，answer 必填
- **新建** Vitest 单元测试：Server Action 成功/失败两场景
- **新建** Playwright E2E 测试：录入 → 列表可见

## Capabilities

### New Capabilities
- problem-entry: 手动录入题目——用户通过纯文本表单输入题目内容和错误作答，保存后在列表中查看

### Modified Capabilities
<!-- 无 —— 这是 problem-entry 的首次创建 -->

## Impact

- **新建文件**:
  - pps/web/src/lib/problem-actions.ts — createProblem Server Action
  - pps/web/src/app/api/problems/route.ts — GET API Route
  - pps/web/src/components/problems/problem-form.tsx — 录入表单组件
  - pps/web/src/app/(protected)/problems/new/page.tsx — 录入页
  - pps/web/src/app/(protected)/problems/page.tsx — 列表页（替换占位）
- **不修改 DB Schema** — 复用第一步已有 Problem 表
- **不引入新依赖** — Zod、React Hook Form、TanStack Query 已在第一步安装
- **Zustand 推迟至第三步** — 第二步无跨组件共享状态需求，表单状态由 RHF 管理，列表由 TanStack Query 管理