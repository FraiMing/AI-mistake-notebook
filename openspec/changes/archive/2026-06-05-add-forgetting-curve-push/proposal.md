## Why

第一步到第十步已完成错题的录入、标签、分区、复习、AI 辅助全流程。但当前用户需要主动打开应用查看并手动选择题目复习，缺少"在遗忘临界点提醒复习"的机制。PRD 设计的推送模块通过遗忘曲线算法自动识别需复习的题目，按知识点+错因分组推送消息，用户点击消息即可进入复习。

第十一步建立 Message 表作为推送队列，实现推送调度引擎，并在侧边栏添加消息入口。

## What Changes

- **新建** Message 表（userId, problemId, priority, isRead, createdAt）
- **新建** 推送调度引擎：按知识点+错因分组 → 遗忘曲线判断 → 优先级排序 → 写入 Message
- **新建** `/messages` 路由：展示未读消息列表，按优先级排序，点击进入复习
- **新建** 消息标已读：复习完成后自动标记对应 Message 为 isRead
- **修改** 侧边栏：添加 `/messages` 入口（含未读数）

## Capabilities

### New Capabilities
- push-notification: 遗忘曲线推送调度、消息队列、消息列表

## Impact

- 新建: packages/database/drizzle/schema.ts（Message 表定义）
- 新建: packages/database/src/index.ts（ensureTables 添加 Message）
- 新建: apps/web/src/lib/push-actions.ts（推送调度引擎 Server Action）
- 新建: apps/web/src/app/(protected)/messages/page.tsx（消息列表页）
- 新建: apps/web/src/app/api/push/compute/route.ts（触发调度 API）
- 修改: apps/web/src/components/layout/sidebar.tsx（添加消息入口 + 未读数）
- 修改: apps/web/src/app/(protected)/problems/[id]/review/page.tsx（复习完成 → 标消息已读）
- 新建: openspec/specs/push-notification/spec.md