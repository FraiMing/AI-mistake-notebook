## 1. UI —— 分区 Tab 切换

- [ ] 1.1 修改 apps/web/src/app/(protected)/problems/page.tsx
  - 标题下方新增"暂存区 / 归纳区"Tab 切换（原生 button + 选中态样式）
  - 点击 Tab 调用 setZone，zone=undefined 表示暂存区（API 传 zone=TEMPORARY）
  - zone='ARCHIVED' 时传参给 API
  - queryKey 包含 zone 以触发 TanStack Query refetch
  - 列表区 TimelineGroup 不变

## 2. UI —— 暂存区容量提示

- [ ] 2.1 暂存区 Tab 选中时，若问题数 >= 50，显示容量提示
  - 文案："暂存区已满 (N/50)，请先复习清空后再录入新题"
  - 样式：amber 警告条
  - 归纳区无容量限制

## 3. Server Action —— markReviewed 骨架

- [ ] 3.1 新建 apps/web/src/lib/zone-actions.ts
  - markReviewed(problemId) → UPDATE zone=ARCHIVED
  - 加 TODO 注释标记第十步调用

## 4. API zone 逻辑微调

- [ ] 4.1 前端显式传 zone 参数：暂存区传 zone=TEMPORARY，归纳区传 zone=ARCHIVED
  - 不再依赖"不传 zone 即全部"的向后兼容行为

## 5. 测试

- [ ] 5.1 Vitest：markReviewed 纯逻辑测试
- [ ] 5.2 全量回归测试无断裂
