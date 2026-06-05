# Problem Entry

## Purpose

题目录入能力 — 允许用户手动输入错题内容与错误作答，或通过拍照上传 + OCR 自动识别录入，并在列表页查看已录入的题目。这是整个错题本的数据入口，后续所有功能（标签、复习、推送）依赖此能力。

## Requirements

### Requirement: 题目录入——分步保存
系统 SHALL 在用户填写题目内容、错误作答并完成标签确认后，将题目和标签原子性写入数据库。点击下一步时仅触发 AI 分析并生成标签建议，不写数据库。

#### Scenario: 点击下一步仅分析不保存
- **WHEN** 用户填写 content 和 answer 后点击下一步
- **THEN** 系统调用 AI 生成标签建议
- **AND** 题目不写入数据库

#### Scenario: 确认后原子写入
- **WHEN** 用户在标签确认面板点击确认并保存
- **THEN** 系统将题目和选定的标签原子性写入数据库
- **AND** 跳转到题目列表页

#### Scenario: 中途关闭无残留
- **WHEN** 用户在标签确认面板关闭页面或浏览器
- **THEN** 题目不写入数据库
- **AND** AI 建议阶段创建的新标签可独立存在

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
系统 SHALL 在 /problems 页面展示当前用户录入的题目，按创建时间倒序排列，支持"加载更多"分页。

#### Scenario: 列表为空
- **WHEN** 用户首次访问 /problems 页面且没有录入任何题目
- **THEN** 页面展示"暂无错题"空状态提示，不报错

#### Scenario: 首次加载 20 题
- **WHEN** 用户已录入 31 题并访问 /problems
- **THEN** 页面展示最近 20 题，"加载更多"按钮可见
- **WHEN** 用户点击"加载更多"
- **THEN** 追加展示剩余 11 题，"加载更多"按钮消失

#### Scenario: 分区切换重置分页
- **WHEN** 用户在暂存区滚动加载了第 2 页后切换到归纳区
- **THEN** 归纳区从第 1 页开始加载

#### Scenario: 筛选重置分页
- **WHEN** 用户按标签筛选后返回结果不足一页
- **THEN** 不展示"加载更多"按钮
- **WHEN** 用户清除筛选
- **THEN** 重新从第 1 页加载

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
