## 1. TimelineGroup 组件

- [x] 1.1 新建 apps/web/src/components/problems/timeline-group.tsx
  - 泛型组件 TimelineGroup<T>
  - Props: items, getDate, renderItem, emptyMessage
  - 内部按日期分组（Map<dateKey, T[]>），日期倒序
  - 每组渲染日期标题（中文格式） + 题数徽章
  - 空状态渲染 emptyMessage

## 2. Zustand Store zone 预留

- [x] 2.1 修改 apps/web/src/stores/tag-filter-store.ts
  - 新增 zone?: 'TEMPORARY' | 'ARCHIVED' 字段，默认 undefined
  - 新增 setZone action
  - 不影响现有 selectedTagIds / setTagFilter / clearFilters
  - 加 TODO 注释标记第八步启用

## 3. API zone 参数支持

- [x] 3.1 修改 apps/web/src/app/api/problems/route.ts
  - 接收可选 ?zone= 查询参数
  - 传 zone 时按 problems.zone 列过滤
  - 不传 zone 时返回全部（向后兼容）

## 4. 列表页替换为时间轴

- [x] 4.1 修改 apps/web/src/app/(protected)/problems/page.tsx
  - 保留筛选区（三标签下拉 + 清除筛选按钮）不变
  - 列表区改用 <TimelineGroup> 组件
  - 传入空状态提示
  - 不启用 zone Tab（第八步）
  - queryKey 包含 zone（预备第八步自动 refetch）

## 5. 测试

- [x] 5.1 Vitest：TimelineGroup 分组逻辑测试（5 用例：同日折叠/空数组/单日/日期key/跨月）
- [x] 5.2 Vitest：日期格式化测试（3 用例：标准/月初月末/两位数月份）
- [x] 5.3 Vitest：zone store 行为测试（4 用例：初始值/setZone/clearZone/不影响筛选）
- [x] 5.4 全量回归：59 tests passed, 7 files
