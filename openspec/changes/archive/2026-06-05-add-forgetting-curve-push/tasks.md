## 1. 数据库 —— Message 表

- [ ] 1.1 在 `packages/database/drizzle/schema.ts` 添加 `messages` 表定义
- [ ] 1.2 在 `packages/database/src/index.ts` ensureTables 添加 Message 建表 + 导出
- [ ] 1.3 typecheck 通过

## 2. 推送调度引擎

- [ ] 2.1 新建 `apps/web/src/lib/push-actions.ts`
  - computeAndPush() Server Action
  - 实现分组 → 遗忘曲线 → 优先级排序 → 写入 Message 全流程
  - 幂等性检查
- [ ] 2.2 新建 `apps/web/src/app/api/push/compute/route.ts`
  - POST 端点，调用 computeAndPush
- [ ] 2.3 Vitest：遗忘曲线需复习/不需复习边界 2 用例
- [ ] 2.4 Vitest：优先级排序 2 用例（临时区 vs 归纳区，高间隔 vs 低间隔）

## 3. 消息列表 UI

- [ ] 3.1 新建 `apps/web/src/app/(protected)/messages/page.tsx`
  - 查询 isRead=0 的消息列表（按 priority 降序）
  - 展示题目预览 + 知识点 tag + 错因 tag
  - 空状态处理
- [ ] 3.2 消息点击跳转到 `/problems/:id/review?from=message`

## 4. 消息标已读

- [ ] 4.1 新建 Server Action `markMessageRead(problemId)`
  - 在 `push-actions.ts` 中实现
- [ ] 4.2 修改复习页 `review/page.tsx`
  - 检测 URL 参数 `?from=message`
  - 复习完成（step=done）后调用 `markMessageRead(problemId)`

## 5. 侧边栏未读数

- [ ] 5.1 修改 `apps/web/src/components/layout/sidebar.tsx`
  - 添加 `/messages` 入口
  - 显示未读消息数量

## 6. 测试

- [ ] 6.1 Vitest：遗忘曲线触发/不触发边界（临界时间 ±1 分钟）2 用例
- [ ] 6.2 Vitest：优先级排序（临时区 vs 归纳区，高间隔 vs 低间隔）2 用例
- [ ] 6.3 全量单元测试回归通过

## 7. 收尾

- [ ] 7.1 `tsc --noEmit` 通过
- [ ] 7.2 ESLint 通过