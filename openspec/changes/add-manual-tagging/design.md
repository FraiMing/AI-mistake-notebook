## Context

第二步已实现手动录入题目和列表查看。Problem 表已有 content、answer、imageKey、zone、masteryScore 字段。前端使用 TanStack Query 获取列表，表单用 React Hook Form + Zod。此设计描述第三步如何引入标签系统（Tag/ProblemTag 表 + TagSelector 组件 + 筛选）。

## Goals / Non-Goals

**Goals:**
- 用户能创建/编辑/删除三种类型的标签（学科、知识点、错因）
- 用户能在录入题目时选择标签（多选，按 type 分组）
- 标签与已有标签名相同时复用，不创建重复
- 列表页显示每道题的标签，按标签组合筛选（AND 逻辑）
- 引入 Zustand store 管理筛选状态（因第二步推迟至此）

**Non-Goals:**
- 不做 AI 自动标注（第六步）
- 不做拍照/OCR
- 不做分区/复习/推送
- 不修改 Problem 表结构

## Decisions

### 1. Tag 表设计

`
Tag:
  id (integer, PK, autoIncrement)
  name (text, not null)
  type (text, not null) — "SUBJECT" | "KNOWLEDGE_POINT" | "ERROR_REASON"
  userId (integer, FK → User.id)
  createdAt (integer, timestamp)

ProblemTag:
  problemId (integer, FK → Problem.id)
  tagId (integer, FK → Tag.id)
  PRIMARY KEY (problemId, tagId)
`

Tag 按 userId 隔离（每个用户自有标签体系）。ProblemTag 联合主键保证不重复关联。删除标签时级联删除 ProblemTag 关联。

**备选方案**：Tag 全局共享（不写 userId）。风险是删除操作会波及所有用户。单用户工具选 userId 隔离更安全，也与 Problem 表风格一致。

### 2. 标签复用策略

录入题目时，用户选择已有标签直接关联 ProblemTag，不创建新 Tag。Tag 按 (name, type) 组合判断唯一性——同一 type 下 name 不可重复，但不同 type 可以同名（如"函数"既可以是知识点也可以是错因）。

前端 TagSelector 展示已有标签列表供选择。没有"临时创建新标签"的能力——用户需先到标签管理页创建。

### 3. Zustand Store 设计

`	s
interface TagFilterStore {
  selectedTags: Record<TagType, number[]>  // type → tagId[]
  setTagFilter(type: TagType, tagIds: number[]): void
  clearFilters(): void
  clearTypeFilter(type: TagType): void
}
`

筛选条件存在 Zustand 中，跨 ProblemForm 和 ProblemsPage 共享。TanStack Query 的 queryKey 包含 selectedTags，筛选变化时自动 refetch。

**为什么不放 URL search params**：三种 type × 多选组合的 URL 会非常冗长。Zustand 可以保持客户端状态纯粹。如果需要分享筛选结果的 URL，后续可追加。

### 4. 筛选逻辑

筛选为 AND 逻辑：选"学科=数学" AND "错因=粗心" → 返回同时满足两个条件的题。后端 API /api/problems 接收可选 query params ?subjectTagIds=1,2&errorTagIds=3。

API 端在 SQL 层做：使用两步 JOIN（ProblemTag + Tag）配合 WHERE IN 的 AND 条件。每条题需要同时拥有所有选中的 tagId 组合。

简化实现：先用 query params 过滤，再在每个 tag type 组内检查。对于单用户 <500 题规模，内存过滤性能足够。

### 5. 表单集成

ProblemForm 增加 <TagSelector /> 组件。不改变现有 content/answer 字段和 Zod schema。标签选择逻辑独立于表单校验——标签可选（允许无标签录入），不影响 content/answer 的必填规则。

## Risks / Trade-offs

- **筛选性能**：当题目数量增长到 1000+ 且同时选中 3 个 type 各多个 tag 时，内存过滤可能有延迟。→ 当前单用户 <100 题场景无风险；后续可迁至 SQL 层组合查询。
- **标签重名**：同一 type 下允许同名？→ 拒绝。创建时前后端双重校验。
- **无标签题筛选不出现**：按 scope 验收项 A6，无标签题不在任何筛选下出现。这是预期行为，不视为 bug。