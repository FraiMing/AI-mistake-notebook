## ADDED Requirements

### Requirement: 推送调度引擎

系统 SHALL 提供推送调度引擎，按知识点+错因分组所有题目，依遗忘曲线判断是否需要复习，按优先级排序后写入 Message 表。

#### Scenario: 分组计算
- **WHEN** 推送调度被触发
- **THEN** 所有题目按 (knowledgePoint_tagId, errorReason_tagId) 分组
- **AND** 每个分组仅选取一道代表题（优先 TEMPORARY，其次 masteryScore 最低）

#### Scenario: 遗忘曲线判断 — 暂存区需复习
- **WHEN** 暂存区题目距创建时间 > 1×(1+masteryScore/100) 天
- **THEN** 判断为需要复习

#### Scenario: 遗忘曲线判断 — 归纳区不需复习
- **WHEN** 归纳区题目距上次复习 < 3×(1+masteryScore/100) 天
- **THEN** 判断为不需要复习

#### Scenario: 遗忘曲线判断 — 无 ReviewLog 的题
- **WHEN** 题目无 ReviewLog 记录
- **THEN** 以 problem.createdAt 作为时间基准计算

#### Scenario: 优先级排序
- **WHEN** 多个分组需要复习
- **THEN** 按 priority = zoneFactor × intervalDays × masteryFactor 降序排列
- **AND** TEMPORARY 权重高于 ARCHIVED

### Requirement: Message 表

系统 SHALL 建立 Message 表存储推送消息，包含 problemId、priority、isRead 和时间戳。

#### Scenario: Message 写入
- **WHEN** 推送调度引擎计算完成
- **THEN** 每个需要复习的分组创建一条 Message
- **AND** 同一 problem 不重复创建（已有未读消息时跳过）

#### Scenario: Message 标已读
- **WHEN** 用户从消息入口完成对应题目的复习
- **THEN** 该 Message 的 isRead 更新为 1

### Requirement: 消息列表页

系统 SHALL 在 `/messages` 路由展示未读消息列表，按优先级降序排列，点击进入对应题目复习。

#### Scenario: 展示未读消息
- **WHEN** 用户访问 `/messages`
- **THEN** 展示所有 isRead=0 的消息，按 priority 降序
- **AND** 每条显示题目 content 预览（截断 80 字符）和知识点 tag 名

#### Scenario: 空消息状态
- **WHEN** 无未读消息
- **THEN** 展示"暂无需要复习的题目"

#### Scenario: 点击消息进入复习
- **WHEN** 用户点击某条消息
- **THEN** 跳转到 `/problems/:id/review?from=message`
- **AND** 复习完成后该消息标记为已读

### Requirement: 侧边栏消息入口

系统 SHALL 在侧边栏添加 `/messages` 入口并显示未读消息数量。

#### Scenario: 显示未读数
- **WHEN** 存在未读消息
- **THEN** 侧边栏 `/messages` 入口旁显示未读消息数量

#### Scenario: 无未读消息
- **WHEN** 所有消息已读
- **THEN** 侧边栏不显示未读数