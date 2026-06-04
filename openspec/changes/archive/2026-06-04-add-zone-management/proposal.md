## Why

当前所有题目混在一个列表，没有"今天刚录的题"和"已复习过的题"的区分。PRD 设计的暂存区/归纳区分流机制（第八步）将新题目归入暂存区（上限 50 题），复习完成后迁入归纳区。第七步已在 Store 和 API 中预留了 zone 字段，DB 的 Problem.zone 字段也已存在（默认 TEMPORARY）。

第八步通过 Tab 切换激活 zone 筛选，配合容量提示，让用户自然感知"需要先复习才能继续录题"的约束。

## What Changes

- **激活** zone 筛选：列表页新增"暂存区 / 归纳区"Tab 切换，调用 Store 的 setZone，API 传入 ?zone= 参数
- **新增** 暂存区容量提示：当暂存区 ≥50 题时，Tab 旁显示"暂存区已满 (N/50)，请先复习"提示
- **预留** markReviewed Action：Server Action 骨架，接收 problemId 并更新 zone=ARCHIVED（第十步复习闭环调用）
- **修改** 列表页 title：Tab 切换时动态显示"暂存区 (N)"或"归纳区 (N)"

## Capabilities

### New Capabilities
- zone-management: 暂存区/归纳区双区 Tab 切换，容量限制提示，预留迁移接口

## Impact

- 新建: apps/web/src/lib/zone-actions.ts（markReviewed 骨架）
- 新建: openspec/specs/zone-management/spec.md
- 修改: apps/web/src/app/(protected)/problems/page.tsx（加 Tab + 容量提示）
- 调用: tag-filter-store.ts 的 setZone（第七步已实现）
- 调用: /api/problems?zone=（第七步已实现）
