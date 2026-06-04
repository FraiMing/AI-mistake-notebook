## Context

当前状态：
- `problems` 表已有 `imageKey` 字段（nullable text），但未在任何 UI 或业务逻辑中使用
- `problem-entry` spec 明确要求「表单不暴露 imageKey」，图片上传功能尚未实现
- OCR Worker 仅为占位脚本（idle loop），BullMQ 生产者和消费者均未集成
- MinIO 服务已在 docker-compose 中配置并运行，但 web 端无 MinIO SDK 调用
- DeepSeek-V4 API 封装（ai-client）已就绪但仅为基础，本变更不涉及 AI 调用
- 手机端（Tauri）暂未启动，本变更聚焦 Web 端但需考虑未来 WebView 复用

约束：
- 数据库使用 SQLite（sql.js），写入需显式调用 `saveDb()`
- Server Actions 为 Next.js 服务端逻辑入口
- 图片文件不落盘到 app 容器内，统一存 MinIO
- OCR 任务是异步的，不能阻塞 HTTP 响应

## Goals / Non-Goals

**Goals：**
- 在录入表单中增加可选的图片上传入口，支持拍照和相册选取
- 上传图片到 MinIO，获得唯一 key 关联题目
- 上传后自动触发 BullMQ OCR 异步任务
- OCR 完成后，识别结果通过轮询或回调回填到表单（用户可修改后提交）
- 题目列表页展示关联图片的缩略图
- 题目详情页支持放大查看原图
- 更新 problem-entry spec，移除「表单不暴露 imageKey」限制

**Non-Goals：**
- 图片编辑/裁剪功能（后续迭代）
- OCR 识别结果的 AI 结构化（如自动分离题目 vs 答案、自动标注知识点 — 后续由 DeepSeek-V4 标签识别能力处理）
- 手机端原生相机调用（Tauri 开发时再适配）
- OCR 结果的热词/公式渲染（纯文本存储，格式渲染后续迭代）
- 批量导入（本变更仅处理单张图片录入）

## Decisions

### D1: 图片上传时机 — 表单提交前上传（非随题目一起提交）

**决定**：用户在录入页选图后立即上传到 MinIO，获得 `imageKey`，OCR 任务同步投递。用户手动填写/修正文本字段后再提交整个表单（content + answer + imageKey + tags）。

**理由**：
- OCR 是异步任务，如果在表单提交时才上传，用户需要等待 OCR 结果才能看到自动填入效果
- 提前上传让用户可以在图片上传后立即看到 OCR 识别中的状态，然后 OCR 完成后自动填入，给用户修正时间
- 即使 OCR 失败或超时，用户仍可手动输入并提交，图片已存储不会丢失

**替代方案**：表单提交时一起上传。被拒绝原因 — OCR 是异步的，提交时无法立即获得识别结果，用户体验差。

### D2: OCR 结果回填方式 — 客户端轮询

**决定**：客户端通过一个 API 端点轮询 OCR 结果（基于 `imageKey` 查询 OCR 状态和结果），收到结果后将文本回填到表单字段。OCR Worker 完成后将结果写入 Redis，web 端 API 查询 Redis 返回。

**理由**：
- WebSocket/SSE 在 Next.js 中实现复杂，且当前无实时推送基础设施
- 轮询实现简单，OCR 通常在 3-10 秒内完成，轮询间隔 1-2 秒即可
- 不存在设备级推送要求，符合 AGENTS.md 中的「不做设备级推送」约定
- 轮询状态通过 TanStack Query 管理，与现有模式一致

**替代方案**：BullMQ Job 完成后通过回调通知前端。被拒绝原因 — 需要 WebSocket 基础设施，与当前「不做设备级推送」的方向相反。

### D3: MinIO 图片访问 — 服务端生成预签名 URL

**决定**：图片不公开访问，由服务端 API 根据 `imageKey` 生成带过期时间的 MinIO 预签名 URL 返回给前端渲染。列表页使用短过期（5 分钟），详情页使用短过期（5 分钟），前端按需重新请求。

**理由**：
- 用户错题图片属于隐私数据，不应通过公开 URL 暴露
- 预签名 URL 是 MinIO 标准安全机制，无需额外认证层
- 前端通过 API（如 `/api/images/{imageKey}`）获取 URL，对手机端 WebView 同样适用

**替代方案**：MinIO bucket 设为 public-read。被拒绝原因 — 隐私考虑，任何知道 URL 的人可访问图片。

### D4: OCR Worker 架构 — BullMQ + PaddleOCR 直接推理

**决定**：OCR Worker 使用 BullMQ Python 客户端消费 Redis 任务，调用 PaddleOCR 本地推理，结果写回 Redis（key: `ocr-result:{imageKey}`）。

**理由**：
- BullMQ 已在技术栈中声明，Redis 已配置
- PaddleOCR 本地 GPU 推理符合 AGENTS.md 声明，延迟低
- 通过 Redis 回写结果与 web 端轮询 API 呼应，架构简洁统一
- Python worker 独立于 pnpm workspace，符合边界纪律

**替代方案**：
- DeepSeek-V4 视觉模型做 OCR。被拒绝 — 成本高、延迟不确定，且题目图片可能包含手写字体需要专用 OCR
- 通过 HTTP 调用 OCR。被拒绝 — BullMQ 提供更好的重试、延迟、优先级管理

### D5: 缩略图生成 — 前端 CSS 控制 + 原图加载

**决定**：不服务端生成缩略图，前端使用 `<img>` 标签加载原图并通过 CSS `object-fit: cover` + 固定尺寸容器显示缩略图。浏览器缓存图片自然避免重复加载。

**理由**：
- 简化后端逻辑，不需要缩略图生成管道
- 题目列表每页通常不超过 20 条，原图加载性能可接受
- 后续如需性能优化可改为服务端生成缩略图，当前快速交付优先

## Risks / Trade-offs

- **[图片过大]** 用户上传高分辨率照片（>10MB）可能导致上传慢、OCR 推理慢 → Mitigation：前端限制文件大小（最大 10MB），压缩至 2048px 宽以内后再上传（使用 Canvas API 前端压缩）
- **[OCR 识别不准]** PaddleOCR 对手写体、复杂公式识别率有限 → Mitigation：用户始终可以手动修正识别结果，OCR 仅作为效率工具；后续可通过 AI 模型增强
- **[OCR Worker 故障]** Worker 崩溃后任务丢失 → Mitigation：BullMQ 内置重试机制（最多 3 次），3 次后标记失败；用户界面显示 OCR 失败提示，不影响手动录入
- **[Redis 数据膨胀]** OCR 结果文本存储在 Redis 中 → Mitigation：设置 TTL（10 分钟），过期自动清除
- **[MinIO 单点故障]** MinIO 不可用时图片无法上传 → Mitigation：MinIO 是基础设施，已通过 Docker Compose 管理；安装脚本保证 MinIO bucket 自动创建