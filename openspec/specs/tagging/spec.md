# Tagging

## Purpose

标签系统 —— 允许用户创建学科、知识点、错因三种类型的标签，给题目打标，按标签组合筛选题目。包含手动标签、AI 自动标注、标签筛选三大功能。这是后续复习模块「知识点+错因」分组的数据基础。

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

### Requirement: AI 自动标注
系统 SHALL 在题目保存后调用 DeepSeek API，自动生成学科（SUBJECT）、知识点（KNOWLEDGE_POINT）、错因（ERROR_REASON）三个标签建议。AI 建议标签与用户已有标签同名同类型时复用已有 Tag ID，否则自动创建新 Tag。用户可在确认前删除 AI 建议、添加手动标签。AI 调用失败时系统降级提示手动打标，不阻塞题目保存。

#### Scenario: AI 生成标签建议
- **WHEN** 用户在录题页提交 content="已知二次函数 f(x)=x²+bx+c..."、answer="错解：b=2, c=3" 并保存
- **THEN** 提交后页面展示加载态"AI 正在分析错题..."
- **AND** 加载完成后展示三个 AI 建议标签，每个标注"AI"来源：
  - 学科=数学（蓝色 Chip + "AI" 角标）
  - 知识点=二次函数的图像性质（蓝色 Chip + "AI" 角标）
  - 错因=公式误用（蓝色 Chip + "AI" 角标）

#### Scenario: AI 标签复用已有 Tag
- **WHEN** AI 返回标签名 "数学" + type=SUBJECT，且用户已有同名同 type 的 Tag
- **THEN** 系统复用该 Tag 的 ID，不创建重复 Tag 记录
- **AND** SELECT COUNT(*) FROM Tag WHERE name='数学' AND type='SUBJECT' AND userId={当前用户} 结果仍为 1

#### Scenario: AI 标签自动创建新 Tag
- **WHEN** AI 返回标签名 "二次函数的图像性质" + type=KNOWLEDGE_POINT，且用户无同名同 type 的 Tag
- **THEN** 系统自动创建新 Tag（name + type + userId），然后将新 Tag ID 写入 ProblemTag

#### Scenario: 用户修改 AI 建议标签
- **WHEN** AI 返回三个建议标签后，用户删除"公式误用"、手动新增"粗心计算"
- **THEN** 确认提交后，ProblemTag 中该题目关联的标签为：
  - "数学"（source=AI）
  - "二次函数的图像性质"（source=AI）
  - "粗心计算"（source=MANUAL）
- **AND** "公式误用"不关联到该题目

#### Scenario: AI 调用失败降级
- **WHEN** DeepSeek API 不可用（超时、网络错误、返回非法 JSON）
- **THEN** 题目仍正常保存
- **AND** 页面展示降级提示："AI 标注暂不可用，请手动添加标签"
- **AND** 用户仍可手动选择标签并保存，不阻塞录题流程

#### Scenario: 不传图片只传文字时 AI 正常标注
- **WHEN** 用户仅输入文字内容（content + answer），未上传图片
- **THEN** AI 仅基于文字内容进行分析，正常返回标签建议

#### Scenario: OCR 填充内容后 AI 标注
- **WHEN** 用户上传含文字图片，OCR 自动填充 content，用户手动补充 answer 后提交
- **THEN** AI 基于 OCR 填充的 content 和用户输入的 answer 进行分析
- **AND** 生成的标签建议与手动输入场景一致

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
