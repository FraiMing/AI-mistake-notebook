## Why

Next.js 16 默认使用 Turbopack，dev server 以多 Worker 模式运行。SQL.js 作为纯 JS 的 SQLite 模拟，每个 Worker 持有独立的内存 Database 实例。Server Action 在 Worker A 写入数据后通过 saveDb() 持久化到磁盘，但 API Route 在 Worker B 从磁盘加载时可能读到旧快照——两者之间无共享状态，唯一的同步点是文件系统，而读写时序不可靠。这直接导致 E2E 测试反复出现「跳转成功但数据为空」的失败，且该问题会持续影响所有后续步骤。

better-sqlite3 通过原生 C 绑定直接操作磁盘文件，所有 Worker 共享同一个持久存储，不存在内存副本隔离问题。同时它原生支持 drizzle-kit push 的 schema 迁移，不再需要手动 SQL。

## What Changes

- **替换** 数据库驱动：packages/database 中 sql.js → etter-sqlite3
- **删除** saveDb() 函数——better-sqlite3 写入即时持久化到磁盘
- **删除** ensureTables() 函数——schema 管理由 drizzle-kit push 接管
- **同步化** initDb()——从 sync function 变为普通函数，所有调用方去掉 wait
- **更新** scripts/seed.ts——改用 better-sqlite3 API
- **更新** 所有 Server Action 和 API Route：移除 saveDb() 调用
- **恢复** /api/problems 的标签 JOIN 查询（Tag/ProblemTag 表现在由 drizzle-kit push 管理）

## Capabilities

### New Capabilities
<!-- 无 —— 纯技术迁移，不引入新能力 -->

### Modified Capabilities
<!-- 无 —— 所有 spec 级别的 requirement 不变，仅实现层替换 -->

## Impact

- **不改变任何 spec 行为**——题目录入、标签管理、筛选等需求不变
- **命令行契约变化**：
  - ensureTables() 由 drizzle-kit push 替代（需在部署/本地初次启动时运行）
  - initDb() 从异步变为同步
  - saveDb() 删除
- **后续步骤受益**：Step 4~11 的所有 DB schema 修改可直接通过 drizzle-kit push 完成