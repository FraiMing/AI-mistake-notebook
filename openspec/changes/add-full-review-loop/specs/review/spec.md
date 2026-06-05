## MODIFIED Requirements

### Requirement: 会做流程（修改）

系统 SHALL 在用户点击"会做"按钮后追问是否理解。确认理解后迁移题目并计算掌握度（+10）；表示不理解时进入 AI 解答追问循环，在循环中确认理解后再迁移题目，掌握度 -15。

#### Scenario: 会做后确认理解（修改）
- **WHEN** 用户点击"会做"后点击"理解"
- **THEN** 调用 markReviewed(problemId, true)
- **AND** masteryScore 增加 10（上限 100）
- **AND** 展示绿色"复习完成！"横幅

#### Scenario: 会做后不理解 → AI 解答追问（修改）
- **WHEN** 用户点击"会做"后点击"不理解"
- **THEN** 展示困惑点输入框
- **WHEN** 用户输入困惑点并提交
- **THEN** 调用 AI 解答接口（传入题目内容、错误作答、正确作答（如有）、困惑点）
- **AND** AI 返回解答文本后展示在页面上
- **AND** 展示"现在理解了吗？"
- **WHEN** 用户点击"理解"
- **THEN** 调用 markReviewed(problemId, true)，masteryScore +10
- **AND** ReviewLog 写入 confusedText 和 understood=1
- **WHEN** 用户点击"仍不理解"
- **THEN** 回到困惑点输入框（循环）
- **AND** masteryScore -15（每次不理解追问触发时）

#### Scenario: AI 解答失败降级
- **WHEN** AI 解答接口超时或返回错误
- **THEN** 展示通用提示"AI 解答暂不可用，请自行查阅资料后确认理解"
- **AND** 仍可点击"理解"或"不理解"继续

### Requirement: 不会做流程（修改）

系统 SHALL 在用户点击"不会做"后展示正确作答。确认理解后迁移题目并 masteryScore +10；不理解时进入 AI 追问循环，masteryScore -15。

#### Scenario: 不会做后展示正确作答（不变）
- **WHEN** 用户点击"不会做"
- **THEN** 展示 correctAnswer（或降级提示）

#### Scenario: 不会做后不理解 → AI 追问（新增）
- **WHEN** 用户在"不会做"分支点击"不理解"
- **THEN** 进入 AI 解答追问循环（同会做流程的不理解分支）

### Requirement: 掌握度计算（修改）

系统 SHALL 在每次 markReviewed 调用时更新掌握度。理解 +10（上限 100），最终不理解（追问循环结束后仍不理解）-15（下限 0）。

#### Scenario: 理解增加掌握度
- **WHEN** markReviewed(problemId, true) 被调用（包括追问后确认）
- **THEN** masteryScore = MIN(100, masteryScore + 10)

#### Scenario: 不理解降低掌握度
- **WHEN** 追问循环中每次点"不理解"触发
- **THEN** masteryScore = MAX(0, masteryScore - 15)

#### Scenario: 掌握度不跌破 0
- **WHEN** masteryScore 已为 0 且再次不理解
- **THEN** masteryScore 保持 0

#### Scenario: 掌握度不超过 100
- **WHEN** masteryScore 已为 100 且再次理解
- **THEN** masteryScore 保持 100

## ADDED Requirements

### Requirement: AI 解答疑惑

系统 SHALL 在用户表示不理解时提供 AI 解答功能。用户输入困惑点，系统调用 DeepSeek API 生成针对性解答，展示后再次确认理解。

#### Scenario: AI 解答成功
- **WHEN** 用户输入困惑点并提交
- **THEN** 展示"AI 正在生成解答..."加载态
- **AND** 加载结束后展示解答文本
- **AND** 解答文本非空、包含题目相关关键词

#### Scenario: AI 解答失败降级
- **WHEN** AI 接口返回错误或超时
- **THEN** 展示"AI 解答暂不可用，请自行查阅资料后确认理解"
- **AND** 不阻塞复习流程

### Requirement: AI 相似题生成

系统 SHALL 在复习完成后询问用户是否需要同类题巩固。AI 根据原题知识点和错因生成一道新题，用户可作答后再次确认理解。

#### Scenario: 相似题询问
- **WHEN** 复习完成（step=done）
- **THEN** 展示"需要同类题巩固吗？"→ [需要]/[不需要]

#### Scenario: 相似题生成成功
- **WHEN** 用户选择"需要"
- **THEN** 展示"AI 正在生成相似题..."加载态
- **AND** AI 返回 JSON `{question, correctAnswer, knowledgePoint}`
- **AND** 页面展示生成的题目内容
- **AND** 用户可点击"会做"/"不会做"作答

#### Scenario: 相似题生成失败
- **WHEN** AI 返回的知识点与原题不一致或生成失败
- **THEN** 展示"暂无法生成同类题，请继续复习其他题目"
- **AND** 不阻塞后续流程

#### Scenario: 相似题作答后确认
- **WHEN** 用户作答相似题后确认理解
- **THEN** masteryScore +10
- **AND** 再次询问"还需要同类题吗？"（循环）

### Requirement: ReviewLog 扩展

系统 SHALL 在 ReviewLog 表存储困惑点文本和生成的相似题文本（仅当对应交互发生时写入）。

#### Scenario: 困惑点写入
- **WHEN** AI 解答追问成功
- **THEN** ReviewLog.confusedText 写入用户输入的困惑点
- **AND** 循环中的多次追问不覆盖首次写入

#### Scenario: 相似题写入
- **WHEN** AI 成功生成相似题
- **THEN** ReviewLog.similarQuestionGenerated 写入生成的题目文本