## ADDED Requirements

### Requirement: OCR 任务投递
系统 SHALL 在图片上传成功后自动向 BullMQ 队列 `ocr-queue` 投递一个 OCR 识别任务，任务数据包含 imageKey 和 bucket 名称。

#### Scenario: 上传后自动投递
- **WHEN** 图片成功上传到 MinIO 并获得 imageKey
- **THEN** 系统自动向 `ocr-queue` 投递任务（job data: `{ imageKey, bucket }`），前端显示「OCR 识别中」状态

#### Scenario: BullMQ 投递失败
- **WHEN** Redis 不可用导致 BullMQ 任务投递失败
- **THEN** 系统记录错误日志，前端显示「OCR 任务发起失败，可手动输入」提示，不阻塞表单使用

### Requirement: OCR Worker 识别
OCR Worker SHALL 消费 BullMQ 队列中的任务，从 MinIO 下载对应图片，使用 PaddleOCR 进行文本识别，将识别结果写回 Redis。

#### Scenario: 识别成功
- **WHEN** OCR Worker 成功消费任务并完成 PaddleOCR 推理
- **THEN** Worker 将识别结果 JSON（`{ content, answer, status }`）写入 Redis key `ocr-result:{imageKey}`，设置 TTL 为 10 分钟

#### Scenario: 识别失败
- **WHEN** PaddleOCR 推理失败（如图片损坏、无法解析）
- **THEN** Worker 写入 Redis `{ status: 'failed', error: '<message>' }`，前端显示「OCR 识别失败」

#### Scenario: Worker 重试耗尽
- **WHEN** OCR 任务连续失败超过 3 次（BullMQ 重试机制）
- **THEN** Worker 将任务标记为 failed，写入 Redis `{ status: 'failed', error: '重试耗尽' }`

### Requirement: OCR 结果轮询
系统 SHALL 提供 API 端点供前端轮询 OCR 识别结果，基于 imageKey 查询 Redis 中存储的 OCR 结果。

#### Scenario: 轮询返回结果
- **WHEN** 客户端请求 `GET /api/ocr/result?imageKey=xxx` 且 Redis 中存在对应结果
- **THEN** 返回 JSON `{ status: 'completed', content, answer }`，前端自动填入表单字段

#### Scenario: 轮询中任务仍在处理
- **WHEN** 客户端轮询时 Redis 中尚不存在对应结果
- **THEN** 返回 JSON `{ status: 'processing' }`，前端继续轮询

#### Scenario: 轮询超时处理
- **WHEN** 轮询超过 30 秒仍未获得结果
- **THEN** 前端停止轮询，显示「OCR 超时，请手动输入」提示

### Requirement: OCR 结果回填
系统 SHALL 在轮询到 OCR 识别结果后，自动将识别文本填入录入表单的 content 和 answer 字段，用户可手动修正。

#### Scenario: 自动填入 content 和 answer
- **WHEN** 客户端收到 `{ status: 'completed', content: '求解方程...', answer: 'x=1' }`
- **THEN** 表单的 content 域填入「求解方程...」，answer 域填入「x=1」，用户可以在提交前修改

#### Scenario: OCR 仅识别出 content
- **WHEN** OCR 结果仅包含 content 字段（answer 为空）
- **THEN** 系统仅填入 content 字段，answer 字段保持空白，用户手动填写 answer 后提交