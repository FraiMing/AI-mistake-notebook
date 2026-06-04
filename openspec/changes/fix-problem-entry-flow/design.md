## Context

第六步完成的题目录入流程如下：

`
form submit -> createProblem()
  -> 校验表单
  -> INSERT Problem -> saveDb()        <- 题目此时已落库
  -> suggestTags(problemId) -> AI 分析
  -> return { problemId, aiSuggestions }

前端收到 -> 展示 AI 建议标签 -> 用户确认 -> confirmTags(problemId, entries)
  -> DELETE 旧关联 + INSERT 新关联     <- 仅写入标签
`

题目在第一步已持久化，confirmTags 仅补写标签。这导致标签确认步骤失去保存的意义。

## Goals / Non-Goals

**Goals:**
- 题目和标签在用户确认后才一起写入 DB（原子性）
- suggestTags 改为基于 content/answer 参数，不依赖已入库的 problemId
- 前端按钮文案和流程与实际操作匹配
- 用户关闭确认页面不会产生孤儿题目

**Non-Goals:**
- 不改变 Tag 表、ProblemTag 表结构
- 不改变 AI 调用逻辑（仅改参数传递方式）
- 不改变前端 UI 布局

## Decisions

### 1. Action 拆分设计

analyzeProblem(content, answer) —— 仅分析，不写 DB：
1. 校验表单
2. 调用 suggestTags(content, answer) -> AI -> 匹配/创建 Tag -> 返回 TagSuggestion[]
3. 返回 { aiSuggestions }

saveProblem({ content, answer, imageKey, tagEntries }) —— 原子写入：
1. 校验表单
2. INSERT Problem -> 获取 newProblemId
3. INSERT ProblemTag x N
4. saveDb()
5. revalidatePath + redirect

### 2. suggestTags 重构

移除对 problemId 的依赖，改为接收 content + answer

### 3. confirmTags 合并到 saveProblem

confirmTags 原有的清除旧关联+写入新关联逻辑迁移到 saveProblem 中。
saveProblem 直接 INSERT 新关联（首次保存，无需清除旧数据）。

### 4. 前端流程调整

| 步骤 | 旧行为 | 新行为 |
|------|--------|--------|
| 表单按钮 | 保存->createProblem(写DB) | 下一步->analyzeProblem(不写DB) |
| 确认按钮 | 确认并保存->confirmTags | 确认并保存->saveProblem(写DB+标签) |
| 返回修改 | 已写入DB的问题仍存在 | 无副作用，可安全返回 |

## Risks / Trade-offs

- AI创建的孤儿Tag：用户确认前关闭页面，新Tag会残留在DB中 -> 可接受，Tag是独立实体
- analyzeProblem和saveProblem之间无并发问题
