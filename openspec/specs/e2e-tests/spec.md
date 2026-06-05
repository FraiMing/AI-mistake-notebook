# e2e-tests Specification

## Purpose
TBD - created by archiving change playwright-e2e-tests. Update Purpose after archive.
## Requirements
### Requirement: 认证流程 E2E

系统 SHALL 在 `auth.spec.ts` 中验证登录成功、登录失败及未登录重定向三个场景。

#### Scenario: 登录成功跳转
- **WHEN** 用户使用正确凭据 admin / admin123 登录
- **THEN** 页面跳转到 /problems 且列表正常加载

#### Scenario: 登录失败提示
- **WHEN** 用户使用错误凭据登录
- **THEN** 页面保留在 /login 且展示错误提示

#### Scenario: 未登录重定向
- **WHEN** 用户直接访问 /problems 而无有效 session
- **THEN** 页面重定向到 /login

### Requirement: 手动题目录入与 AI 标注 E2E

系统 SHALL 在 `problem-entry.spec.ts` 中验证完整的录入流程：填写表单 → 点击下一步触发 AI 分析（mock）→ 标签确认面板交互 → 确认保存 → 列表可见。

#### Scenario: 基础录入 + AI 标签确认
- **WHEN** 用户填写 content 和 answer 后点击"下一步"
- **THEN** 展示 AI 加载态
- **AND** 加载完成后展示 AI 标签建议面板
- **AND** 用户可移除单个标签建议
- **WHEN** 用户点击"确认并保存"
- **THEN** 跳转到 /problems 且新题目出现在列表中

#### Scenario: 未填写必填字段拦截
- **WHEN** 用户将 content 置空并提交
- **THEN** 页面显示"题目内容不能为空"且不发送请求

### Requirement: 照片上传 E2E

系统 SHALL 在 `problem-photo.spec.ts` 中验证照片上传交互：点击上传区 → 选择文件 → 展示预览图 → OCR 回填 → 提交保存。

#### Scenario: 照片上传并 OCR 回填
- **WHEN** 用户在录入页上传照片
- **THEN** 展示上传中加载态
- **AND** 上传完成后展示图片预览
- **AND** content 输入框被 OCR 结果自动填入
- **WHEN** 用户点击下一步并确认保存
- **THEN** 题目保存成功且列表中出现该题

### Requirement: 标签管理 E2E

系统 SHALL 在 `tags.spec.ts` 中验证标签的创建、编辑、删除及按标签筛选。

#### Scenario: 创建标签
- **WHEN** 用户输入标签名和类型并提交
- **THEN** 标签出现在标签列表中

#### Scenario: 编辑标签名
- **WHEN** 用户点击标签的编辑按钮并修改名称
- **THEN** 列表中标签名已更新

#### Scenario: 删除标签
- **WHEN** 用户点击标签的删除按钮并确认
- **THEN** 标签从列表中消失

#### Scenario: 按标签筛选题目
- **WHEN** 用户在题目列表页选择一个标签筛选
- **THEN** 仅显示拥有该标签的题目
- **WHEN** 用户点击"清除筛选"
- **THEN** 全部题目重新可见

### Requirement: 复习闭环 E2E

系统 SHALL 在 `review.spec.ts` 中验证复习完整流程：进入复习 → 作答 → AI 判题 → 查看解析 → 请求同类题。

#### Scenario: 复习流程（会做 → 理解）
- **WHEN** 用户在暂存区点击某题的"复习"按钮
- **THEN** 进入复习页，展示题目信息和作答区
- **WHEN** 用户输入答案并提交
- **THEN** AI 判断正确并展示结果
- **AND** 系统询问是否理解
- **WHEN** 用户点击"理解"
- **THEN** 题目标记为已复习，展示完成状态

#### Scenario: 复习流程（不理解 → AI 解答）
- **WHEN** 用户在复习后点击"不理解"
- **THEN** 展示困惑点输入框
- **WHEN** 用户输入困惑并向 AI 请求解答
- **THEN** 展示 AI 解答内容

#### Scenario: 同类题请求
- **WHEN** 复习完成后用户选择"需要同类题"
- **THEN** AI 返回一道同类题目
- **WHEN** 用户作答同类题并确认理解
- **THEN** 同类题复习完成

### Requirement: 测试基础设施

系统 SHALL 在 `e2e/helpers/` 中提供可复用的登录函数、AI mock 注册函数及选择器常量。

#### Scenario: 登录 helper 可用
- **WHEN** 测试调用 `login(page)`
- **THEN** 完成 admin 登录并停留在 /problems

#### Scenario: AI mock 注册
- **WHEN** 测试调用 `setupAiMocks(page)`
- **THEN** 所有 `/api/problems` POST 和 `/api/review/*` 端点返回预设 mock 数据

#### Scenario: 测试数据唯一性
- **WHEN** 测试调用 `generateTestContent()`
- **THEN** 返回 `E2E-` 前缀且包含时间戳的唯一字符串

