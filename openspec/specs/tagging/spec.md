# Tagging

## Purpose

标签系统 — 允许用户创建学科、知识点、错因三种类型的标签，给题目打标，按标签组合筛选题目。这是后续复习模块「知识点+错因」分组的数据基础。

## Requirements

### Requirement: 标签管理
系统 SHALL 允许用户创建、编辑、删除三种类型的标签：学科（SUBJECT）、知识点（KNOWLEDGE_POINT）、错因（ERROR_REASON）。

#### Scenario: 创建标签
- **WHEN** 用户在标签管理页输入 name="数学" 并选择 type=SUBJECT 提交
- **THEN** 标签创建成功，返回标签列表可见

#### Scenario: 创建标签缺少 type
- **WHEN** 用户输入 name 但未选择 type 提交
- **THEN** 系统拦截，提示"标签类型不能为空"

#### Scenario: 同名标签拒绝
- **WHEN** 用户创建与已存在标签同 name 同 type 的标签
- **THEN** 系统提示"标签已存在"，不创建重复记录

#### Scenario: 编辑标签名称
- **WHEN** 用户将"数学"改为"数学（理科）"并保存
- **THEN** 所有关联该标签的题目同步显示新名称

#### Scenario: 删除标签
- **WHEN** 用户删除标签"数学"
- **THEN** 所有 ProblemTag 中与该标签的关联自动清除，题目不再显示该标签

### Requirement: 题目打标
系统 SHALL 允许用户在录入题目时选择已有标签，题目保存后关联存储在 ProblemTag 表中。

#### Scenario: 录入题目时选择标签
- **WHEN** 用户在录入页选择"数学"+"粗心"两个标签并提交题目
- **THEN** 题目保存后，列表页显示该题的标签为"数学"、"粗心"

#### Scenario: 录入题目不选标签
- **WHEN** 用户录入题目时不选择任何标签
- **THEN** 题目正常保存，列表页该题标签列为空，不崩溃

#### Scenario: 标签选择器按 type 分组
- **WHEN** 用户打开标签选择器查看可选标签
- **THEN** 标签按 SUBJECT / KNOWLEDGE_POINT / ERROR_REASON 三组展示，每组显示该类型的所有标签

### Requirement: 标签筛选
系统 SHALL 在题目列表页提供按标签组合筛选功能，多个标签之间为 AND 逻辑。

#### Scenario: 单标签筛选
- **WHEN** 用户在筛选下拉中选择"学科=数学"
- **THEN** 列表仅显示包含"数学"标签的题目

#### Scenario: 跨类型 AND 筛选
- **WHEN** 用户同时选择"学科=数学"和"错因=粗心"
- **THEN** 列表仅显示同时包含"数学"和"粗心"两个标签的题目

#### Scenario: 无效筛选组合
- **WHEN** 用户选择的标签组合无任何题目匹配
- **THEN** 页面展示"没有找到匹配的错题"空状态

#### Scenario: 清除筛选
- **WHEN** 用户点击"清除筛选"
- **THEN** 恢复展示全部题目

#### Scenario: 无标签题不被筛选
- **WHEN** 用户选择"学科=数学"筛选
- **THEN** 无标签的题目不出现在结果中