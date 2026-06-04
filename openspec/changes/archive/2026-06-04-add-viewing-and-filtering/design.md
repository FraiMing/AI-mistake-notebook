## Context

第二步已实现 `/problems` 列表页 + `/api/problems` 数据接口。第三步扩展了标签筛选：Zustand tag-filter-store 管理三种 type 的选中状态，页面渲染下拉框，API 接收 ?tagIds= 参数做 AND 筛选。列表页以卡片（Card）形式平铺，按 createdAt 倒序，无时间维度分组。Problem 表已有 zone 字段（TEMPORARY/ARCHIVED），当前列表页未使用。

本设计描述第七步如何引入时间轴分组布局，以及如何为第八步分区 Tab 预留 zone 数据通路。

## Goals / Non-Goals

**Goals:**
- 题目列表按日期分组展示（YYYY-MM-DD），同一天的多道题放在同一日期标题下
- 日期标题显示日期文本 + 当日题数（如"2026-06-04 · 3 题"）
- 最新日期在最上方，按时间倒序排列日期组
- API 和 Store 预留 zone 字段（当前不启用筛选，仅传递数据）
- 标签筛选保持不变（跨 type AND 逻辑，下拉框 UI）
- 提取通用的 TimelineGroup 组件，方便后续复用

**Non-Goals:**
- 不做分区 Tab 切换（第八步）
- 不做排序方式切换（仅 createdAt 倒序）
- 不做题目编辑/删除
- 不修改筛选逻辑本身或 Zustand store 的标签筛选部分

## Decisions

### 1. TimelineGroup 组件设计

提取通用组件 `TimelineGroup<T>`：

```
Props:
  items: T[]
  getDate: (item: T) => Date
  renderItem: (item: T) => ReactNode
  emptyMessage?: string
```

内部逻辑：
1. 按 `getDate` 提取日期，截断到天（忽略时分秒）
2. 用 Map<dateKey, T[]> 分组
3. 按日期倒序排列组（最新在上）
4. 每组渲染日期标题 + 题数徽章 + items.map(renderItem)

日期标题格式："2026年6月4日" （中文格式，来自 formatDate 函数）

**为什么是独立组件而非页面内联逻辑**：后续消息列表页（第十一步）、复习历史页都可能复用时序分组展示，提取为通用组件避免重复。

### 2. zone 预留策略

三层预留：

| 层 | 文件 | 当前行为 | 第八步行为 |
| --- | --- | --- | --- |
| Store | tag-filter-store.ts | 新增 zone 字段，默认 undefined | 根据 Tab 切换修改 zone |
| API | /api/problems/route.ts | 接收 ?zone= 参数，支持过滤 | 已就绪，无需改动 |
| 页面 | page.tsx | 不展示 zone Tab，查询时不传 zone | 加上 Tab 组件，点击时传 zone |

Store 的 zone 字段设计：
```ts
interface TagFilterStore {
  selectedTagIds: Record<TagType, number[]>
  zone?: 'TEMPORARY' | 'ARCHIVED'
  setZone: (zone?: 'TEMPORARY' | 'ARCHIVED') => void
  // ... 现有字段不变
}
```

API 路由：`GET /api/problems?tagIds=1,2&zone=TEMPORARY`
当前列表页不传 zone 参数，API 返回全部 zone 的题目。第八步 Tab 切换时，Store 更新 zone 值，query 参数中传入 zone。

### 3. 日期格式化与分组

日期分组 key 使用 ISO 日期字符串（如 `"2026-06-04"`），通过 `toLocaleDateString("zh-CN")` 生成中文显示（如 "2026年6月4日"）。

注意时区问题：`createdAt` 在 DB 中为 timestamp 数字（UTC 毫秒）。在客户端用 `new Date(createdAt)` 还原为本地时区的日期。

同日多题的分组内顺序保持 API 返回的原顺序（已按 createdAt 倒序），不做二次排序。

### 4. 筛选与分组的交互

筛选条件变更时：
1. 用户在筛选区改选标签 → Zustand store 更新 → TanStack Query refetch → 新数据
2. 新数据到达后 TimelineGroup 自动重新分组并渲染

无匹配题目时 TimelineGroup 接收空数组，展示 emptyMessage（如 "没有找到匹配的错题"）。

### 5. 组件目录结构

```
apps/web/src/components/problems/
  timeline-group.tsx  （新增——通用时间轴分组容器）
  problem-form.tsx    （不变——第六步已更新）
```

TimelineGroup 放入 problems/ 目录而非 shared/ 是因它目前只用于题目列表，无跨域复用需求时先保持在当前域。

## Risks / Trade-offs

- **大量题目场景**：如用户有 500+ 题（跨多日），TimelineGroup 只负责渲染分组，本身无虚拟列表。当前单用户 <50 题场景无风险；未来可按需引入虚拟滚动。
- **zone 预留造成未使用字段**：第八步前 zone 字段存在但未用，lint 可能报 unused 警告 → 用 `// TODO: step 8 zone tabs` 注释抑制
