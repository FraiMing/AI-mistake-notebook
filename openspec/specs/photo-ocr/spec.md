# Photo OCR

## Purpose

图片 OCR 识别能力 — 用户拍照上传题目图片后，系统调用百度云文字识别 API 自动提取图片中的文字，填入录入表单。OCR 为辅助功能，不可用时不影响手动录入。

## Requirements

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

### Requirement: OCR 结果回填
系统 SHALL 在上传 API 返回 OCR 识别结果后，前端自动将识别文本填入录入表单的 content 字段，用户可手动修正。

#### Scenario: 自动填入 content
- **WHEN** 客户端收到 `{ imageKey, ocrContent: "求解方程..." }`
- **THEN** 表单的 content 域填入「求解方程...」，用户可以在提交前修改

#### Scenario: OCR 结果为空
- **WHEN** 百度 API 返回空识别结果（图片无可识别文字）
- **THEN** content 和 answer 保持空白，不自动填入