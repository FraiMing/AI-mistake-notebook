## ADDED Requirements

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
- **AND** `SELECT COUNT(*) FROM Tag WHERE name='数学' AND type='SUBJECT' AND userId={当前用户}` 结果仍为 1

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
