## Why

第三步已实现手动标签系统，用户可为题目创建学科（SUBJECT）、知识点（KNOWLEDGE_POINT）、错因（ERROR_REASON）标签并手动打标。但纯手动标注存在两个问题：（1）用户认知负担重——每道题需要自己判断学科、定位知识点、诊断错因；（2）标签一致性差——不同时间、不同心态下手动标注的随意性大，不利于后续「知识点+错因」分组复习的数据质量。

PRD 将 AI 自动标注列为核心需求（Requirement #1），目标是从学科、知识点、错因三个维度自动生成标签建议，覆盖率达到 ≥90%，用户仅需确认或修改。这是从「手动归档」跃迁到「智能驱动复习」的关键一步。

## What Changes

- **新增** packages/ai-client/src/prompts/tagging.ts —— 以「资深教研组长」角色设计的 System Prompt，内嵌三阶诊断法（审题定位→作答复盘→归因诊断）和 6 类标准错因分类学
- **新增** packages/ai-client/src/tagging.ts —— autoTagProblem() 核心函数，封装 DeepSeek API 调用、JSON 解析、标签匹配/创建逻辑
- **新增** apps/web/src/lib/ai-tagging-action.ts —— Server Action，编排题目保存后的 AI 标签生成流程
- **修改** ProblemTag 表 —— 新增 source 字段（TEXT, "AI" | "MANUAL"），区分标签来源
- **修改** DB 迁移 —— drizzle schema 增加 ProblemTag.source 列、drizzle-kit push 生成迁移
- **修改** 前端标签展示 —— 标签 Chip 根据 source 区分视觉样式（AI 蓝色 / 手动灰色），题目表单确认区域支持增删改 AI 建议标签
- **修改** apps/web/src/lib/problem-actions.ts —— createProblem Action 在题目保存后触发 AI 标注

## Capabilities

### Modified Capabilities
- tagging: 在手动标签系统基础上，新增「AI 自动标注」Requirement —— 题目保存后 AI 生成三标签建议，用户确认/修改后写入 ProblemTag

## Impact

- **新建文件**:
  - packages/ai-client/src/prompts/tagging.ts —— System Prompt 模板
  - packages/ai-client/src/tagging.ts —— AI 标签生成逻辑
  - apps/web/src/lib/ai-tagging-action.ts —— Server Action
- **修改文件**:
  - packages/ai-client/src/index.ts —— 导出新增模块
  - packages/database/drizzle/schema.ts —— ProblemTag 加 source 列
  - apps/web/src/lib/problem-actions.ts —— 嵌入 AI 标注触发
  - apps/web/src/components/problems/problem-form.tsx —— AI 建议展示 + 确认区
  - apps/web/src/components/tags/tag-selector.tsx —— 标签 Chip 加 source 标识
- **数据库变更**:
  - ProblemTag 新增 source TEXT NOT NULL DEFAULT 'MANUAL'