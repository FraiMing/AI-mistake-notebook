## Context

当前 `GET /api/problems` 无条件全量返回，`ProblemsPage` 通过 `useQuery` 一次性加载，然后 `TimelineGroup` 全量渲染。API 路由中过滤在内存中进行（全量查询 → JS filter → sort）。随着归纳区积累，全量加载不可持续。

约束：
- 数据库是 SQL.js (WASM SQLite)，不支持 server-side cursor 或原生 LIMIT/OFFSET SQL（Drizzle 可以通过 `.limit()` `.offset()` 支持，底层 SQL.js 支持）
- 前端已有 `TimelineGroup` 渲染组件，支持按日期分组

## Goals / Non-Goals

**Goals:**
- API 新增 `page` / `limit` 参数，返回 `{ items, total }`
- 前端无限滚动 "加载更多" 按钮
- 分区/筛选切换重置分页
- 现有调用不传分页参数时返回全量（向后兼容）

**Non-Goals:**
- 不做传统页码翻页器（与时间线 UI 不匹配）
- 不做游标分页（cursor-based）——offset 足够应对 50 题暂存区 + 中等数量归纳区

## Decisions

### 1. 分页策略：Offset + Limit

SQL.js 底层支持 `LIMIT ? OFFSET ?`，Drizzle 也暴露 `.limit()` / `.offset()`。每页固定 20 题。

```ts
// API 查询
const page = parseInt(searchParams.get("page") || "1");
const limit = parseInt(searchParams.get("limit") || "20");
const offset = (page - 1) * limit;

const items = db.select().from(problems).all()
  .filter(p => p.userId === userId)
  .sort(...)
  .slice(offset, offset + limit);
```

**为什么不用游标分页**：暂存区最多 50 题，归纳区一个人用也不会超千题。offset/limit 足够简单。

### 2. 前端状态管理

```
ProblemsPage
  ├── page, setPage (useState)
  ├── useQuery: key=["problems", zone, tagIds, page]
  │    params: { zone?, tagIds?, page, limit: 20 }
  │    keepPreviousData: true (加载下一页时保留上一页)
  ├── 合并数据: allItems = useRef 累加 pages
  └── 加载更多按钮:
       visible = page * limit < total
```

**关键点**：`useQuery` 的 `queryKey` 包含 `page`，每次翻页触发新请求。用 `useRef` 累加多页数据传给 `TimelineGroup`。

### 3. 筛选/分区切换重置

当 `zone` 或 `selectedTagIds` 变化时：`setPage(1)` + 清空累积数据。`useEffect` 监听依赖变化。

## Risks / Trade-offs

- **数据一致性**：分页期间如果用户新建题目，新题可能插入到已加载页之前 → 影响较小，接受
- **向后兼容**：`page` 参数可选，不传时全量返回，不影响 Photo 预览、Review 页等其他调用方
