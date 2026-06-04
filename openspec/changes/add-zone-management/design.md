## Context

Problem 表已有 zone 字段（默认 TEMPORARY）。第七步在 Zustand store 新增了 zone 字段 + setZone action，API 已支持 ?zone= 参数。当前列表页未使用 zone 筛选。所有现有题目 zone=TEMPORARY。

本设计描述如何激活 zone 切换 UI、容量提示、以及预留迁移接口。

## Goals / Non-Goals

**Goals:**
- 列表页顶部显示"暂存区 / 归纳区"Tab 切换
- 点击 Tab 时调用 setZone，TanStack Query 自动 refetch 带 zone 参数
- 暂存区满 50 题时显示容量提示
- 预留 markReviewed Server Action（第十步调用）

**Non-Goals:**
- 不做复习功能（第九步）
- 不做自动迁移（需复习闭环触发）
- 不修改 Tag/ProblemTag 表

## Decisions

### 1. Tab 组件设计

使用 Shadcn UI 的 Tabs 组件（或原生 button 组），两个 Tab：暂存区、归纳区。

Tab 切换行为：
- 点击"暂存区" → setZone(undefined) → API 不传 zone → 返回 TEMPORARY 的题
- 点击"归纳区" → setZone("ARCHIVED") → API 传 ?zone=ARCHIVED
- 默认选中"暂存区"

注意：当前 API 设计为传 zone 时过滤、不传时返回全部。需要调整逻辑：
- "暂存区" Tab 传 zone=TEMPORARY
- "归纳区" Tab 传 zone=ARCHIVED
- 默认加载时不传 zone，表现与"暂存区"一致

### 2. 容量提示

暂存区上限 50 题。当 API 返回 TEMPORARY 题目数 ≥50 时，Tab 下方显示提示：
"暂存区已满 (50/50)，请先复习清空后再录入新题"

API 返回的题目数量可以直接从响应数组长度获取。

### 3. markReviewed 接口

预留 Server Action，签名如下：
```ts
export async function markReviewed(problemId: number): Promise<{ error?: string }>
```

功能：UPDATE Problem SET zone='ARCHIVED' WHERE id=problemId。
当前不调用，第十步复习闭环中 trigger。

### 4. zone 筛选逻辑调整

当前 API：不传 zone → 返回全部。
修改为：不传 zone → 默认 zone=TEMPORARY（保持向前兼容，但实际表现与暂存区一致）。

或者：前端总是传递 zone 参数。选中"暂存区"时传 zone=TEMPORARY，选中"归纳区"时传 zone=ARCHIVED。

选择后者——前端显式传参，API 行为更可预测。

## Risks / Trade-offs

- 现有题目全部 zone=TEMPORARY → 归纳区为空，符合预期
- 暂存区容量硬编码 50 → 后续可改为环境变量或用户设置
