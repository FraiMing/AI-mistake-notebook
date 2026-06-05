## Context

add-basic-review 刚完成，review spec 为新建，尚未 sync 到主干。当前 Problem 表字段：id, userId, content, answer（错误作答）, imageKey, zone, masteryScore, createdAt, updatedAt。answer 字段自第二步起一直是错误作答。

复习页 handleMarkReviewed 无论 understood 值都走同一个 setStep("done") → 展示绿色"复习完成"横幅。不会做分支直接展示 problem.answer（即错误作答）。

本变更修复这两个问题。

## Goals / Non-Goals

**Goals:**
- "不理解"后展示"请自行查阅资料后再次理解"提示，与"理解"的完成态在视觉上区分
- Problem 表添加 `correctAnswer` 字段（TEXT, nullable），默认 NULL 兼容存量数据
- 录入表单新增"正确作答"输入项
- 复习页"不会做"分支展示 `correctAnswer`（有值时）或提示"未填写正确作答"（无值时）

**Non-Goals:**
- 不做迁移脚本填充存量数据的 correctAnswer（存量数据 correctAnswer 为 NULL）
- 不做正确作答的必填校验（保持录入灵活，可后续填写）
- 不改动 `answer` 字段含义（仍是错误作答），不重命名
- 不做 OCR 识别中的正确/错误作答拆分

## Decisions

### 1. correctAnswer 字段设计

```sql
ALTER TABLE Problem ADD COLUMN correctAnswer TEXT;
```

Drizzle 定义（追加到 problems 表）：
```ts
correctAnswer: text("correctAnswer"),
```

- 类型：TEXT，nullable
- 默认值：NULL（存量数据兼容）
- 录入表单：可填可不填（非必填），placeholder="输入正确答案（可选）"
- 复习页展示：`problem.correctAnswer ?? "未填写正确作答"`

### 2. 复习页"不理解"完成态

当前 step 只有 `"done"` 一个结束态。改为：

```
step: "done" → 引入 understood 标记
```

方案：在 handleMarkReviewed 中用 `useState` 记录 `lastUnderstood: boolean | null`，step 设为 "done" 后根据 `lastUnderstood` 渲染不同 UI：

```
lastUnderstood = true  → 绿色横幅："复习完成！题目已迁入归纳区。"
lastUnderstood = false → 黄色横幅："请自行查阅资料后再次理解。题目已迁入归纳区。"
```

两者都提供"返回列表"链接。zone 迁移和 ReviewLog 写入逻辑不变——这两种情况都应迁移题目。

### 3. 录入表单扩展

第二步的 `apps/web/src/app/(protected)/problems/new/page.tsx` 添加"正确作答"输入项：

```
题目内容：[_____________]  (必填)
错误作答：[_____________]  (必填)
正确作答：[_____________]  (可选，占位："输入正确答案（可选）")
```

表单 Zod schema 在 `problem-actions.ts` 对应添加 `correctAnswer: z.string().optional()`。

Server Action 的 INSERT 语句加入 `correctAnswer` 字段。

### 4. API 适配

`/api/problems` 和 `/api/problems/[id]` 返回的 problem 对象已包含所有列，correctAnswer 会自动包含（数据库查询返回所有字段）。无需修改 API 代码，只需确认 TypeScript 类型包含此字段。

### 5. Problem 接口类型

前端各处的 `Problem` 类型需添加 `correctAnswer: string | null`：

- `problems/page.tsx` 的本地 interface
- `review/page.tsx` 的本地 interface

## Risks / Trade-offs

- **存量数据 correctAnswer=NULL**：旧题目在"不会做"分支会展示"未填写正确作答"，体验略差但不会崩溃。用户可后续编辑。
- **ensureTables 迁移**：已有 Problem 表的情况下，ALTER TABLE ADD COLUMN 在 sql.js 中需要 try-catch 处理列已存在的情况（与 source 列的迁移方式一致）。
- **录入表单不必填 correctAnswer**：这是刻意的设计选择。用户可能一时不知道正确答案（刚拿到卷子），允许后续补充。