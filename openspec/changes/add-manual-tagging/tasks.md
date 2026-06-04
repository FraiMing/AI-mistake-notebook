## 1. DB Schema + 迁移

- [x] 1.1 在 drizzle/schema.ts 新增 	ags 表和 problemTags 关联表
- [x] 1.2 运行 drizzle-kit push 生成迁移并验证两表存在
- [x] 1.3 从 @ai-notebook/database 导出新表

## 2. Tag CRUD Server Actions

- [x] 2.1 新建 pps/web/src/lib/tag-actions.ts：createTag(name, type)（同名同 type 拒绝）、updateTag(id, name)、deleteTag(id)（级联删除 ProblemTag）
- [x] 2.2 所有 Tag Action 通过 uth() 获取 userId，仅操作当前用户的标签

## 3. ProblemTag Server Actions

- [x] 3.1 在 	ag-actions.ts 中实现 ddProblemTags(problemId, tagIds) 和 emoveProblemTags(problemId, tagIds)
- [x] 3.2 修改 createProblem Server Action，支持传入 	agIds 并在插入后自动关联

## 4. 标签管理页面

- [x] 4.1 新建 pps/web/src/components/tags/tag-manager.tsx：按 type 分组列出已有标签，每个标签旁有编辑/删除按钮
- [x] 4.2 新建 pps/web/src/app/(protected)/tags/page.tsx：渲染 TagManager，页面标题"标签管理"
- [x] 4.3 侧边栏新增"标签管理"入口

## 5. 标签选择器

- [x] 5.1 新建 pps/web/src/components/tags/tag-selector.tsx：弹出面板，按 type 三组展示可选标签，支持多选
- [x] 5.2 嵌入 ProblemForm：在 content/answer 字段下方新增标签选择区域，提交时附带 tagIds
- [x] 5.3 已有题目不修改录入页不做回填（后续步骤再加）

## 6. Zustand Store

- [x] 6.1 新建 pps/web/src/stores/tag-filter-store.ts：管理三个 type 的选中 tagId 列表
- [x] 6.2 筛选下拉读取 store 状态，选择标签时更新 store，触发 TanStack Query refetch

## 7. 列表筛选

- [x] 7.1 修改 GET /api/problems 支持 ?tagIds=1,2&logic=AND 查询参数
- [x] 7.2 新建列表页筛选 UI：三个下拉按钮（学科/知识点/错因），每个显示该 type 的标签列表
- [x] 7.3 列表页显示每道题的标签名（用 Chip/Badge 展示）
- [x] 7.4 筛选 AND 逻辑：选中多个 tag 时仅返回同时满足的题目
- [x] 7.5 "清除筛选"按钮还原全部题目，无匹配时空状态"没有找到匹配的错题"
- [x] 7.6 无标签题在筛选状态下不出现在结果中

## 8. 测试

- [x] 8.1 Vitest：Tag CRUD Server Action 4 场景（创建成功/缺 type/重名拒绝/删除）
- [x] 8.2 Vitest：ProblemTag 关联成功/移除两场景
- [x] 8.3 Playwright E2E：创建标签 → 录题打标 → 筛选，1 条用例