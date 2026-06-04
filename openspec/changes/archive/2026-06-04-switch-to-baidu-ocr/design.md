## Context

当前 `add-photo-to-problem-entry` 的 OCR 实现依赖 4 个组件链：BullMQ 生产者 → Redis 队列 → Python OCR Worker → Redis 回写 → 前端轮询。Docker 构建中 PaddleOCR 的依赖安装持续受阻（libGL / setuptools / albumentations），不适合参赛作品的快速展示。百度云文字识别 API 免费额度充足（日 5 万次），精度更高，同步调用即可满足需求。

## Goals / Non-Goals

**Goals：**
- 将 OCR 从本地异步架构改为云端同步调用，消除 Worker 容器和消息队列
- OCR 响应时间控制在 3 秒内，用户体验与轮询方案持平
- API 调用失败时优雅降级，不阻塞手动录入

**Non-Goals：**
- 不做百度公式识别 API（后续按需升级）
- 不做题目/作答智能拆分（后续 DeepSeek 步骤处理）
- 不做 API Key 管理界面

## Decisions

### D1: 百度 API 鉴权 — OAuth2 Access Token

**决定**：使用百度云标准 OAuth2 流程，用 API Key + Secret Key 换 Access Token（有效期 30 天），带 Token 调用 OCR 接口。Token 缓存在模块内存中，过期前自动续期。

**理由**：百度云文档标准流程，无需额外依赖（Node 内置 fetch + crypto 可完成签名和请求）。

### D2: OCR 调用时机 — upload API 内部同步调用

**决定**：`POST /api/upload` 接收图片上传 MinIO 后，在同一个请求内同步调用百度 OCR API，返回 `{ imageKey, ocrContent }`。

**理由**：
- 无需 BullMQ / Redis / 轮询端点，架构极简
- 百度 API 响应一般在 1-3 秒内，上传+OCR 总耗时可接受
- 前端从"轮询等待"变为"一次性等待"，交互更简单

### D3: 降级策略 — 静默失败

**决定**：百度 API 调用失败（超时、Key 无效、额度耗尽）时，仅记录日志，返回 `ocrContent: null`，不向前端暴露错误。前端检测到 ocrContent 为空时正常展示表单，等用户手动输入。

**理由**：OCR 是辅助功能，不应该是阻塞环节。参赛评审场景下，即使 API 不可用，手动录入路径仍可完整演示。

## Risks / Trade-offs

- **[API 超时]** 网络延迟导致上传接口耗时超过 5 秒 → Mitigation：fetch 设置 5 秒超时（AbortController），超时后降级不返回OCR结果
- **[额度耗尽]** 参赛期间虽然免费额度足够，但需注意日限额 → Mitigation：降级策略已覆盖
- **[图片出站]** 用户图片会上传至百度服务器 → Mitigation：参赛作品无隐私合规要求，且 MinIO 仍保留原图