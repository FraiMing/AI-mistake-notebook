## Context

当前系统已有：Problem 表（含 zone, masteryScore）、ReviewLog 表（含 reviewedAt）、Tag 表 + ProblemTag 关联表。复习闭环（第九/十步）已跑通。

推送需要的数据全部就绪：zone 区分暂存/归纳、masteryScore 反映掌握程度、reviewedAt 提供上次复习时间。本设计描述如何基于这些数据实现遗忘曲线推送调度。

## Goals / Non-Goals

**Goals:**
- Message 表持久化推送队列
- 推送调度引擎：按知识点+错因分组 → 遗忘曲线判断是否需要复习 → 优先级排序 → 写入 Message
- 每日一次批量计算（通过 API 触发，后续可配 cron）
- `/messages` 页面展示未读消息，按优先级排序
- 复习完成后自动标记对应 Message 为 isRead
- 侧边栏 `/messages` 入口显示未读数

**Non-Goals:**
- 不做设备推送（APNs/FCM）
- 不做实时通知/WebSocket
- 不做红点动效
- 不做频次自定义
- 不做定时器的自动触发（仅提供 API，cron 后续配置）

## Decisions

### 1. Message 表设计

```sql
CREATE TABLE Message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL REFERENCES User(id),
  problemId INTEGER NOT NULL REFERENCES Problem(id),
  priority REAL NOT NULL,
  isRead INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL
);
```

Drizzle 定义：
```ts
export const messages = sqliteTable("Message", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  problemId: integer("problemId").notNull().references(() => problems.id),
  priority: real("priority").notNull(),
  isRead: integer("isRead").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});
```

### 2. 推送调度引擎算法

流程图如下：

```
[开始]
  │
  ▼
获取所有题目 + 标签 + ReviewLog
  │
  ▼
按 (knowledgePoint, errorReason) 分组
  │
  ▼
每个分组：
  ├─ 选取一道代表题（优先 TEMPORARY，其次 masteryScore 最低）
  ├─ 计算遗忘时间基准：
  │     • 有 ReviewLog → 取最近 reviewedAt
  │     • 无 ReviewLog → 取 problem.createdAt
  └─ 遗忘曲线判断：
        needReview = (now - baseTime) > threshold × (1 + masteryScore/100)
        threshold: TEMPORARY=1天, ARCHIVED=3天
  │
  ▼
筛选 needReview=true 的分组
  │
  ▼
计算优先级：
  zoneFactor: TEMPORARY=2.0, ARCHIVED=1.0
  intervalDays: (now - baseTime) / 86400000
  masteryFactor: (100 - masteryScore + 1) / 100
  priority = zoneFactor × intervalDays × masteryFactor
  │
  ▼
按 priority 降序排列
  │
  ▼
为每个分组创建一条 Message（idempotent：同 problem 不重复）
  │
  ▼
[结束]
```

#### 分组逻辑

因为 ProblemTag 是多对多关联，一个题目可能有多个 knowledgePoint 标签。分组策略：
- 取该题的**第一个** KNOWLEDGE_POINT 标签
- 取该题的**第一个** ERROR_REASON 标签
- 组合 "(kpId, erId)" 作为 group key
- 无标签的题目不参与推送

#### 代表题选取

每个分组取一道题：
- 优先 zone=TEMPORARY（未复习的题更需要推送）
- TEMPORARY 中选 oldest createdAt（最早录入的优先复习）
- 全为 ARCHIVED 时选 masteryScore 最低的（掌握最差的优先）

#### 幂等性

同一次调度运行中，同 problemId 已被写入 Message（未读）时跳过。下次调度运行时，如果旧消息已读，重新创建新消息；如果旧消息未读，跳过（一条题只允许一条活跃消息）。

### 3. 遗忘曲线公式

```
needReview = (now - baseTime_ms) > threshold_ms × (1 + masteryScore / 100)

其中：
• baseTime_ms = ReviewLog.reviewedAt（有记录）| problem.createdAt（无记录）
• threshold_ms = 86400000（1天） for TEMPORARY
               = 259200000（3天） for ARCHIVED
```

示例推演：
- 暂存区、masteryScore=50、刚录入 2 天 → 2天 > 1×(1+0.5)=1.5天 → 需要复习 ✓
- 归纳区、masteryScore=90、上次复习 4 天前 → 4天 > 3×(1+0.9)=5.7天 → 不需要复习 ✗

### 4. 调度触发

- 提供 API 端点 `POST /api/push/compute` 供外部 cron 调用
- 定时方案：Docker 部署时在容器内添加 cron job，每日 21:00 调用此端点
- 开发阶段：手动访问 `/api/push/compute` 触发计算

### 5. 消息列表 UI

`/messages` 路由展示所有 `isRead=0` 的消息，按 priority 降序排列。

每条消息显示：
- 知识点 tag 名称 + 错因 tag 名称（从关联数据 JOIN）
- 题目 content 预览（截断至 80 字符）
- 点击消息 → 跳转 `/problems/:id/review?from=message`

消息标已读：
- 复习页 URL 带 `?from=message` 参数时，复习完成（markReviewed 成功）后调用 `markMessageRead(problemId)`
- 复习页独立进入（无 from 参数）不标记消息

### 6. 侧边栏未读数

- 查询 `SELECT COUNT(*) FROM Message WHERE isRead=0 AND userId=?`
- 在侧边栏 `/messages` 入口旁显示数字（如 `消息 (3)`）
- 用 TanStack Query 或 fetch 在 layout 中获取

## Risks / Trade-offs

- **调度频率**：每日一次意味着当天录入的错题要等到次日 21:00 才会被推送。对于"当天录入当天复习"场景，用户可手动进入暂存区复习。
- **标签缺失**：无 knowledgePoint 或 errorReason 标签的题目不参与推送。已在第六步 AI 标注中覆盖，但手动录入未打标签的题会被遗漏。
- **幂等性依赖 isRead**：如果旧消息未读，新调度不会为同题创建新消息。这防止了重复推送，但也意味着用户必须处理完旧消息才能收到同题的新推送。