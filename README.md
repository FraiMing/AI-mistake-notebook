# AI 错题本

智能错题管理工具 —— 拍照录入、AI 标注、智能复习提醒。

## 前置条件

| 工具 | 版本要求 | 说明 |
| --- | --- | --- |
| Node.js | ≥ 20 | |
| pnpm | 最新版 | `corepack enable && corepack prepare pnpm@latest --activate` |
| Docker Desktop | 最新版 | 本地开发需启动 Redis + MinIO |

## 首次启动

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，至少修改 AUTH_SECRET（可用 openssl rand -base64 32 生成）
# DEEPSEEK_API_KEY 暂可不填，AI 功能未实现前不影响启动

# 3. 创建数据库并写入初始数据
pnpm db:migrate
pnpm db:seed

# 4. 启动依赖服务（Redis + MinIO）
docker compose -f docker/docker-compose.yml up -d redis minio

# 5. 启动开发服务器
pnpm dev
```

打开 http://localhost:3000 ，默认账号 `admin` / `admin123`。

## 日常开发

```bash
# 启动 Redis + MinIO（已启动则跳过）
docker compose -f docker/docker-compose.yml up -d redis minio

# 启动 Next.js 开发服务器
pnpm dev
```

停用依赖服务（保留数据）：

```bash
docker compose -f docker/docker-compose.yml stop redis minio
```

## Docker 完整部署

```bash
# 构建并启动全部 4 个服务（app + redis + minio + ocr-worker）
docker compose -f docker/docker-compose.yml up -d --build
```

| 服务 | 地址 |
| --- | --- |
| Web UI | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |
| MinIO API | http://localhost:9000 |

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Web 开发服务器 (:3000) |
| `pnpm build` | 构建生产版本 |
| `pnpm test` | 运行单元测试 (Vitest) |
| `pnpm test:e2e` | 运行 E2E 测试 (Playwright) |
| `pnpm typecheck` | 全仓库类型检查 |
| `pnpm lint` | 全仓库 ESLint 检查 |
| `pnpm db:generate` | 根据 schema 生成迁移 SQL |
| `pnpm db:migrate` | 执行迁移 |
| `pnpm db:seed` | 写入种子数据（预设用户） |

## 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Next.js 16 (App Router) + React 19 |
| 样式 | Tailwind CSS v4 + Shadcn UI |
| 语言 | TypeScript (strict) |
| 认证 | Auth.js v5 (Credentials) |
| 数据库 | SQLite (Drizzle ORM + sql.js) |
| 队列/缓存 | Redis 7 + BullMQ |
| 存储 | MinIO (S3 兼容) |
| AI | DeepSeek-V4 API |
| OCR | PaddleOCR (Python worker) |
| 测试 | Vitest + Playwright |
| 部署 | Docker Compose |
