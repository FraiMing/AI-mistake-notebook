## MODIFIED Requirements

### Requirement: 会做流程（修改）

系统 SHALL 在用户点击"会做"按钮后追问是否理解该知识点和错因。用户确认理解后完成复习并迁移题目；用户表示不理解时展示引导提示并迁移题目。

#### Scenario: 会做后确认理解（不变）
- **WHEN** 用户点击"会做"后点击"理解"
- **THEN** 调用 markReviewed(problemId, true)
- **AND** 展示绿色"复习完成！题目已迁入归纳区。"横幅
- **AND** 提供返回列表链接

#### Scenario: 会做后表示不理解（修改）
- **WHEN** 用户点击"会做"后点击"不理解"
- **THEN** 调用 markReviewed(problemId, false)
- **AND** ReviewLog 写入 understood=0
- **AND** 展示黄色"请自行查阅资料后再次理解。题目已迁入归纳区。"横幅
- **AND** 提供返回列表链接

### Requirement: 不会做流程（修改）

系统 SHALL 在用户点击"不会做"后展示该题的**正确作答**（correctAnswer 字段），再追问是否理解，用户确认理解后完成复习并迁移题目。

#### Scenario: 不会做后展示正确作答（修改）
- **WHEN** 用户点击"不会做"按钮
- **THEN** 展示该题的 correctAnswer 字段内容
- **AND** 若 correctAnswer 为 NULL，展示"未填写正确作答"提示
- **AND** 显示"看了答案后，你理解了吗？"追问

#### Scenario: 不会做后确认理解（不变）
- **WHEN** 用户在"不会做"分支点击"理解"
- **THEN** 调用 markReviewed(problemId, true)
- **AND** 展示绿色"复习完成"横幅

#### Scenario: 不会做后表示不理解（新增）
- **WHEN** 用户在"不会做"分支点击"不理解"
- **THEN** 调用 markReviewed(problemId, false)
- **AND** 展示黄色"请自行查阅资料后再次理解。题目已迁入归纳区。"横幅

## ADDED Requirements

### Requirement: 正确作答字段

系统 SHALL 在 Problem 表存储正确作答（correctAnswer 字段），录入表单支持输入，复习页在不会做时展示。

#### Scenario: 录入时填写正确作答
- **WHEN** 用户在录入页填写正确作答（可选）并提交
- **THEN** Problem 表 correctAnswer 列保存该值

#### Scenario: 录入时不填写正确作答
- **WHEN** 用户不填写正确作答直接提交
- **THEN** Problem 表 correctAnswer 列为 NULL
- **AND** 录入不报错

#### Scenario: 复习时正确作答有值
- **WHEN** 用户在复习页点击"不会做"
- **AND** 该题 correctAnswer 非 NULL
- **THEN** 展示 correctAnswer 内容

#### Scenario: 复习时正确作答无值
- **WHEN** 用户在复习页点击"不会做"
- **AND** 该题 correctAnswer 为 NULL
- **THEN** 展示"未填写正确作答"提示