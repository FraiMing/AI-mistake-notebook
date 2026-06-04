## Why

第二步已实现题目的手动录入和列表查看，但题目没有分类维度——用户面对列表只能看到发布时间排序，无法按学科、知识点、错因组织题目。第三步引入标签系统，让用户能创建标签、给题目打标、按标签组合筛选，为后续复习模块的「知识点+错因」分组提供数据结构基础。

## What Changes

- **新建** Tag 表（name, type: SUBJECT | KNOWLEDGE_POINT | ERROR_REASON）和 ProblemTag 多对多关联表
- **新建** 标签管理页面：创建、编辑、删除三种类型的标签
- **新建** 题目表单加标签选择器（多选，按 type 分组展示）
- **新建** ProblemTag Server Actions（打标、移除关联）
- **新建** Tag CRUD Server Actions
- **新建** 列表页标签列 + 按标签 type+name 下拉筛选
- **新建** Zustand store 管理筛选条件和标签选择器状态
- **不修改** Problem 表和现有录入/列表逻辑
- **不引入 AI 标注**

## Capabilities

### New Capabilities
- 	agging: 手动标签系统——用户能创建三种类型（学科/知识点/错因）的标签，给题目打标，按标签组合筛选题目

### Modified Capabilities
<!-- 无 —— 现有 problem-entry 的 requirement 不变 -->

## Impact

- **新建文件**:
  - pps/web/src/lib/tag-actions.ts — Tag CRUD + ProblemTag Server Actions
  - pps/web/src/components/tags/tag-manager.tsx — 标签管理面板
  - pps/web/src/components/tags/tag-selector.tsx — 标签多选器
  - pps/web/src/stores/tag-filter-store.ts — Zustand 筛选状态 store
  - pps/web/src/app/(protected)/tags/page.tsx — 标签管理页
- **修改文件**:
  - pps/web/src/components/problems/problem-form.tsx — 嵌入 TagSelector
  - pps/web/src/app/(protected)/problems/page.tsx — 加标签列 + 筛选下拉
- **DB 迁移**:
  - 新建 Tag 表：id, name, type (SUBJECT|KNOWLEDGE_POINT|ERROR_REASON), userId, createdAt
  - 新建 ProblemTag 表：problemId, tagId 联合主键