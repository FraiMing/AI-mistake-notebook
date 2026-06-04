# 自然语言
- 以中文为主语言，commit消息、注释、消息、文字等优先使用中文
- 英文为副语言，专业性短语、用词使用英文

# 技术栈

## 双端框架

| 端 | 技术 | 说明 |
| --- | --- | --- |
| Web 端 | Next.js 16 (App Router) + React 19 | SSR 友好，Server Actions 处理 AI 调用 |
| 手机端 | Tauri v2 + Next.js 前端复用 | 同套 UI 代码嵌入 WebView，原生壳打包 |

## 语言 & 工具链

| 类别 | 技术 |
| --- | --- |
| 语言 | TypeScript (strict mode) |
| 包管理 | pnpm |
| 样式 | Tailwind CSS v4 + Shadcn UI |
| 表单 | Zod + React Hook Form |
| 状态 | Zustand + TanStack Query |
| 测试 | Vitest (单元/集成) + Playwright (E2E) |

## 后端 & 数据

| 类别 | 技术 | 说明 |
| --- | --- | --- |
| ORM | Drizzle | - |
| 数据库 | SQLite (via Drizzle) | 嵌入式数据库，单文件存储 |
| 缓存 & 队列 | Redis 7 | Redis 兼做会话与热点缓存 |
| 对象存储 | MinIO | 题目拍照图片持久存储，S3 兼容 |
| 认证 | Auth.js v5 (credentials + bcryptjs + Drizzle adapter) | v4 已停维，用 v5 |

## AI & OCR

| 类别 | 技术 | 说明 |
| --- | --- | --- |
| LLM | DeepSeek-V4 API | 标签识别、作答判断、复习追问，统一封装 |
| OCR | 百度云文字识别 API \| HTTP REST 调用，通用文字识别免费 5 万次/日，手写/公式另有专项接口 \|


## 推送（消息页方案）

不做设备级推送。后端推送调度引擎计算需复习项，写入消息表。Web 端和手机端均展示消息列表页，用户打开即可查看。

## 部署

| 类别 | 技术 |
| --- | --- |
| 容器化 | Docker + Docker Compose |
| 服务组成 | app (Next.js) + redis + minio |

## 服务拓扑

Docker Compose 包含三个服务：

- app - Next.js 16 (Web UI + API + AI 调用)
- redis - Redis 7 (队列 + 缓存 + 会话)
- minio - MinIO (图片存储)


# 仓库目录结构

```
ai-error-notebook/
├── apps/                     # 可部署的应用
│   ├── web/                   # Next.js 16（Web UI + API + AI 调用）
│   │   ├── src/
│   │   │   ├── app/           # App Router（路由 + 布局，按需组织路由组）
│   │   │   ├── components/    # React 组件（按领域分子目录）
│   │   │   ├── lib/           # Server Actions、校验、配置（按领域拆分文件）
│   │   │   ├── hooks/         # 客户端 hooks
│   │   │   └── stores/        # Zustand stores
│   │   ├── public/
│   │   ├── e2e/               # Playwright
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   └── next.config.ts
│   │
│   └── mobile/                # Tauri v2 壳（Web 端稳定后启动）
│       ├── src-tauri/          # Rust backend
│       └── package.json
│
├── packages/                  # 共享库
│   ├── database/              # Drizzle schema + 单例 client
│   │   ├── drizzle/\r\n│   │   │   └── schema.ts
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── shared-types/          # 纯类型定义（无运行时代码）
│   │   ├── src/
│   │   └── package.json
│   │
│   └── ai-client/             # DeepSeek-V4 API 封装
│       ├── src/
│       └── package.json
│
├── workers/
│   └── ocr/  # （百度云 API 方案后不再使用，保留供参考）
│       └── ...                 # 独立于 pnpm workspace，按 Python 惯例组织
│
├── docker/                    # 容器化配置集中管理
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   └── Dockerfile.ocr
│
├── configs/                   # 共享工具链配置
│   ├── tsconfig.base.json
│   └── eslint.base.js
│
├── pnpm-workspace.yaml
├── package.json               # Root（仅 scripts + devDeps）
├── .npmrc
├── .env.example
├── .gitignore
└── README.md
```

## 边界纪律

| 规则 | 说明 |
| --- | --- |
| `packages/*` 不引入 `react` / `react-dom` / `next` | 共享库是纯逻辑/类型层，UI 框架代码只放在 `apps/*` |
| `packages/shared-types` 不包含运行时代码 | 只 `export type`，所有包均可安全引用 |
| `packages/database` 只暴露 Drizzle client 单例 | 不在此包内写业务查询；由调用方自行组装查询 |
| `workers/ocr` 独立于 pnpm workspace | （百度云 API 方案后不再使用，代码保留供参考） |

## 依赖流向

```
apps/web ──────────────┐
apps/mobile (deferred) ─┤
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
 packages/        packages/        packages/
 database         shared-types      ai-client

workers/ocr（百度云 API 方案后不再使用，代码保留供参考）
```

`apps/*` → `packages/*`。不可反向引用。

## docker-compose.yml 服务

| 服务 | 来源 | 端口 | 依赖 |
| --- | --- | --- | --- |
| app | `docker/Dockerfile.web`（build context: 仓库根） | 3000 | redis, minio |
| redis | `redis:7` | 6379 | - |
| minio | `minio/minio` | 9000, 9001 | - |

# 代码格式化
- 用`ESLint` 与 `Prettier` 格式化代码

# 文件编码

- 所有文本文件必须使用 **UTF-8 without BOM** 编码
- 在 Windows/PowerShell 环境下创建文件时，避免使用 Set-Content -Encoding UTF8（会添加 BOM），改用 WriteAllText 方式。
- 创建文件后应验证前 3 字节不是 BOM 签名（39 187 191）。

# 代码审查 Checklist

当你帮我审查代码时，请检查以下方面：

## 1. 功能正确性 ✅
- [ ] 代码实现了需求
- [ ] 边界条件处理（空输入、极大值、null）
- [ ] 错误处理完整

## 2. 代码质量 📐
- [ ] 命名清晰（变量、函数、类名）
- [ ] 函数职责单一（< 50 行）
- [ ] 避免重复代码（DRY 原则）
- [ ] 魔法数字提取为常量

## 3. 性能 ⚡
- [ ] 算法时间复杂度合理
- [ ] 避免不必要的循环/嵌套
- [ ] 数据库查询优化（N+1 问题）
- [ ] 大文件流式处理

## 4. 安全 🔒
- [ ] 输入验证（防止注入攻击）
- [ ] 敏感数据不暴露（日志/错误信息）
- [ ] 权限检查
- [ ] 密码/密钥不硬编码

## 5. 测试 🧪
- [ ] 有单元测试
- [ ] 测试覆盖关键路径
- [ ] 测试命名清晰

## 6. 文档 📚
- [ ] 复杂逻辑有注释
- [ ] Public API 有文档
- [ ] README 已更新

## 输出格式
请以以下格式输出审查结果：

\`\`\`markdown
### ✅ 优点
- ...

### ⚠️ 需要改进
- **文件**: \`path/to/file:line\`
  - **问题**: ...
  - **建议**: ...

### 🔴 严重问题
- ...

### 📝 建议
- ...
\`\`\`

# Bug 修复指南

当修复 bug 时，请遵循以下流程：

## 1. 理解问题 🔍
- 阅读错误日志/堆栈跟踪
- 确认复现步骤
- 识别影响范围（有多少用户受影响？）

## 2. 定位根因 🎯
- 用二分法缩小范围
- 添加日志/调试输出
- 检查相关的最近变更（git blame）

## 3. 修复方案 🔧
- 优先考虑最小改动
- 如果是设计问题，说明并提出重构建议
- 添加测试防止回归

## 4. 验证 ✅
- 在本地复现并修复
- 运行现有测试
- 添加新测试覆盖此 bug

# Tool Priority
- 文件名搜索：使用 \`fd\`
- 文本内容搜索：使用 \`rg\` (ripgrep)
- 代码结构搜索：使用 \`sg\` (ast-grep)
- 排除目录：\`.git\`, \`node_modules\`, \`dist\`, \`coverage\`

# 文件保护要求
- 在提交 git、上传文件前必须检查 ignore 文件书写
- 自动检查需要哪些 ignore 文件，例如 gitignore、dockerignore 等
- 需要保护的文件必须写入 ignore 文件
- 常见的需要保护的文件：
    - 依赖目录
    - 构建产物/编译输出
    - 日志文件
    - 环境变量/敏感配置
    - 操作系统/编辑器临时文件
    - IDE 配置（团队规范，建议全局 gitignore）
    - 测试/覆盖率报告
    - 缓存文件
    - 数据库
    - 服务特定文件

# 回滚安全
- 在对仓库进行任何代码修改之后，必须进行 git add 与 git commit 提交
- 若权限受限无法提交 git add 与 git commit，通知开发者手动提交并给予相应命令。
- 当开发出现失控，利用 git 与 /undo命令 回滚，保障开发流程稳定性



