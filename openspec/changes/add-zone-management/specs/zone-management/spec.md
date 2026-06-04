## ADDED Requirements

### Requirement: 分区 Tab 切换
系统 SHALL 在题目列表页提供"暂存区"和"归纳区"两个 Tab，点击 Tab 按 zone 字段筛选题目。暂存区显示所有 zone=TEMPORARY 的题，归纳区显示所有 zone=ARCHIVED 的题。默认选中暂存区。

#### Scenario: 默认显示暂存区
- **WHEN** 用户首次进入题目列表页
- **THEN** 默认选中"暂存区"Tab
- **AND** 列表显示所有 zone=TEMPORARY 的题目

#### Scenario: 切换到归纳区
- **WHEN** 用户点击"归纳区"Tab
- **THEN** 列表切换为显示所有 zone=ARCHIVED 的题目
- **AND** 标签筛选条件保持不变

#### Scenario: 暂存区为空
- **WHEN** 暂存区无题目
- **THEN** 时间轴显示空状态"暂无错题"

#### Scenario: 归纳区为空
- **WHEN** 用户尚未完成任何复习
- **THEN** 归纳区显示空状态"暂无错题"

### Requirement: 暂存区容量限制
系统 SHALL 在暂存区题目数量达到 50 题上限时展示容量提示，引导用户先完成复习后再录入新题。

#### Scenario: 暂存区满额提示
- **WHEN** 暂存区题目数 >= 50
- **THEN** Tab 下方显示 amber 警告条"暂存区已满 (50/50)，请先复习清空后再录入新题"

#### Scenario: 暂存区未满时不提示
- **WHEN** 暂存区题目数 < 50
- **THEN** 不显示容量提示

### Requirement: 迁移接口预留
系统 SHALL 提供 markReviewed Server Action，接收 problemId 并将该题目 zone 更新为 ARCHIVED。当前仅预留接口，由第十步复习闭环调用。

#### Scenario: 标记为已复习
- **WHEN** 用户完成某道题的复习（第十步调用）
- **THEN** 该题的 zone 从 TEMPORARY 变为 ARCHIVED
- **AND** 题目从暂存区消失，出现在归纳区
