## Context

当前 `apps/web/e2e/` 仅有 2 个测试文件（`problem-entry.spec.ts` 和 `tagging.spec.ts`），覆盖基本的手动录入和标签打标流程。整个错题本有 8 项核心能力（认证、录入、标签、查看筛选、照片上传、照片预览、复习、推送），E2E 测试严重不足。

现有测试的技术问题：
1. 登录流程在每个测试中重复 — 无可复用 helper
2. 选择器依赖硬编码 `a[href="..."]`、`input[name="..."]` — 页面重构容易断裂
3. AI 调用真实执行 — 慢、花钱、不稳定
4. 无 negative test case（错误状态、边界条件）

该设计是纯测试层变更，不修改任何生产代码。

## Goals / Non-Goals

**Goals:**
- 全链路覆盖：认证 → 录入（手动+照片+AI标注） → 列表筛选 → 复习闭环
- 所有外部 API 调用通过 `page.route()` mock，确保测试稳定可重复
- 抽取可复用 helpers（登录、mock 注册、选择器常量、测试数据生成）
- 测试可并行运行（Playwright `fullyParallel: true`）

**Non-Goals:**
- 不覆盖推送计算和消息模块（对应页面尚为 stub，feature 未完成）
- 不修改任何生产代码、组件或 API
- 不引入新的测试依赖
- 不做视觉回归测试

## Decisions

### 1. 测试文件结构

```
e2e/
├── helpers/
│   ├── auth.ts            # login(page, username, password)
│   ├── mocks.ts           # setupAiMocks(page), setupUploadMock(page)
│   ├── selectors.ts       # 选择器常量
│   └── test-data.ts       # 生成带时间戳的测试数据
├── auth.spec.ts
├── problem-entry.spec.ts   # 重构 + 扩展
├── problem-photo.spec.ts
├── tags.spec.ts            # 重构 + 扩展
└── review.spec.ts
```

**理由**: 6 个 spec 文件对应 6 个独立用户流程，helpers 目录集中管理可复用逻辑。比起「一个大文件」更易于排查并行失败。

**备选方案**: 使用 Playwright test fixtures 的 `test.extend` 注入登录状态。否掉 — 增加框架耦合，simpler helpers 对这个小项目来说足够。

### 2. AI / OCR Mock 策略

所有外部 API 均通过 `page.route()` 拦截，不发送真实网络请求：

| 拦截端点 | 返回内容 |
|---------|---------|
| `**/api/problems`（POST 分析调用） | 固定 `aiSuggestions: [{tagType:"SUBJECT", tagName:"数学", tagId:...}, ...]` |
| `**/api/review/correct-answer` | 固定 `{correct: true, correctAnswer:"..."}` |
| `**/api/review/explain` | 固定 `{explanation:"这是解析内容..."}` |
| `**/api/review/similar-question` | 固定 `{question:"...", correctAnswer:"...", knowledgePoint:"..."}` |
| `**/api/upload` | 固定 `{imageKey:"test/123.jpg", ocrContent:"E2E OCR 内容"}` |

**理由**: 完全解耦 E2E 测试和外部 API 依赖。测试聚焦 UI 交互正确性而非 AI 质量。Playwright `page.route()` 是内置功能，无需额外工具。

**备选方案**: 使用 MSW（Mock Service Worker）。否掉 — 纯客户端 mock 无法覆盖 Server Action 中的 API 调用；`page.route()` 在网络层拦截，覆盖更完整。

### 3. 测试数据策略

- 用已有 `admin / admin123` 账号，不创建新用户
- 测试数据前缀 `E2E-` 外加 `Date.now()` 确保唯一性
- 不做测试后清理 — SQLite 单文件，一个人用，积累的数据可手动清除
- 标签创建前先检查是否已存在同名标签（避免重复创建报错阻塞）

### 4. 选择器策略

优先级从高到低：
1. `getByRole()` / `getByText()` — 最接近用户行为
2. `getByLabel()` — 表单字段
3. `getByPlaceholder()` — 输入框
4. `locator()` 文本匹配 — 按钮/链接
5. CSS selector `[data-testid="..."]` — 仅在以上都不适用时考虑

当前项目中无 `data-testid` 属性，重构时优先使用 Playwright 文本定位。

## Risks / Trade-offs

- **mock 与真实 API 的差异** → mock 数据尽量贴近真实 API 返回格式，参照现有 `lib/review-actions.ts`、`lib/ai-tagging-action.ts` 的返回类型
- **review 页面可能不存在完整实现** → 需要先确认 `/problems/[id]/review` 页面是否存在；如果不存在，在 spec 中降级为 mock 级别测试（仅验证 API 调用路径）
- **Playwright `webServer` 启动** → 当前配置 `reuseExistingServer: true`，需要确保 Next.js dev server 在测试前手动启动
- **SQLite 并发写入** → `fullyParallel: true` 下多个测试同时写 SQLite 可能冲突 → 风险较低（SQLite 有 WAL 模式，且测试数据量小），若出现 flaky 则改为 `fullyParallel: false`
