## 1. AI Client —— 解答疑惑

- [x] 1.1 新建 `packages/ai-client/src/prompts/explain.ts`
  - EXPLAIN_SYSTEM_PROMPT（四层约束：角色 + 思考框架 + 输出规范 + 安全护栏）
  - buildExplainUserMessage(content, answer, correctAnswer, confusedText)
- [x] 1.2 新建 `packages/ai-client/src/explain.ts`
  - explainProblem 函数，调用 DeepSeek，temperature=0.6, max_tokens=800
  - 返回解答文本（纯文本，非 JSON）
  - 错误处理：超时/失败返回 null
- [x] 1.3 在 `packages/ai-client/src/index.ts` 导出 explainProblem

## 2. AI Client —— 相似题生成

- [x] 2.1 新建 `packages/ai-client/src/prompts/similar-question.ts`
  - SIMILAR_QUESTION_SYSTEM_PROMPT（知识点一致、难度相当、题型一致、自附正确答案）
  - buildSimilarQuestionUserMessage(content, knowledgePoint, errorReason)
- [x] 2.2 新建 `packages/ai-client/src/similar-question.ts`
  - generateSimilarQuestion 函数，temperature=0.4, max_tokens=600
  - 强制 response_format: json_object
  - 返回 `{ question, correctAnswer, knowledgePoint } | null`
  - 后校验：knowledgePoint 不匹配或 question 为空 → 返回 null
- [x] 2.3 在 `packages/ai-client/src/index.ts` 导出 generateSimilarQuestion

## 3. 数据库 —— ReviewLog 扩展

- [x] 3.1 修改 `packages/database/drizzle/schema.ts`
  - reviewLogs 表添加 confusedText: text、similarQuestionGenerated: text
- [x] 3.2 修改 `packages/database/src/index.ts` ensureTables
  - ALTER TABLE ReviewLog ADD COLUMN 迁移（try-catch 列已存在）
- [x] 3.3 typecheck 通过

## 4. Server Action —— markReviewed 升级 + 掌握度

- [x] 4.1 修改 `apps/web/src/lib/zone-actions.ts`
  - 掌握度计算（理解 +10 / 不理解 -15，MIN/MAX 边界）
  - 不理解不迁移 zone（保持 TEMPORARY）
  - confusedText 写入 ReviewLog（首次写入，循环不覆盖）
  - ReviewLog 增量更新（已有记录时更新 understood/confusedText）
- [x] 4.2 Vitest：掌握度计算逻辑（zone-actions.test.ts 已有 3 场景覆盖）

## 5. 复习页 —— 不理解追问 UI

- [x] 5.1 状态机扩展：confused / explanation / recheck 步骤
- [x] 5.2 confused：困惑点输入框 + "请 AI 解答"按钮
- [x] 5.3 explanation：AI 解答加载态 + 展示解答文本 + 降级提示
- [x] 5.4 recheck："现在理解了吗？" → [理解]/[仍不理解]

## 6. 复习页 —— 相似题巩固 UI

- [x] 6.1 done 后展示"需要同类题巩固吗？"→ [需要]/[不需要]
- [x] 6.2 similarGenerate：AI 加载态
- [x] 6.3 similarDisplay：展示生成题目 + [会做]/[不会做]
- [x] 6.4 similarCheck：作答后确认 → 再次询问（循环）
- [x] 6.5 AI 失败降级：提示"暂无法生成同类题"

## 7. API 端点

- [x] 7.1 新建 `apps/web/src/app/api/review/explain/route.ts`
- [x] 7.2 新建 `apps/web/src/app/api/review/similar-question/route.ts`

## 8. 测试 + 收尾

- [x] 8.1 `tsc --noEmit` 通过（修改文件零错误，仅预存 3 个非本变更错误）
- [x] 8.2 ESLint 通过
- [x] 8.3 全量单元测试回归通过（64 tests, 8 files）