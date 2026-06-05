## Why

当前所有 API Route 和 Server Action 中，数据查询使用 Drizzle 的 `.all()` 加载整张表到 Node.js 内存，再用 JavaScript `.filter()` 按条件筛选。每次请求将 `problems`、`problemTags`、`tags`、`messages`、`reviewLogs` 五张表全部读入堆内存。个人使用阶段虽可运行，但随数据量增长会直接导致内存溢出和响应延迟。

## What Changes

- 将 `db.select().from(table).all().filter(predicate)` 替换为 `db.select().from(table).where(eq(column, value)).all()`
- 将内存分页 `result.slice(start, start + limit)` 替换为 SQL `LIMIT/OFFSET`
- 将取最后插入 ID 的 `Math.max(allP.map(p => p.id))` 替换为 `db.insert().returning()`

不涉及 API 契约变更，不改变返回数据结构，不影响前端代码。

## Capabilities

### New Capabilities

- `sql-where-filtering`: 将数据库查询的过滤逻辑从 JavaScript 内存过滤迁移至 SQL WHERE 子句，利用 SQLite 引擎在数据库端完成筛选和分页。

### Modified Capabilities

<!-- 纯实现优化，无 spec 级别行为变更 -->

## Impact

- **受影响文件**: `apps/web/src/app/api/messages/route.ts`、`apps/web/src/app/api/messages/count/route.ts`、`apps/web/src/app/api/problems/route.ts`、`apps/web/src/app/api/problems/[id]/route.ts`、`apps/web/src/app/api/tags/route.ts`、`apps/web/src/lib/problem-actions.ts`、`apps/web/src/lib/push-actions.ts`
- **不涉及**: 前端组件、数据库 schema、外部 API、配置文件