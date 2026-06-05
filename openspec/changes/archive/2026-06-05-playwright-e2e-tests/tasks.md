## 1. 测试基础设施

- [x] 1.1 创建 e2e/helpers/ 目录结构
- [x] 1.2 实现 auth.ts（login helper：导航到 /login → 填写凭据 → 提交 → 等待 /problems）
- [x] 1.3 实现 mocks.ts（setupAiMocks：page.route 拦截 /api/problems POST 和 /api/review/* 所有端点）
- [x] 1.4 实现 test-data.ts（generateTestContent：返回 "E2E-" + Date.now() 前缀字符串）
- [x] 1.5 实现 selectors.ts（页面元素选择器常量）

## 2. 认证 E2E

- [x] 2.1 创建 auth.spec.ts，引用 helpers
- [x] 2.2 实现登录成功测试（正确凭据 → 跳转 /problems → 页面内容可见）
- [x] 2.3 实现登录失败测试（错误凭据 → 停留在 /login → 错误提示可见）
- [x] 2.4 实现未登录重定向测试（直接访问 /problems → 重定向到 /login）

## 3. 题目录入与 AI 标注 E2E

- [x] 3.1 重构现有 problem-entry.spec.ts 为使用 helpers（login + setupAiMocks）
- [x] 3.2 扩展录入流程：填写内容 → 点击下一步 → 等待确认面板 → 移除一个 AI 建议 → 确认保存 → 列表可见
- [x] 3.3 添加必填字段校验测试（空 content / 空 answer 时拦截提示）

## 4. 照片上传 E2E

- [x] 4.1 在 mocks.ts 中添加 setupUploadMock（拦截 /api/upload 返回固定 imageKey + ocrContent）
- [x] 4.2 创建 problem-photo.spec.ts（login + setupUploadMock + setupAiMocks）
- [x] 4.3 实现照片上传流程测试（点击上传区 → 选择文件 → 验证 loading → 验证图片预览 → 验证 OCR 内容回填 → 保存 → 列表可见）

## 5. 标签管理 E2E

- [x] 5.1 重构现有 tagging.spec.ts 为使用 helpers
- [x] 5.2 扩展创建标签测试（已覆盖，确保使用 helper）
- [x] 5.3 添加编辑标签名测试
- [x] 5.4 添加删除标签测试
- [x] 5.5 保留并优化按标签筛选题目测试

## 6. 复习闭环 E2E

- [x] 6.1 确认 /problems/[id]/review 页面存在（已验证 page.tsx 实现完整）
- [x] 6.2 创建 review.spec.ts（login + setupAiMocks → 先录入一道题 → 点击复习按钮）
- [x] 6.3 实现"会做 → 理解"流程测试（点击会做 → 点击理解 → 复习完成 → 需要同类题）
- [x] 6.4 实现"不理解 → AI 解答"流程测试（点击不会做 → 不理解 → 输入困惑点 → 展示 AI 解答）
- [x] 6.5 实现"同类题请求"测试（选择需要同类题 → AI 返回题目 → 验证同类题展示）

## 7. 验证与调优

- [x] 7.1 运行 TypeScript 编译检查确认无新增错误（tsc --noEmit 通过）
- [x] 7.2 Mock 策略修复：仅拦截 Content-Type: application/json 请求，不阻塞服务器 Action
- [x] 7.3 Playwright config 更新：移除 webServer 自启动（沙箱权限限制），改为手动启动 dev server
- [x] 7.4 运行方式：先 `pnpm dev` 启动 dev server，再 `pnpm test:e2e`
