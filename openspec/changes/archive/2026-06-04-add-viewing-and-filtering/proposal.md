## Why

已实现题目列表页和标签筛选（第三步扩展了下拉框 + Zustand store + AND 逻辑），但列表缺少时间维度分组——同日多题无法直观归集。此外第八步将引入分区管理（暂时区/归纳区），需预留 zone 字段的 props 链路。

第七步通过时间轴样式 + zone 预留，让列表页具备时间维度感知和分区扩展点。

## What Changes

- 题目列表页改为时间轴布局：按日期分组（YYYY-MM-DD），每日标题 + 题数徽章，同日折叠，最新在上
- 新增 TimelineGroup 通用容器组件
- API 接收可选 ?zone= 参数（默认不传即全部）
- Zustand store 新增 zone 字段（默认 undefined）
- 筛选区保持三标签下拉不变

## Capabilities

### New Capabilities
- viewing-filtering: 时间轴分组展示 + 跨类型标签筛选 + zone 预留

## Impact

- 新建: apps/web/src/components/problems/timeline-group.tsx
- 新建: openspec/specs/viewing-filtering/spec.md（主 spec）
- 修改: page.tsx, tag-filter-store.ts, /api/problems/route.ts
