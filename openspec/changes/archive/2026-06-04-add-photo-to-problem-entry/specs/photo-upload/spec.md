## ADDED Requirements

### Requirement: 图片上传到 MinIO
系统 SHALL 允许用户在录入错题时选择图片文件（拍照或从相册选取），通过 Server Action 将图片上传至 MinIO 对象存储，并返回唯一的 imageKey。

#### Scenario: 成功上传图片
- **WHEN** 用户在录入页选择一张有效的图片文件（JPEG/PNG，不超过 10MB）
- **THEN** 系统将图片上传到 MinIO 的 `ai-notebook-images` bucket，返回格式为 `problems/{userId}/{uuid}.{ext}` 的 imageKey，前端收到 imageKey 后可展示预览

#### Scenario: 前端压缩大图
- **WHEN** 用户选择宽度超过 2048px 的图片
- **THEN** 前端在上传前将图片等比压缩至宽度不超过 2048px，压缩后文件大小不超过 5MB

#### Scenario: 文件过大被拦截
- **WHEN** 用户选择超过 10MB 的图片文件
- **THEN** 系统在客户端拦截，显示「图片大小不能超过 10MB」提示，不发起上传请求

#### Scenario: 文件格式不支持
- **WHEN** 用户选择非 JPEG/PNG 格式的文件（如 GIF、BMP、WebP 等）
- **THEN** 系统在客户端拦截，显示「仅支持 JPG 和 PNG 格式」提示

#### Scenario: MinIO 不可用
- **WHEN** MinIO 服务不可用导致上传失败
- **THEN** 系统返回错误提示「图片上传失败，请稍后重试」，不阻塞用户手动输入文本并提交

### Requirement: 图片预览
系统 SHALL 在上传成功后，在录入表单中展示已上传图片的预览缩略图。

#### Scenario: 上传后展示预览
- **WHEN** 用户成功上传图片并获得 imageKey
- **THEN** 表单中显示该图片的缩略图（通过预签名 URL），尺寸不超过 200x200px

#### Scenario: 预览替换
- **WHEN** 用户已上传一张图片后又选择新的图片上传
- **THEN** 系统替换旧的 imageKey 和预览为新图片

#### Scenario: 无图片可正常提交
- **WHEN** 用户未上传任何图片但填写了 content 和 answer 并提交
- **THEN** 系统正常保存题目，imageKey 字段为 null

### Requirement: 表单提交附带 imageKey
系统 SHALL 在用户提交录入表单时将已上传的 imageKey 随 content 和 answer 一起保存到 Problem 记录。

#### Scenario: 附带 imageKey 提交
- **WHEN** 用户上传图片后填写 content 和 answer 并提交
- **THEN** 系统将 imageKey 写入 Problem 记录的 imageKey 字段，列表页可展示该图片

#### Scenario: 不附带 imageKey 提交
- **WHEN** 用户不上传图片直接填写 content 和 answer 并提交
- **THEN** 系统正常保存，imageKey 字段为 null