## 1. 数据库包重构

- [ ] 1.1 修改 packages/database/package.json：添加 etter-sqlite3 依赖，移除 sql.js（如果不被其他地方引用）
- [ ] 1.2 重写 packages/database/src/index.ts：用 etter-sqlite3 替换 sql.js，initDb() 变同步，删除 saveDb() 和 ensureTables()
- [ ] 1.3 更新 packages/database/drizzle.config.ts：确认 dbCredentials.url 与 DATABASE_URL 一致

## 2. 调用方迁移

- [ ] 2.1 更新 pps/web/src/lib/auth.ts：wait initDb() → initDb()
- [ ] 2.2 重写 pps/web/src/lib/problem-actions.ts：去掉 saveDb()，wait initDb() → initDb()，恢复标签关联逻辑（.returning().get() 获取插入 ID）
- [ ] 2.3 更新 pps/web/src/lib/tag-actions.ts：去掉所有 saveDb()，wait initDb() → initDb()
- [ ] 2.4 更新 pps/web/src/app/api/problems/route.ts：恢复 Tag/ProblemTag JOIN 查询
- [ ] 2.5 更新 pps/web/src/app/api/tags/route.ts：wait initDb() → initDb()
- [ ] 2.6 重写 scripts/seed.ts：用 better-sqlite3 API 替换 sql.js

## 3. Schema 迁移

- [ ] 3.1 运行 drizzle-kit push 将 Tag、ProblemTag 写入数据库文件
- [ ] 3.2 运行 scripts/seed.ts 确保预设用户存在

## 4. 验证

- [ ] 4.1 	sc --noEmit 零类型错误
- [ ] 4.2 itest run 全部通过
- [ ] 4.3 pnpm test:e2e 两条用例通过