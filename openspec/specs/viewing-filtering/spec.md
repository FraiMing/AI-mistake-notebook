# Viewing & Filtering

## Purpose

题目查看与筛选系统 —— 允许用户按学科、知识点、错因三种标签类型组合筛选题目，以时间轴分组展示。API 和 Store 预留 zone 字段，为第八步分区 Tab 切换做好准备。

## Requirements

### Requirement: 时间轴分组展示
系统 SHALL 在题目列表页按日期分组展示题目：同一天录入的多道题折叠在同一日期标题下，按日期倒序排列，最新日期在最上方。每个日期标题显示日期文本和当日题数。

#### Scenario: 同日多题折叠
- **WHEN** 用户在同一天录入了 3 道题，另一个较早日期录入了 2 道题
- **THEN** 列表页显示两个日期分组，最新日期在上方
- **AND** 最新日期标题为"2026年6月4日 · 3 题"，较早日期标题为"2026年6月3日 · 2 题"

#### Scenario: 单日单题
- **WHEN** 用户今天只录入了 1 道题
- **THEN** 列表页显示一个日期分组，日期标题题数为 1

#### Scenario: 日期分组按时间倒序
- **WHEN** 用户有分布在 3 个不同日期的题目
- **THEN** 3 个日期组按日期从新到旧排列

#### Scenario: 空列表
- **WHEN** 用户没有任何题目（或筛选结果为空）
- **THEN** 列表显示空状态提示"没有找到匹配的错题"

### Requirement: 跨类型标签组合筛选
系统 SHALL 在题目列表页提供按 SUBJECT、KNOWLEDGE_POINT、ERROR_REASON 三种标签类型组合筛选的功能，多个筛选条件之间为 AND 逻辑。筛选条件通过 Zustand store 管理，API 接收 tagIds 查询参数。

#### Scenario: 单一类型筛选
- **WHEN** 用户在筛选区选择"学科=数学"
- **THEN** 列表仅显示包含"数学"标签的题目，按时间轴分组

#### Scenario: 跨类型 AND 筛选
- **WHEN** 用户同时选择"学科=数学"和"错因=粗心计算"
- **THEN** 列表仅显示同时包含两个标签的题目

#### Scenario: 清除筛选
- **WHEN** 用户点击"清除筛选"按钮
- **THEN** 恢复显示全部题目

#### Scenario: 无匹配结果
- **WHEN** 筛选条件无任何题目匹配
- **THEN** 页面显示空状态"没有找到匹配的错题"

### Requirement: Zone 字段预留
系统 SHALL 在 Zustand store 和 API 路由中预留 zone 字段（TEMPORARY/ARCHIVED），当前默认不传 zone 参数（返回全部），为第八步分区 Tab 切换做好准备。

#### Scenario: Store zone 字段初始值
- **WHEN** 页面首次加载
- **THEN** tag-filter-store 的 zone 字段为 undefined（表示不筛选 zone）

#### Scenario: API 不传 zone 时返回全部
- **WHEN** 页面请求 /api/problems 不传 zone 参数
- **THEN** API 返回所有 zone 的题目

#### Scenario: API 传 zone 时按 zone 筛选
- **WHEN** 页面请求 /api/problems?zone=TEMPORARY
- **THEN** API 仅返回 zone='TEMPORARY' 的题目
