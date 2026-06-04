## Context

第三步已实现手动标签系统：Tag 表（name, type, userId）、ProblemTag 多对多关联表。第五步已接入百度 OCR，题目提交前 content 字段已完成填充。

`packages/ai-client` 包已引入 OpenAI SDK 并配置 DeepSeek API 端点，当前仅有 `getAIClient()` 单例工厂函数。`packages/database/drizzle/schema.ts` 中 ProblemTag 表目前仅有 problemId + tagId 联合主键，无来源标注字段。

前端使用 React Hook Form + Zod 校验表单，TanStack Query 管理服务端状态，Zustand 管理筛选状态。题目列表页面已有标签 Chip 展示（Badge 样式）和标签列。

## Goals / Non-Goals

**Goals:**
- 题目保存后，异步调用 DeepSeek API，根据 content（题目内容）和 answer（错误作答）自动推断学科、知识点、错因三个标签
- AI 返回的标签名若与用户已有标签（相同 userId + name + type）完全匹配，直接复用已有 Tag ID，不创建重复记录
- 若 AI 返回的标签名无匹配，自动创建新 Tag（userId + name + type），并关联到 ProblemTag
- ProblemTag 新增 source 字段标记来源（AI / MANUAL），前端标签 Chip 根据来源区分视觉样式
- 前端展示 AI 生成的三个标签建议，用户可删除任意建议、手动添加额外标签，确认后统一写入
- AI 调用失败（超时、返回非法 JSON、网络错误）时，前端展示降级提示，不阻塞手动打标和题目保存

**Non-Goals:**
- 不做流式输出（PRD 明确排除）
- 不做置信度展示（开发范围裁剪方案明确排除）
- 不做批量标注
- 不做调用日志持久化（仅控制台 console.error 打印调试信息）
- 不修改 Tag 表、Problem 表结构
- 不做 AI 标签与手动标签的冲突检测（用户确认阶段自行处理）

## Decisions

### 1. System Prompt 设计 —— 三阶诊断法

AI 以「资深中学学科教研组长」角色进行诊断，而非简单的分类器。Prompt 嵌入三个分析阶段：

1. **审题定位** —— 判定学科，定位具体知识点（章节/概念级别）
2. **作答复盘** —— 推演学生的思维路径，定位偏离点
3. **归因诊断** —— 将错误归入 6 类标准错因之一

6 类错因（互斥，每个类别包含特征描述、易混淆区分和示例）：

| 错因 | 特征 | 与相似类别的区别 |
|------|------|----------------|
| 粗心计算 | 思路正确，手滑算错 | vs 逻辑断层：过程对 vs 过程错 |
| 概念模糊 | 对定理/定义本身理解错误 | vs 公式误用：不知道 vs 知道但选错 |
| 逻辑断层 | 解题方向或框架错误 | — |
| 审题遗漏 | 忽略了关键条件或看错要求 | vs 步骤缺失：输入端失误 vs 输出端缺失 |
| 公式误用 | 选了错误的公式/定理 | vs 概念模糊：理解公式但用错 vs 不理解公式 |
| 步骤缺失 | 跳步、漏步、过程不完整 | — |

系统提示词存放在 `packages/ai-client/src/prompts/tagging.ts`，作为独立模块导出 `SYSTEM_PROMPT` 常量，方便测试和版本管理。

输出格式要求严格 JSON，不允许额外文字：
```json
{
  "subject": "学科名称",
  "knowledgePoint": "知识点名称",
  "errorReason": "错因名称"
}
```

User Message 为题目内容拼接：
```
题目内容：
{content}

错误作答：
{answer}

请分析上述错题。
```

### 2. 标签匹配策略 —— 精确匹配

学科和错因通过 System Prompt 约束了枚举选项，AI 只会从指定集合中选择。知识点虽然自由文本，但基于相同的诊断框架，同一概念场景下命名趋于一致。

匹配逻辑：
- 查询当前用户下是否存在 `name === aiTagName AND type === aiTagType` 的 Tag
- 存在 → 复用 Tag ID
- 不存在 → 创建新 Tag（userId + name + type），获取新 ID
- 将 (problemId, tagId, source='AI') 写入 ProblemTag

不支持模糊匹配（相似度/编辑距离等）。原因是：学科和错因有 Prompt 枚举约束，不会出现变体；知识点虽然可能产生 "二次函数" vs "二次函数图像" 的差异，但精确匹配的后果仅是多创建一个 tag，用户后续可在标签管理页合并。

### 3. ProblemTag.source 字段设计

```sql
ALTER TABLE ProblemTag ADD COLUMN source TEXT NOT NULL DEFAULT 'MANUAL';
```

取值：
- `'AI'` —— AI 自动生成的标签
- `'MANUAL'` —— 用户手动添加的标签（包含第三步已有数据）

使用 NOT NULL + DEFAULT 保证向后兼容：第三步已创建的 ProblemTag 记录自动获得 source='MANUAL'。

前端渲染区分：
- AI 标签：蓝色边框 + "AI" 角标
- 手动标签：灰色边框，无角标

注意：source 字段仅在 ProblemTag 级别——同一个 Tag 可以被不同题目分别以 AI 或手动方式关联，不影响 Tag 本身。

### 4. 调用流程与错误处理

```
createProblem Action
  │
  ├─ 1. 校验表单 + 保存 Problem 到 DB
  │
  ├─ 2. 异步调用 autoTagProblem(problemId)
  │     │
  │     ├─ 成功 → 返回 { subject, knowledgePoint, errorReason } + tagIds
  │     │
  │     └─ 失败 → 捕获错误，返回 null
  │           ├─ 超时（30s）→ console.error + 降级
  │           ├─ JSON 解析失败 → console.error + 降级
  │           └─ 网络错误 → console.error + 降级
  │
  └─ 3. 返回给前端：{ problem, aiTags: [{suggestion, tagId}] | null }
```

前端收到响应后：
- aiTags 不为 null → 渲染 AI 建议标签面板（蓝色），已有手动标签面板（灰色）
- aiTags 为 null → 展示降级横幅："AI 标注暂不可用，请手动添加标签"
- 用户可删除 AI 建议标签、新增手动标签
- 用户点击「确认」→ 调用 confirmTags(problemId, tagIds) 一次性写入 ProblemTag

不使用两阶段提交（先写 AI 再让用户修改）。AI 建议作为瞬时 UI 状态，用户确认后才真正写入 DB。

### 5. 调用时机 —— 同步 vs 异步

选择「同步调用、阻塞返回」模式：题目保存后，在同一 Server Action 中调用 AI，等待结果（最多 30s）后一起返回前端。

不选异步（Background Job）的理由：
- 开发范围方案明确不做流式输出和任务队列
- 单次 DeepSeek 调用延迟通常在 2-5 秒，用户可接受
- 前端加载态（"AI 正在分析错题..."）的体验优于"保存后突然多出标签"的异步推入

### 6. 标签确认后的用户修改流

确认后的 AI 标签写入 DB 即变为 source='AI' 的 ProblemTag 记录。后续用户可通过以下方式修改：
- 在题目详情/列表中看到 AI 标签并删除（复用已有的 removeProblemTags Action）
- 添加新的手动标签（复用已有的 addProblemTags Action）
- 修改不影响已写入 DB 的 source 值——来源信息永久保留，供后续数据分析

## Risks / Trade-offs

- **DeepSeek API 不稳定性**：服务不可用或返回异常时，降级为提示手动打标，不阻塞核心题目保存流程
- **AI 标签命名不一致**：同一知识点可能被 AI 命名为 "二次函数"、"二次函数图像"、"二次函数的性质" 等变体，导致用户标签体系中产生多个语义相近的 tag → 当前精确匹配策略下接受此 tradeoff；用户后续可在标签管理页手动合并
- **30s 超时可能过短**：在网络状况差时 → 设为 30s（DeepSeek 正常响应 2-5s），若频繁超时可调大
- **System Prompt 迭代成本**：错因分类学若需调整，需修改 Prompt 并重新测试 → 将 Prompt 独立为模块文件，方便版本管理和 A/B 测试
