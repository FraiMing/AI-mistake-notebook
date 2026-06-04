## 1. 百度 OCR API 封装

- [x] 1.1 创建 `apps/web/src/lib/baidu-ocr.ts`：实现 `getAccessToken()`（OAuth2，缓存 30 天）和 `recognizeText(imageBase64: string)` 函数
- [x] 1.2 实现百度 API 调用：POST `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic`，带 access_token，接收 Base64 图片 JSON 响应
- [x] 1.3 处理异常：超时（AbortController 5s）、API 错误响应、网络异常 → 统一返回 `{ text: string | null, error?: string }`

## 2. 环境变量

- [x] 2.1 在 `apps/web/src/lib/env.ts` 的 Zod schema 中新增 `BAIDU_OCR_API_KEY`、`BAIDU_OCR_SECRET_KEY`（可选字段，缺失时 OCR 降级）
- [x] 2.2 `.env.example` 已包含百度 API 变量（前置文档变更已完成）

## 3. 上传 API 改造

- [x] 3.1 修改 `apps/web/src/app/api/upload/route.ts`：MinIO 上传成功后同步调用 `recognizeText()`，返回 `{ imageKey, ocrContent }`
- [x] 3.2 百度 API 调用失败时静默降级，仍返回 `{ imageKey }`（不带 ocrContent），HTTP 200

## 4. 前端简化

- [x] 4.1 修改 `apps/web/src/components/problems/problem-form.tsx`：删除 `useOcrPolling` hook 及轮询相关 state
- [x] 4.2 `handleFileSelect` 中上传返回后直接从 `data.ocrContent` 取结果并 setValue 填入 content
- [x] 4.3 保留上传中的 spinner 状态（上传+OCR 等待），完成后展示结果或提示

## 5. 清理旧代码

- [x] 5.1 删除 `apps/web/src/lib/ocr-queue.ts`（BullMQ 生产者）
- [x] 5.2 删除 `apps/web/src/app/api/ocr/result/route.ts`（轮询端点）
- [x] 5.3 删除 `docker/Dockerfile.ocr`
- [x] 5.4 从 `apps/web/src/lib/problem-actions.ts` 中移除 `addOcrJob` 导入和调用
- [x] 5.5 `workers/ocr/` 目录代码保留不删（供参考），但在 `.dockerignore` 中不排除
- [x] 5.6 从 `apps/web/package.json` 移除 `bullmq`、`ioredis` 依赖（如不再需要）

## 6. 测试

- [x] 6.1 更新 `photo-ocr.test.ts`：用 mock 百度 API 替换原轮询逻辑测试
- [x] 6.2 新增百度 API client 单测：成功/失败/超时三场景
- [x] 6.3 更新 `photo-upload.test.ts`：验证 ocrContent 在响应中的存在/缺失

## 7. 验证

- [x] 7.1 `docker compose up` 确认仅 3 个服务（app + redis + minio），ocr-worker 不再启动
- [x] 7.2 `pnpm test` 全部通过
- [ ] 7.3 手动验证：上传含中文文字的图片 → OCR 识别成功回填 → 提交 → 列表可见