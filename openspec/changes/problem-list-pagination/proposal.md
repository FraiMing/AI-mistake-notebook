## Why

当前 `/api/problems` 无条件返回当前用户全部题目，前端全量渲染。31 题暂无问题，但暂存区上限 50 题且归纳区无上限，题目增多后会导致加载慢、渲染卡顿。需要服务端分页保证可扩展性。

## What Changes

- `/api/problems` 新增 `page` / `limit` 查询参数，返回 `{ items, total }` 结构
- 前端列表页从 "全量加载" 改为 "加载更多" 无限滚动，每次加载 20 题
- 筛选/分区切换时重置分页状态
- 向后兼容：无参数时默认返回全部（保持旧行为）

## Capabilities

### New Capabilities

- `problem-list-pagination`: 题目列表 "加载更多" 分页

### Modified Capabilities

- `problem-entry`: "题目列表查看" requirement 需要增加分页场景（加载更多触发新批次、筛选重置分页）

## Impact

- 修改 `apps/web/src/app/api/problems/route.ts`（新增分页逻辑）
- 修改 `apps/web/src/app/(protected)/problems/page.tsx`（前端分页状态 + 加载更多 UI）
- 分页通过 Render Props 或 hook 传递给 `TimelineGroup` 组件
