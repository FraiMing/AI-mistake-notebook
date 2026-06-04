## Why

当前 `add-photo-to-problem-entry` 使用本地 PaddleOCR + BullMQ + Redis + Python Worker 实现 OCR，需要维护一个独立容器，且 PaddleOCR 在 Docker 构建时依赖安装复杂（libGL / setuptools / albumentations 等缺失问题）、模型体积大、识别精度对中文手写体有限。换成百度云文字识别 API 可以消除整个 Worker 容器及任务队列，简化架构，同时获得更高精度的中文 OCR。

## What Changes

- **替换** OCR 后端：本地 PaddleOCR Worker → 百度云通用文字识别 API（HTTP REST）
- **移除** BullMQ 任务队列（`ocr-queue.ts`）及 OCR 结果轮询 API（`/api/ocr/result`）
- **移除** Python OCR Worker 容器（`workers/ocr/`）及 `Dockerfile.ocr`
- **新增** 百度云 API 封装模块（`lib/baidu-ocr.ts`）：OAuth 换 Token + 调用 OCR
- **简化** 上传流程：图片上传 MinIO 后同步调用百度 API，结果随响应直接返回，前端不必轮询
- **降级**：百度 API 不可用时降级为纯手动录入，不阻塞流程

## Capabilities

### Modified Capabilities
- `photo-ocr`: 将 OCR 实现从 BullMQ+PaddleOCR+轮询改为百度云 API 同步调用

### New Capabilities
- 无。仅替换已有能力的实现方式。

## Impact

- **新增** `apps/web/src/lib/baidu-ocr.ts` — 百度 API 封装
- **修改** `apps/web/src/lib/problem-actions.ts` — 加百度 API 调用，去 BullMQ 投递
- **修改** `apps/web/src/components/problems/problem-form.tsx` — 去轮询 hook，收同步结果
- **修改** `apps/web/src/app/api/upload/route.ts` — 上传后同步调 OCR
- **修改** `apps/web/src/lib/env.ts` — 加百度 API 环境变量
- **删除** `apps/web/src/lib/ocr-queue.ts` — 不再需要
- **删除** `apps/web/src/app/api/ocr/result/route.ts` — 不再需要轮询
- **删除** `docker/Dockerfile.ocr` — 不再需要 OCR Worker 容器
- **依赖** `apps/web` 无新增 npm 包（用 Node 内置 `fetch` + `crypto`）
- **环境变量** 新增 `BAIDU_OCR_API_KEY`、`BAIDU_OCR_SECRET_KEY`