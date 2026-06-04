## Context

第一步已完成项目骨架：Auth.js v5 认证、Drizzle SQL.js 数据库、受保护布局 + 侧边栏、TanStack Query Provider。Problem 表已定义（字段：id, userId, content, answer, imageKey, zone, masteryScore, createdAt, updatedAt），但无任何录入或查看功能。此设计描述第二步「手动录入题目」的技术实现。

## Goals / Non-Goals

**Goals:**
- 用户能通过表单手动输入题目内容（content）和错误作答（answer）
- 用户能在列表页查看已录入的所有题目，按时间倒序
- 表单校验：content 必填 ≤ 5000 字符，answer 必填
- 数据获取使用 TanStack Query（为后续筛选交互铺路）
- 提交后自动跳转到列表，刷新后数据不丢失

**Non-Goals:**
- 不做图片上传 / OCR / AI 标注
- 不做标签系统、分区管理、复习、推送
- 不做题目的编辑或删除
- 不引入 Zustand（推迟至第三步）
- 不按日分组列表（平铺即可，第七步再加时间轴）

## Decisions

### 1. 数据获取：API Route + TanStack Query

选择 API Route（GET /api/problems）+ 客户端 useQuery，而非 Server Component 直接查 DB。

**理由**：Scope 文档明确要求 "TanStack Query 缓存"。更关键的是，第七步多维筛选（学科/知识点/错因组合筛选）是高频客户端交互——筛选切换不应触发页面导航。API Route 方案下，第七步只需在客户端追加筛选参数即可让 TanStack Query 自动 refetch；Server Component 方案则需要重构整个数据获取层。

### 2. Zustand 推迟至第三步

第二步没有跨组件共享状态的需求：表单状态由 React Hook Form 管理，列表数据由 TanStack Query 管理，提交状态由 useTransition 管理。Zustand 在第三步标签系统引入时才有实质用途（标签选择器展开/折叠、筛选条件持久化）。

### 3. 列表平铺，不按日分组

Scope 文档第七步验收项 A1 才要求 "同日合并到同一日期分组"。第二步保持平铺列表，避免过早实现导致 Step 7 需要重构。

### 4. answer 字段必填校验

虽然 scope 文档仅明确要求 content 必填，但 DB schema 中 answer 为 NOT NULL，且业务语义上「错题本没有错误作答」不合理。追加 answer 必填校验是防御性设计，不违背 scope 原则。

### 5. auth() 在 Server Action 和 API Route 中的使用

createProblem Server Action 和 GET /api/problems 都调用 uth() 获取当前用户 userId。无需前端传递 userId，杜绝伪造风险。

## Risks / Trade-offs

- **API Route 的额外 round-trip**：列表首屏比 Server Component 多一次网络请求，但题目列表不是登录后的首屏（侧边栏在），且 TanStack Query 缓存可在后续导航中命中。单用户、SQLite 本地文件、预期题目量 < 100 的场景下，延迟不可感知。
- **SQL.js 写入同步**：createProblem 写入后需调 saveDb() 将内存数据库持久化到文件。若 saveDb 失败（磁盘满/权限），数据会丢失。→ 后续步骤可加 try-catch 回滚，当前先接受风险。
- **无编辑/删除接口**：第二步不暴露编辑删除 UI，如需修正错录，需直接操作 SQLite。→ 后续步骤可追加。