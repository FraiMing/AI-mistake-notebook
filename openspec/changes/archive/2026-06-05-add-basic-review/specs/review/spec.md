## ADDED Requirements

### Requirement: 复习入口

系统 SHALL 在暂存区列表中每题卡片旁提供"复习"按钮，点击后跳转到该题的复习页。归纳区题目不显示复习按钮。

#### Scenario: 暂存区显示复习按钮
- **WHEN** 用户查看暂存区列表且存在题目
- **THEN** 每题卡片右下角显示"复习"按钮

#### Scenario: 归纳区不显示复习按钮
- **WHEN** 用户查看归纳区列表
- **THEN** 每题卡片不显示"复习"按钮

#### Scenario: 点击复习按钮跳转
- **WHEN** 用户点击暂存区某题的"复习"按钮
- **THEN** 跳转到 `/problems/[id]/review` 复习页

### Requirement: 复习页展示

系统 SHALL 在复习页展示题目的完整信息，包括题目内容、错误作答、题目图片（如有）和所有标签。

#### Scenario: 展示完整题目信息
- **WHEN** 用户进入 `/problems/[id]/review`
- **THEN** 页面展示题目内容、错误作答文本
- **AND** 若有图片，图片正常渲染
- **AND** 所有标签（含 AI/手动来源标注）正常显示

#### Scenario: 已复习题目拒绝再次复习
- **WHEN** 用户访问 zone=ARCHIVED 的题目复习页
- **THEN** 展示"此题目已复习"提示，禁止操作

### Requirement: 会做流程

系统 SHALL 在用户点击"会做"按钮后追问是否理解该知识点和错因，用户确认理解后完成复习并迁移题目。

#### Scenario: 会做后确认理解
- **WHEN** 用户点击"会做"按钮
- **THEN** 显示"你理解这个知识点和错因了吗？"追问
- **AND** 显示"理解"按钮
- **WHEN** 用户点击"理解"
- **THEN** 调用 markReviewed(problemId, true)
- **AND** problem.zone 更新为 ARCHIVED
- **AND** ReviewLog 写入 understood=1
- **AND** 展示"复习完成"提示
- **AND** 提供返回列表链接

#### Scenario: 会做后表示不理解
- **WHEN** 用户点击"会做"后点击"不理解"
- **THEN** 调用 markReviewed(problemId, false)
- **AND** ReviewLog 写入 understood=0
- **AND** 展示提示"请自行查阅资料后再次理解"
- **AND** 提供返回列表链接

### Requirement: 不会做流程

系统 SHALL 在用户点击"不会做"后展示该题的正确答案，再追问是否理解，用户确认理解后完成复习并迁移题目。

#### Scenario: 不会做后展示答案
- **WHEN** 用户点击"不会做"按钮
- **THEN** 展示该题的 answer 字段内容（错误作答）
- **AND** 显示"你理解了吗？"追问

#### Scenario: 不会做后确认理解
- **WHEN** 用户在"不会做"分支点击"理解"
- **THEN** 调用 markReviewed(problemId, true)
- **AND** ReviewLog 写入 understood=1
- **AND** 展示"复习完成"提示

### Requirement: ReviewLog 持久化

系统 SHALL 在每次复习完成时将复习记录写入 ReviewLog 表，同一题目多次复习仅保留最早一条记录。

#### Scenario: 复习记录写入
- **WHEN** markReviewed 被调用
- **THEN** ReviewLog 表新增一条记录，包含 problemId、understood、reviewedAt

#### Scenario: 重复复习幂等
- **WHEN** 同一题目被多次调用 markReviewed
- **THEN** 第二次不写入重复的 ReviewLog 记录
- **AND** 不抛出错误