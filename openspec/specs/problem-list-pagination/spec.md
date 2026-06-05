# Problem List Pagination

## Purpose

题目列表 "加载更多" 分页 — API 接受 `page`/`limit` 参数分页返回，前端通过 `useRef` 累加多页 + 加载更多按钮。每页 20 题，暂存区/归纳区均适用。筛选/分区切换自动重置分页。

## Requirements

### Requirement: 题目列表分页 API

系统 SHALL 在 `GET /api/problems` 接受可选 `page`（默认 1）和 `limit`（默认 20）查询参数，返回 `{ items, total, page, limit }` JSON 结构。无参数时保持向后兼容返回全量数据。

#### Scenario: 带分页参数请求
- **WHEN** 客户端请求 `GET /api/problems?page=1&limit=20`
- **THEN** 返回 JSON `{ items: [...20题], total: 31, page: 1, limit: 20 }`

#### Scenario: 无参数请求保持兼容
- **WHEN** 客户端请求 `GET /api/problems` 不带分页参数
- **THEN** 返回全量题目数组（现有行为不变）

#### Scenario: 筛选与分页组合
- **WHEN** 客户端请求 `GET /api/problems?zone=TEMPORARY&page=2&limit=10`
- **THEN** 返回暂存区第 11-20 题

### Requirement: 加载更多 UI

系统 SHALL 在题目列表底部展示"加载更多"按钮，点击后追加下一页数据。全部加载完成后按钮消失，替换为"已显示全部 X 题"提示。

#### Scenario: 未满一页不显示按钮
- **WHEN** 列表数据 total ≤ limit（首次加载已完整）
- **THEN** 不展示"加载更多"按钮

#### Scenario: 加载中状态
- **WHEN** 用户点击"加载更多"
- **THEN** 按钮变为 "加载中..." 禁用态，请求完成后恢复

#### Scenario: 全部加载完成
- **WHEN** 用户加载到最后一页
- **THEN** "加载更多"按钮消失，显示 "已显示全部 X 题"
