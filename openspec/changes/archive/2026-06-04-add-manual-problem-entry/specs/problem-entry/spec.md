## ADDED Requirements

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
系统 SHALL 在 /problems 页面展示当前用户录入的所有题目，按创建时间倒序排列。

#### Scenario: 列表为空
- **WHEN** 用户首次访问 /problems 页面且没有录入任何题目
- **THEN** 页面展示"暂无错题"空状态提示，不报错

#### Scenario: 列表有多条题目
- **WHEN** 用户已录入 3 道题目，访问 /problems
- **THEN** 页面展示 3 道题目，按创建时间从新到旧排列

#### Scenario: 刷新后数据持久
- **WHEN** 用户在列表页按 F5 刷新页面
- **THEN** 之前录入的题目仍在列表中，不从缓存丢失

### Requirement: 表单不暴露 imageKey
系统在录入表单中 SHALL NOT 暴露 imageKey 相关的输入控件（文件上传按钮等），该字段保留供后续步骤使用。

#### Scenario: 录入页面无文件上传元素
- **WHEN** 用户访问 /problems/new 页面
- **THEN** 页面不包含文件选择器或上传按钮，仅有 content 和 answer 两个文本输入域