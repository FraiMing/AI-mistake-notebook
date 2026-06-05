## Context

当前项目使用 SQL.js (WASM) 作为数据库驱动，所有数据查询通过 Drizzle ORM 的 `.all()` 方法加载整张表到 Node.js 内存，再用 JavaScript `.filter()`、`.find()`、`.sort()` 进行筛选和排序。每请求加载 `problems`、`problemTags`、`tags`、`messages`、`reviewLogs` 五张表全部数据。

项目已在 `@ai-notebook/database` 中导出 Drizzle 的 `eq()`、`and()` 操作符，但现有代码未使用 SQL 层过滤。

## Goals / Non-Goals

**Goals:**
- 用 Drizzle `.where(eq(col, val))` 替代 `.all().filter(predicate)`
- 将内存分页 `result.slice(start, limit)` 改为 Drizzle `.limit()` / `.offset()`
- 用 `.returning()` 替代 `Math.max(allP.map(p => p.id))` 获取插入后 ID
- 保持所有 API 响应结构不变（不影响前端）

**Non-Goals:**
- 不改变 Drizzle schema 定义
- 不改动 SQL.js 驱动或切换数据库
- 不调整 API 路由签名或 HTTP 方法
- 不解决 Drizzle schema 硬编码迁移问题（另开 change）

## Decisions

### 决策 1: 直接使用 `eq()` + `and()` 而非抽象查询层

**选择**: 直接在各个 route/action 文件中写 `where(eq(col, val))`
**替代方案**: 封装通用查询辅助函数（如 `getProblemsByUser(userId)`）
**理由**: 当前文件数少（7 个），每个查询逻辑简单，抽象层会引入不必要的间接性。如果后续查询模式重复超过 3 次，再抽取。

### 决策 2: `tags` 查询改用子查询而非 JOIN

**选择**: `tags` 先查 `problemTags` 再查 `tags`，保持两阶段查询
**替代方案**: 使用 Drizzle JOIN 语法一次性查出
**理由**: SQL.js 对 Drizzle JOIN 支持有限，且当前两阶段查询逻辑清晰。改为 `WHERE problemTags.problemId IN (...)` 后过滤 id 集合，比 JOIN 更可靠。

### 决策 3: 分页优先用 Drizzle `.limit()/.offset()`，放弃前端分页

**选择**: 在 `api/problems/route.ts` 和 `api/messages/route.ts` 使用 `.limit(pageSize).offset((page-1)*pageSize).all()`
**理由**: 这两个路由已有 `page`/`limit` 查参并做 `slice()`。直接用 SQL `LIMIT/OFFSET` 最简单。

### 决策 4: `push-actions.ts` 保持全量加载以满足聚合逻辑

**选择**: `push-actions.ts` 中的 `enriched` 计算需要跨表关联做分组排序，数据量受限于单一用户，暂时保留 `.all()` 但改为按 `userId` 过滤。
**理由**: 推送计算是定时任务而非 HTTP 请求路径，延迟不敏感。后续性能提升（Redis 缓存）属于独立 change。

## Risks / Trade-offs

- **[SQL.js 对 Drizzle 高级操作符的支持]**: `inArray()` 已从 database 包导出可用。如果遇到 WHERE 子句表现异常，回退为两阶段查询。→ 低风险：现有代码只用了 `.all()`，迁移到基础 `eq()` 不会引入新依赖。
- **[测试覆盖]**: 修改只影响逻辑等价替换，但缺少集成测试意味着需要手动验证。→ 中风险：修改后手动运行 `pnpm dev` 验证关键路径。
- **[不改变响应结构]**: `.returning()` 返回类型与硬编码查询可能不同，需确认 Drizzle SQL.js 驱动支持。→ 低风险：SQL.js 驱动文档确认支持 `.returning()`。

## Open Questions

- 无。所有技术选择基于现有代码模式和 Drizzle 文档。