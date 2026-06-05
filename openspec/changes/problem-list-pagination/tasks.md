## 1. API 分页

- [x] 1.1 修改 `GET /api/problems`：接受 `page`(`?page=1`)和 `limit`(`?limit=20`)参数，返回 `{ items, total, page, limit }`
- [x] 1.2 向后兼容：无 `page` 参数时不启用分页，返回全量
- [x] 1.3 zone/tagIds 筛选与分页共存：先筛选再分页

## 2. 前端分页状态

- [x] 2.1 `ProblemsPage` 新增 `page` state（初始 1）
- [x] 2.2 `useQuery` queryKey 加入 `page`，请求 API 时传分页参数
- [x] 2.3 用 `useRef` 累加多页数据，传给 `TimelineGroup`
- [x] 2.4 当 zone/tagIds 变化时，重置 `page=1`，清空累积数据

## 3. 加载更多 UI

- [x] 3.1 在 `TimelineGroup` 下方添加"加载更多"按钮（仅总条数超出时显示）
- [x] 3.2 加载中状态："加载中..." + disabled
- [x] 3.3 全部加载完成："已显示全部 X 题"文本

## 4. E2E

- [ ] 4.1 在 `problem-entry.spec.ts` 中增加分页测试：连续录入 21 题 → 验证首次只显示 20 题 + 加载更多可见 → 点击加载更多 → 第 21 题出现、按钮消失
