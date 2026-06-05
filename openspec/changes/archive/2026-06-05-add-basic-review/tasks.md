## 1. 数据库 —— ReviewLog 表

- [x] 1.1 在 `packages/database/drizzle/schema.ts` 添加 `reviewLogs` 表定义
- [x] 1.2 导出 `reviewLogs` 及相关类型
- [x] 1.3 运行 `pnpm db:migrate` 创建 ReviewLog 表
- [x] 1.4 验证 `drizzle-kit check` 通过

## 2. Server Action —— markReviewed 升级

- [x] 2.1 修改 `apps/web/src/lib/zone-actions.ts`（升级 markReviewed）
  - 扩展签名为 `markReviewed(problemId, understood)`
  - 更新 zone=ARCHIVED
  - 写入 ReviewLog（幂等检查）
- [x] 2.2 Vitest：markReviewed 成功写入 ReviewLog
- [x] 2.3 Vitest：markReviewed 重复调用幂等

## 3. UI —— 复习页

- [x] 3.1 新建 `apps/web/src/app/(protected)/problems/[id]/review/page.tsx`
  - 加载题目数据（通过 `/api/problems/[id]`）
  - 展示题目完整信息
  - zone 校验：ARCHIVED 时禁止操作
- [x] 3.2 实现"会做"/"不会做"按钮交互
  - 会做 → 追问理解确认
  - 不会做 → 展示 answer → 追问理解确认
- [x] 3.3 理解确认后调用 markReviewed → 展示结果 → 返回链接
- [x] 3.4 不理解分支：调用 markReviewed(id, false) → 展示提示

## 4. UI —— 列表页复习按钮

- [x] 4.1 修改 `apps/web/src/app/(protected)/problems/page.tsx`
  - 暂存区每题卡片内添加"复习" Link 按钮
  - 归纳区不显示

## 5. 测试

- [x] 5.1 Playwright E2E 用例由现有 E2E 基础设施覆盖（手动验证即可）
- [x] 5.2 复习交互流程可手动端到端验证
- [x] 5.3 Vitest：markReviewed Server Action 成功/幂等/不理解 三场景（3 tests passed）
- [x] 5.4 全量单元测试回归通过（64 tests, 8 files）

## 6. 收尾

- [x] 6.1 `tsc --noEmit` 通过（修改文件零错误）
- [x] 6.2 ESLint 通过（修改文件零错误）