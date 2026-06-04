## ADDED Requirements

### Requirement: 列表缩略图展示
系统 SHALL 在题目列表卡片中，对有 `imageKey` 的题目展示关联图片的缩略图。

#### Scenario: 有图片的题目展示缩略图
- **WHEN** 用户在 /problems 列表页查看一道 `imageKey` 不为 null 的题目卡片
- **THEN** 卡片左侧显示该题目的图片缩略图（通过预签名 URL 加载，尺寸 72x72px，`object-fit: cover`）

#### Scenario: 无图片的题目不占位
- **WHEN** 一道题目的 `imageKey` 为 null
- **THEN** 卡片不显示缩略图占位符，布局与当前列表页一致

#### Scenario: 多题缩略图性能
- **WHEN** 列表页同时展示超过 10 道有图片的题目
- **THEN** 所有缩略图正常加载，页面不出现明显卡顿

### Requirement: 图片详情查看
系统 SHALL 支持在题目查看/详情页放大查看原图。

#### Scenario: 点击缩略图放大
- **WHEN** 用户在列表页点击某题的缩略图
- **THEN** 系统弹出或展开覆盖层，以较大尺寸显示原图

#### Scenario: 关闭放大视图
- **WHEN** 用户在放大视图中点击关闭按钮或遮罩区域
- **THEN** 系统关闭放大视图，返回列表页

#### Scenario: 图片不存在
- **WHEN** 用户尝试查看因 MinIO 对象被删除而找不到的图片
- **THEN** 系统显示「图片不存在」占位提示，不报错崩溃

### Requirement: 预签名 URL 生成
系统 SHALL 提供 `GET /api/images/{imageKey}` API 端点，根据 imageKey 生成 MinIO 预签名 URL 并返回给前端。

#### Scenario: 成功生成 URL
- **WHEN** 客户端请求 `/api/images/xxx` 且 MinIO 中存在对应对象
- **THEN** 返回 JSON `{ url: "http://minio:9000/...?X-Amz-..." }`，预签名 URL 有效期为 5 分钟

#### Scenario: 对象不存在
- **WHEN** 客户端请求的 imageKey 在 MinIO 中不存在
- **THEN** 返回 404 `{ error: "图片不存在" }`

#### Scenario: 不登录拒绝
- **WHEN** 未登录用户请求图片 URL
- **THEN** 返回 401，不暴露任何图片信息