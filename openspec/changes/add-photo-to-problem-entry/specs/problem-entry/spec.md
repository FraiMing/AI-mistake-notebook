## MODIFIED Requirements

### Requirement: 表单不暴露 imageKey
系统在录入表单中 SHALL NOT 将 imageKey 作为必填或强制暴露的输入控件，但允许用户通过可选的图片上传入口为题目添加图片。图片上传成功后，imageKey 随题目表单一起提交保存。

#### Scenario: 录入页面有图片上传元素
- **WHEN** 用户访问 /problems/new 页面
- **THEN** 页面包含图片上传按钮（可选使用），不强制要求上传；content 和 answer 文本输入域始终可见，用户可以只上传图片、只填写文本、或两者组合

#### Scenario: 纯文本录入不受影响
- **WHEN** 用户不使用图片上传功能，仅填写 content 和 answer 文本并提交
- **THEN** 题目正常保存，imageKey 为 null，流程与变更前一致

## REMOVED Requirements

### Requirement: 表单不暴露 imageKey
原 spec 中 "Requirement: 表单不暴露 imageKey" 及所属场景将被移除，因为图片上传功能现已实现。

**Reason**: 该要求是临时占位声明，imageKey 字段原本就是为图片上传预留的。当前变更正式启用 imageKey。

**Migration**: 无需迁移 — imageKey 当前无数据，直接添加上传功能即可。