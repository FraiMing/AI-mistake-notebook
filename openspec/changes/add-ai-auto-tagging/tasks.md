## 1. AI Client —— System Prompt 模板

- [x] 1.1 新建 packages/ai-client/src/prompts/tagging.ts，导出 SYSTEM_PROMPT 常量（三阶诊断法 + 6 类错因 + JSON 输出约束）
- [x] 1.2 导出 buildTaggingUserMessage(content, answer) 辅助函数，拼接 User Message

## 2. AI Client —— autoTagProblem() 核心函数

- [x] 2.1 新建 packages/ai-client/src/tagging.ts，实现 autoTagProblem(content, answer)
- [x] 2.2 定义 AutoTagResult 类型：{ subject: string; knowledgePoint: string; errorReason: string }
- [x] 2.3 在 packages/ai-client/src/index.ts 中导出 autoTagProblem、prompts 模块和新类型

## 3. DB Schema —— ProblemTag 加 source 字段

- [x] 3.1 修改 packages/database/drizzle/schema.ts：ProblemTag 表增加 source 字段
- [x] 3.2 更新 packages/database/src/index.ts ensureTables + 迁移兼容
- [x] 3.3 从 @ai-notebook/database 导出新字段类型

## 4. Server Action —— AI 标注编排

- [x] 4.1 新建 apps/web/src/lib/ai-tagging-action.ts：suggestTags + confirmTags
- [x] 4.2 所有 Tag 查询限定 userId
- [x] 4.3 实现 confirmTags(problemId, entries) 批量写入

## 5. 修改 createProblem Action

- [x] 5.1 修改 apps/web/src/lib/problem-actions.ts 的 createProblem：
  - 保存后调用 suggestTags，返回 aiSuggestions
  - 降级不阻塞

## 6. 前端 —— AI 标签建议展示

- [x] 6.1 修改 problem-form.tsx：三阶段流程（表单→加载态→确认面板）
- [x] 6.2 实现确认流程：confirmTags 后跳转列表

## 7. 前端 —— 标签 Chip source 视觉区分

- [x] 7.1 修改 tag-selector.tsx：AI 标签蓝色边框 + "AI" 角标
- [x] 7.2 修改 problem list page：列表页标签 Chip 显示 source
- [x] 7.3 更新 /api/problems 返回 source 字段

## 8. 测试

- [x] 8.1 Typecheck：ai-client 包通过
- [x] 8.2 Typecheck：web 包通过
- [x] 8.3 System Prompt 内容验证（5 用例）
- [x] 8.4 AutoTagResult 类型验证（1 用例）
- [x] 8.5 标签匹配逻辑测试（6 用例：复用/新建/跨type/跨用户）
- [x] 8.6 降级处理测试（3 用例：空字段/部分空/去重合并）
- [x] 8.7 全量回归：47 tests passed, 6 files
