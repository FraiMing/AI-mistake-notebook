# SQL WHERE Filtering

## Purpose

将数据库查询的过滤逻辑从 JavaScript 内存过滤（`.all().filter()`）迁移至 SQL WHERE 子句，利用 SQLite 引擎在数据库端完成筛选、排序和分页，降低内存占用并提高查询效率。

## Requirements

### Requirement: 数据查询使用 SQL WHERE 过滤
系统 SHALL 在所有数据查询 API 中使用 Drizzle 的 `where(eq(column, value))` 替代 `.all().filter(predicate)` 模式，将过滤逻辑推送至 SQLite 引擎执行。

#### Scenario: 按用户 ID 过滤题目列表
- **WHEN** GET `/api/problems` 被调用且用户已认证
- **THEN** 系统使用 `where(eq(problems.userId, userId))` 构建 SQL 查询，仅返回当前用户的题目

#### Scenario: 按专区过滤题目
- **WHEN** GET `/api/problems?zone=TEMPORARY` 被调用
- **THEN** 系统在 WHERE 子句中同时过滤 `userId` 和 `zone` 字段

### Requirement: 分页使用 SQL LIMIT/OFFSET
系统 SHALL 使用 Drizzle 的 `.limit()` 和 `.offset()` 实现分页，替代内存 `Array.slice()`。

#### Scenario: 分页获取题目列表
- **WHEN** GET `/api/problems?page=2&limit=20` 被调用
- **THEN** 系统执行 `where(eq(userId, ...)).limit(20).offset(20).all()`，仅返回第 21-40 条记录

#### Scenario: 分页结果包含总数
- **WHEN** 分页查询执行完成
- **THEN** 系统在响应中返回 `total`（全量匹配记录数）、`page`、`limit` 字段

### Requirement: 插入操作使用 returning 获取新 ID
系统 SHALL 使用 Drizzle 的 `.returning()` 方法获取插入后的记录 ID，替代 `Math.max(allP.map(p => p.id))` 的间接方式。

#### Scenario: 保存题目后获取 ID
- **WHEN** 新题目被插入 problems 表
- **THEN** 系统通过 `.returning({ id: problems.id })` 直接获取新记录的主键

### Requirement: 标签关联查询使用 IN 集合过滤
系统 SHALL 在获取题目标签时，先用 SQL 过滤 `problemTags` 表再查 `tags` 表，使用 `inArray()` 操作符批量获取关联标签。

#### Scenario: 获取题目关联标签
- **WHEN** 查询指定题目的标签列表
- **THEN** 系统使用 `where(eq(problemTags.problemId, problemId))` 筛选关联记录，再用 `where(inArray(tags.id, tagIds))` 批量获取标签