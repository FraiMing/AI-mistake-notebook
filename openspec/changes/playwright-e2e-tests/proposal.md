## Why

当前 Playwright E2E 仅覆盖「手动录入」和「标签打标」两条 Happy Path，缺少认证行为验证、AI 标注确认流程、复习闭环、照片上传等关键用户路径。第六步 reviewer-review 和第十二步全链路通过均要求 E2E 通过所有核心流程。现有测试无 mock 策略、选择器不稳定、无可复用 helper，阻碍持续集成与迭代信心。

## What Changes

- 新增认证流程 E2E（登录成功/失败、未登录重定向）
- 新增照片上传 E2E（mock `/api/upload` → OCR 回填 → 保存 → 列表缩略图）
- 重构并扩展现有 problem-entry 测试（增加 AI 标签确认面板交互）
- 扩展现有 tagging 测试（增加编辑、删除标签流程）
- 新增复习闭环 E2E（进入复习 → 作答 → AI 判题/解析/同类题，mock 所有 `/api/review/*`）
- 抽取测试 helpers（登录函数、AI mock 注册函数、选择器常量）
- 所有测试使用 `page.route()` mock DeepSeek API，确保测试稳定、快速、零成本运行

## Capabilities

### New Capabilities

- `e2e-tests`: 全链路 Playwright E2E 测试套件，覆盖认证、题目录入与 AI 标注、标签管理、照片上传、复习闭环；通过 page.route() mock 所有外部 AI/OCR 依赖

### Modified Capabilities

<!-- This is a testing-only change. No production spec requirements are modified. -->

## Impact

- 仅添加/修改 `apps/web/e2e/` 目录下的测试文件
- 可能添加 `apps/web/e2e/helpers/` 目录存放测试辅助函数
- 不改变任何生产代码、API、数据库 schema 或 UI 组件
- 测试运行依赖 `pnpm test:e2e`（已有 script），不引入新依赖
