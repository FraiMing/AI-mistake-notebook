## 1. API Routes — 替换 `.all().filter()` 为 `.where(eq())`

- [x] 1.1 `api/problems/route.ts`：`all().filter(userId)` → `where(eq(problems.userId, userId))`，zone 过滤并入 WHERE，分页改用 `.limit()`/`.offset()`，标签关联改为两阶段 `inArray()` 查询
- [x] 1.2 `api/problems/[id]/route.ts`：`all().filter(id)` → `where(eq(problems.id, id)).get()`，`problemTags` + `tags` 改为 SQL 过滤
- [x] 1.3 `api/messages/route.ts`：`all().filter(userId)` → `where(eq(messages.userId, userId))`，关联表改为 SQL 过滤
- [x] 1.4 `api/messages/count/route.ts`：`all().filter()` → `where(eq(col, val)).all()` 计数
- [x] 1.5 `api/tags/route.ts`：已使用 `where(eq())`，无需修改

## 2. Server Actions — 修复 `Math.max` hack 和静默 catch

- [x] 2.1 `lib/problem-actions.ts`：`Math.max(allP.map(p => p.id))` → `db.insert().returning({ id: problems.id })`
- [x] 2.2 `lib/problem-actions.ts`：静默 `catch {}` 改为 `catch (e) { console.error("AI 标注失败", e) }`
- [x] 2.3 `lib/baidu-ocr.ts`：`getAccessToken()` 静默 `catch {}` 改为 `catch (e) { console.error("百度 Token 获取失败", e); return null }`

## 3. push-actions — 保留全量加载但加 userId 过滤

- [x] 3.1 `lib/push-actions.ts`：`all().filter(p => p.userId === userId)` 改为 `where(eq(problems.userId, userId)).all()`，其余表同理

## 4. 验证

- [ ] 4.1 `pnpm dev` 启动，验证题目列表、新建题目、消息列表、标签筛选均正常返回
- [ ] 4.2 在应用内新建一道题目，确认保存成功且导航到列表页
- [ ] 4.3 验证分页参数 `?page=2&limit=20` 正确工作