# Problem Entry

## Purpose

题目录入能力 — 允许用户手动输入错题内容与错误作答，或通过拍照上传 + OCR 自动识别录入，并在列表页查看已录入的题目。这是整个错题本的数据入口，后续所有功能（标签、复习、推送）依赖此能力。

## Requirements

### Requirement: 手动录入题目
系统 SHALL 允许已登录用户通过表单手动录入一道错题，包含题目内容（content）和错误作答（answer）两个必填字段。

#### Scenario: 成功录入题目
- **WHEN** 用户在 /problems/new 页面填写 content="求解 x²+2x+1=0" 和 answer="x=1"
- **THEN** 系统将题目保存到数据库，自动跳转到 /problems 列表页，新题目出现在列表顶部

#### Scenario: content 为空提交
- **WHEN** 用户将 content 留空并提交表单
- **THEN** 系统在客户端拦截，显示"题目内容不能为空"提示，不发送网络请求

#### Scenario: content 超过 5000 字符
- **WHEN** 用户输入超过 5000 个字符的 content 并提交
- **THEN** 系统在客户端拦截，显示长度超限提示，不发送网络请求

#### Scenario: answer 为空提交
- **WHEN** 用户将 answer 留空并提交表单
- **THEN** 系统在客户端拦截，显示"错误作答不能为空"提示，不发送网络请求

### Requirement: 题目列表查看
系统 SHALL 在 /problems 页面展示当前用户录入的所有题目，按创建时间倒序排列。

#### Scenario: 列表为空
- **WHEN** 用户首次访问 /problems 页面且没有录入任何题目
- **THEN** 页面展示"暂无错题"空状态提示，不报错

#### Scenario: 列表有多条题目
- **WHEN** 用户已录入 3 道题目，访问 /problems
- **THEN** 页面展示 3 道题目，按创建时间从新到旧排列

#### Scenario: 刷新后数据持久
- **WHEN** 用户在列表页按 F5 刷新页面
- **THEN** 之前录入的题目仍在列表中，不从缓存丢失

### Requirement: 图片可选录入
系统 SHALL 在录入表单中提供可选的图片上传入口，用户可拍照或选取图片上传，上传后自动触发 OCR 识别并将结果填入文本域。图片通过预签名 URL 在列表页以缩略图展示，支持点击放大查看。

#### Scenario: 拍照上传并 OCR 回填
- **WHEN** 用户在录入页拍照上传一道题目的图片，OCR 识别成功
- **THEN** 表单 content 和 answer 字段自动填入识别文本，用户可修正后提交；题目 imageKey 非 null

#### Scenario: 不上传图片正常录入
- **WHEN** 用户不使用图片上传功能，仅填写 content 和 answer 文本并提交
- **THEN** 题目正常保存，imageKey 为 null，流程与变更前一致

#### Scenario: 列表页缩略图展示
- **WHEN** 用户在 /problems 列表页查看带有 imageKey 的题目
- **THEN** 卡片左侧展示该题目的图片缩略图，点击可放大查看原图

#### Scenario: 图片不存在占位
- **WHEN** 一道题目的 imageKey 对应 MinIO 对象已不存在
- **THEN** 列表页显示"无图片"占位提示，不报错崩溃