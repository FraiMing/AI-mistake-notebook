## Why

用户在录入错题时，当前只能手动打字输入题目内容和错误作答。对于手写批改、印刷试卷等场景，手动录入效率低下，且容易丢失题目格式（如公式、图表）。通过拍照上传 + OCR 识别自动填入文本，可以大幅降低录入门槛，让错题本真正成为「即拍即录」的工具。

## What Changes

- 录入表单增加图片上传区域，支持拍照和从相册选取
- 上传图片存储到 MinIO（对象存储），返回唯一 imageKey 关联到题目
- 上传完成后自动触发 OCR 识别任务（通过 BullMQ 投递到 ocr-worker）
- OCR 识别结果自动回填到题目内容和错误作答字段（用户可手动修正）
- 题目列表页展示与题目关联的图片缩略图
- 题目详情/查看页支持放大查看原图
- 移除 problem-entry spec 中「表单不暴露 imageKey」的限制

## Capabilities

### New Capabilities
- `photo-upload`: 图片上传能力 — 用户拍照或选取图片，上传至 MinIO 并获得存储key
- `photo-ocr`: 图片 OCR 识别 — 异步调用 PaddleOCR 提取题目图片中的文本和公式
- `photo-display`: 图片展示能力 — 在题目列表和详情页中查看关联图片

### Modified Capabilities
- `problem-entry`: 移除「表单不暴露 imageKey」限制；录入表单增加图片上传区域作为可选的替代录入方式

## Impact

- **前端** `apps/web/src/components/problems/problem-form.tsx` — 增加图片上传 UI
- **前端** `apps/web/src/app/(protected)/problems/page.tsx` — 列表卡片增加缩略图
- **Server Actions** `apps/web/src/lib/problem-actions.ts` — 增加图片上传、OCR 任务投递逻辑
- **新增** `apps/web/src/lib/minio-client.ts` — MinIO SDK 封装（上传、生成访问 URL）
- **新增** `apps/web/src/lib/ocr-queue.ts` — BullMQ 生产者（投递 OCR 任务）
- **OCR Worker** `workers/ocr/` — 完善 BullMQ 消费者逻辑，集成 PaddleOCR 实际推理
- **依赖** npm 包新增：`minio`（MinIO SDK）、`bullmq`（BullMQ 客户端）
- **依赖** Python 包新增：Python BullMQ 消费者、`paddleocr`、`paddlepaddle-gpu`