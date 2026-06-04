## MODIFIED Requirements

### Requirement: OCR 识别调用
系统 SHALL 在图片上传到 MinIO 成功后同步调用百度云通用文字识别 API，将识别文本返回给前端填入表单。

#### Scenario: 识别成功
- **WHEN** 图片成功上传到 MinIO
- **THEN** 系统调用百度云 OCR API，返回识别文本；前端自动填入 content 字段，用户可修正后提交

#### Scenario: 识别仅返回部分文本
- **WHEN** 百度 API 返回的识别结果仅包含 text 无结构化字段
- **THEN** 系统将所有识别文本填入 content 字段，answer 字段保持空白，用户手动填写

#### Scenario: API 不可用降级
- **WHEN** 百度 API 返回错误（超时、Key 无效、额度耗尽）
- **THEN** 系统静默返回 `ocrContent: null`，前端不显示 OCR 结果，用户可正常手动录入

### Requirement: OCR 结果直接返回
系统 SHALL 在图片上传的 API 响应中直接携带 OCR 识别结果，前端无需额外轮询。

#### Scenario: 同步返回识别文本
- **WHEN** 客户端 POST `/api/upload` 上传图片
- **THEN** 返回 JSON `{ imageKey, ocrContent: "识别文本..." }`，前端立即用 `setValue` 填入 content

#### Scenario: OCR 超时不阻塞
- **WHEN** 百度 API 调用超过 5 秒未响应
- **THEN** 上传接口仍正常返回 `{ imageKey }`（不带 ocrContent），不阻塞表单提交

## REMOVED Requirements

### Requirement: OCR 任务投递
原 spec 中 BullMQ 任务投递逻辑移除。

**Reason**：百度 API 同步调用替代异步队列。

**Migration**：删除 `ocr-queue.ts`，队列不再使用。

### Requirement: OCR Worker 识别
原 spec 中 Python Worker + PaddleOCR 识别逻辑移除。

**Reason**：本地 PaddleOCR 替换为百度云端 API。

**Migration**：删除 `workers/ocr/` 及 `Dockerfile.ocr`。

### Requirement: OCR 结果轮询
原 spec 中客户端轮询 `/api/ocr/result` 的逻辑移除。

**Reason**：同步调用一次返回，无需轮询。

**Migration**：删除 `/api/ocr/result` 路由；前端删除 `useOcrPolling` hook。

### Requirement: OCR 结果回填
原 spec 的回填逻辑保留，但触发方式从"轮询成功后填入"改为"上传响应中直接填入"。功能行为不变。