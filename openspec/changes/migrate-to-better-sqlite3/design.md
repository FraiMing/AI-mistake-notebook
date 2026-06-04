## Context

packages/database/src/index.ts 当前基于 SQL.js，包含 initDb()（async）、saveDb()、ensureTables() 三个函数。该包被 pps/web 中的 Server Actions（problem-actions.ts、	ag-actions.ts）、API Routes、Auth 配置共同引用。

## Goals / Non-Goals

**Goals:**
- 切换到 better-sqlite3，消除跨 Worker 数据不一致
- 保持包对外 API 签名最小变化：initDb() 从 async 变 sync，其余导出一致
- 使 drizzle-kit push 可以正常工作
- 更新所有调用方（6 个文件）

**Non-Goals:**
- 不改变 drizzle schema
- 不改变任何业务逻辑
- 不修改 .env 或 Docker 配置

## Decisions

### 1. initDb() 从 async 变为 sync

better-sqlite3 的 
ew Database(path) 是同步构造函数，不需要像 SQL.js 那样 wait initSqlJs()。所有调用方从 const db = await initDb() 改为 const db = initDb()。

### 2. 删除 saveDb()

better-sqlite3 通过原生绑定直接写磁盘，每次 INSERT/UPDATE/DELETE 立即持久化。不再需要手动调用 saveDb()。直接删除该函数及其所有调用。

### 3. 删除 ensureTables()，改用 drizzle-kit push

SQL.js 需要运行时 CREATE TABLE IF NOT EXISTS 是因为内存数据库不持久化 schema。better-sqlite3 的 schema 由 drizzle-kit push 在部署/初次启动时写入磁盘文件，运行时不再需要。

### 4. 单例模式保留

initDb() 仍然返回缓存的 _db 单例。better-sqlite3 原生绑定下，同进程内所有对同一文件的连接共享数据，无跨 Worker 问题。

### 5. WAL 模式

初始化时执行 sqlite.pragma("journal_mode = WAL") 以提升并发读性能，避免写锁阻塞读。

## Risks / Trade-offs

- **原生模块编译**：better-sqlite3 需要 node-gyp 编译 C 绑定，在 Docker 中需确保 uild-essential 或 python3 可用。Dockerfile.web 可能需要补充依赖。
- **删除旧 DB 文件**：SQL.js 生成的 .db 文件与 better-sqlite3 兼容（同一 SQLite 格式），迁移无需删除数据。但 ensureTables 的建表逻辑将被 drizzle-kit push 替代，初次需运行 drizzle-kit push。