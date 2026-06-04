## 1. UI —— 分区 Tab 切换

- [x] 1.1 修改 apps/web/src/app/(protected)/problems/page.tsx
  - 标题下方新增暂存区/归纳区 Tab 切换
  - 点击 Tab 调用 setZone
  - API 显式传 zone 参数
  - queryKey 包含 zone 以触发 refetch

## 2. UI —— 暂存区容量提示

- [x] 2.1 暂存区 >= 50 题时显示 amber 警告条

## 3. Server Action —— markReviewed 骨架

- [x] 3.1 新建 apps/web/src/lib/zone-actions.ts
  - markReviewed(problemId) → UPDATE zone=ARCHIVED
  - TODO 注释标记第十步调用

## 4. API zone 逻辑微调

- [x] 4.1 前端始终传 zone 参数（TEMPORARY 或 ARCHIVED）

## 5. 测试

- [x] 5.1 zone-actions 逻辑测试（2 用例）
- [x] 5.2 全量回归：63 tests passed, 8 files
