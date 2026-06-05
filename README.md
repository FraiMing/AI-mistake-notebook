# AI 错题本

智能错题管理工具 —— 拍照录入、AI 标注、智能复习提醒。

## 功能

- **题目录入**：手动输入或拍照上传，OCR 自动识别填充
- **AI 标注**：DeepSeek 自动识别学科、知识点和错因
- **标签管理**：自定义标签，手动/自动标注，按标签筛选
- **暂存区 / 归纳区**：新题暂存 → 复习后归纳，分页浏览
- **复习闭环**：会做/不会做判断，AI 解答疑惑，相似题推荐
- **消息提醒**：系统根据掌握度自动推送待复习题目

## 前置条件

| 工具 | 版本要求 |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | 最新 (`corepack enable && corepack prepare pnpm@latest --activate`) |
| Docker Desktop | 最新 (Redis + MinIO) |

## 首次启动

```bash
# 1. 安装依赖
pnpm install

# 2. 环境变量
cp .env.example .env
# 编辑 .env：
#   - AUTH_SECRET（openssl rand -base64 32）
#   - BAIDU_OCR_API_KEY / BAIDU_OCR_SECRET_KEY（百度云文字识别）
#   - DEEPSEEK_API_KEY（AI 标注 + 复习解答）

# 3. 启动 Redis + MinIO
docker compose -f docker/docker-compose.yml up -d redis minio

# 4. 启动开发服务器
pnpm dev
```

打开 http://localhost:3000。首次访问需在登录页使用测试账号 `admin` / `admin123`（若数据库为空，Playwright 全局 setup 会自动创建）。

## 日常开发

```bash
docker compose -f docker/docker-compose.yml up -d redis minio
pnpm dev
```

停服（保留数据）：

```bash
docker compose -f docker/docker-compose.yml stop redis minio
```

## Docker 完整部署

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

| 服务 | 地址 |
|------|------|
| Web | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |
| MinIO API | http://localhost:9000 |

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | Next.js 开发服务器 (:3000) |
| `pnpm build` | 生产构建 |
| `pnpm test` | Vitest 单元/集成测试 |
| `pnpm test:e2e` | Playwright E2E 测试 |
| `pnpm typecheck` | TypeScript 全仓库类型检查 |
| `pnpm lint` | ESLint 检查 |

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| 样式 | Tailwind CSS v4 + Shadcn UI |
| 语言 | TypeScript (strict) |
| 认证 | Auth.js v5 (Credentials + bcryptjs) |
| 数据库 | SQLite (Drizzle ORM + sql.js) |
| 队列/缓存 | Redis 7 |
| 存储 | MinIO (S3 兼容) |
| AI | DeepSeek-V4 |
| OCR | 百度云文字识别 API |
| 测试 | Vitest (单元) + Playwright (E2E) |
| 部署 | Docker Compose |
