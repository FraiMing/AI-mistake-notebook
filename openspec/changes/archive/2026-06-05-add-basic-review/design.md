## Context

第八步已实现：暂存区 TEMPORARY / 归纳区 ARCHIVED 双 Tab，ZoneTab 组件，`markReviewed` Server Action 骨架（仅 UPDATE zone=ARCHIVED）。当前查看页 URL 模板为 `/problems/[id]`。数据库有 `Problem.zone`（默认 TEMPORARY）和 `Problem.masteryScore`（默认 50，暂不修改）。API `/api/problems?zone=` 已支持 zone 筛选。

第九步复用上述组件，新增复习页交互、ReviewLog 持久化、列表页复习按钮。

## Goals / Non-Goals

**Goals:**
- 暂存区列表题目前显示"复习"按钮，归纳区不显示
- 复习页展示题目完整信息（content、answer、图片、标签）
- "会做"/"不会做"按钮交互，不会做时展示 answer
- 理解确认后调用 markReviewed 迁移 zone=ARCHIVED + 写入 ReviewLog
- ReviewLog 表新建（problemId, understood, reviewedAt）
- 重复复习幂等（同一题仅一条 ReviewLog）

**Non-Goals:**
- 不做不理解追问、AI 解答（第十步）
- 不做相似题巩固（第十步）
- 不做掌握度计算（第十步）
- 不做批量复习

## Decisions

### 1. 复习页路由设计

路由：`/problems/[id]/review`

页面结构：
```
┌────────────────────────────────┐
│  ← 返回列表       复习         │  ← 顶栏
├────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │   题目图片（如有）       │   │
│  ├─────────────────────────┤   │
│  │   题目内容              │   │
│  ├─────────────────────────┤   │
│  │   标签                  │   │
│  └─────────────────────────┘   │
│                                │
│  ┌─────────┐ ┌──────────┐     │
│  │  会做   │ │  不会做   │     │  ← 初始两个按钮
│  └─────────┘ └──────────┘     │
│                                │
│  选"不会做"后展示：            │
│  ┌─────────────────────────┐   │
│  │   错误作答              │   │
│  ├─────────────────────────┤   │
│  │  你理解了吗？            │   │
│  │  [理解]                  │   │
│  └─────────────────────────┘   │
│                                │
│  选"会做"后直接展示：           │
│  ┌─────────────────────────┐   │
│  │  你理解这个知识点        │   │
│  │  和错因了吗？            │   │
│  │  [理解] [不理解]         │   │
│  └─────────────────────────┘   │
└────────────────────────────────┘
```

复习页使用 `useQuery` 加载题目详情（通过 `/api/problems/[id]` 或直接从 problems 列表传递）。

### 2. 复习按钮位置

在暂存区列表的每题卡片右下角新增"复习"按钮。使用 `Link` 跳转到 `/problems/[id]/review`。

归纳区题目不显示"复习"按钮。

### 3. markReviewed 扩展

当前 `markReviewed(problemId)` 仅更新 zone。第九步扩展为：
```ts
export async function markReviewed(
  problemId: number,
  understood: boolean
): Promise<{ error?: string }>
```

功能：
1. UPDATE Problem SET zone='ARCHIVED' WHERE id=problemId
2. INSERT INTO ReviewLog (problemId, understood, reviewedAt)
3. 幂等：如果已有同 problemId 的 ReviewLog，跳过 INSERT（不抛错）

### 4. ReviewLog 表设计

```sql
CREATE TABLE ReviewLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problemId INTEGER NOT NULL REFERENCES Problem(id),
  understood INTEGER NOT NULL,  -- 0 = 不理解, 1 = 理解
  reviewedAt INTEGER NOT NULL   -- timestamp
);
```

Drizzle 定义：
```ts
export const reviewLogs = sqliteTable("ReviewLog", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  problemId: integer("problemId").notNull().references(() => problems.id),
  understood: integer("understood").notNull(),
  reviewedAt: integer("reviewedAt", { mode: "timestamp" }).notNull(),
});
```

### 5. 复习状态机

```
初始 → [会做] → "你理解了吗？"
              ├─ [理解] → markReviewed(id, true) → "复习完成" → 返回列表
              └─ [不理解] → "理解确认未通过" → 继续复习（第十步扩展）
    → [不会做] → 展示 answer → "你理解了吗？"
              └─ [理解] → markReviewed(id, false) → "复习完成" → 返回列表
```

第九步中"不理解"分支仅记录 ReviewLog(understood=false)，不调用 AI，展示简单的提示即可（"请自行查阅资料后再次理解"）。

### 6. 前端状态管理

复习页使用本地 `useState` 管理当前步骤（step: 'initial' | 'showAnswer' | 'understandCheck' | 'done'），不使用 Zustand store——复习是一次性操作，无跨页面共享状态需求。

## Risks / Trade-offs

- **不理解分支无 AI 解答**：第九步点"不理解"后仅展示提示，体验不够完整，但第十步会补上 AI 追问
- **复习页无参数校验**：理论上不应出现归纳区题的复习按钮，但复习页仍需校验 problem.zone === TEMPORARY，否则展示"此题目已复习"并禁止操作
- **幂等性由 Server Action 兜底**：前端避免重复提交，但后端以 INSERT OR IGNORE 保证数据安全
- **ReviewLog 预留 confusedText**：不在本步骤添加，第十步 `ALTER TABLE` 追加即可