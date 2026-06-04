import type { SQLJsDatabase } from "drizzle-orm/sql-js";
import * as schema from "../drizzle/schema";
import * as fs from "node:fs";
import * as path from "node:path";

let _sqlJsDb: import("sql.js").Database | null = null;
let _dbPath = "";

/** 每次调用都重新从磁盘加载，保证多 Worker 间数据一致 */
export async function initDb(): Promise<SQLJsDatabase<typeof schema>> {
  const [initSqlJsMod, { drizzle }] = await Promise.all([
    import("sql.js"),
    import("drizzle-orm/sql-js"),
  ]);

  const initSqlJs = initSqlJsMod.default;

  _dbPath = path.resolve(
    (process.env.DATABASE_URL ?? "file:./data/ai-notebook.db").replace("file:", "")
  );

  const wasmPath = path.resolve(process.cwd(), "public/sql-wasm.wasm");
  const SQL = await initSqlJs({ locateFile: () => wasmPath });

  const dir = path.dirname(_dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(_dbPath)) {
    _sqlJsDb = new SQL.Database(fs.readFileSync(_dbPath));
  } else {
    _sqlJsDb = new SQL.Database();
  }

  ensureTables(_sqlJsDb);

  return drizzle(_sqlJsDb, { schema });
}

function ensureTables(db: import("sql.js").Database) {
  db.run(`CREATE TABLE IF NOT EXISTS "User" ("id" integer PRIMARY KEY AUTOINCREMENT, "username" text NOT NULL UNIQUE, "passwordHash" text NOT NULL, "createdAt" integer NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS "Problem" ("id" integer PRIMARY KEY AUTOINCREMENT, "userId" integer NOT NULL REFERENCES "User"("id"), "content" text NOT NULL, "answer" text NOT NULL, "imageKey" text, "zone" text NOT NULL DEFAULT 'TEMPORARY', "masteryScore" real NOT NULL DEFAULT 50, "createdAt" integer NOT NULL, "updatedAt" integer NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS "Tag" ("id" integer PRIMARY KEY AUTOINCREMENT, "name" text NOT NULL, "type" text NOT NULL, "userId" integer NOT NULL REFERENCES "User"("id"), "createdAt" integer NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS "ProblemTag" ("problemId" integer NOT NULL REFERENCES "Problem"("id"), "tagId" integer NOT NULL REFERENCES "Tag"("id"), "source" text NOT NULL DEFAULT 'MANUAL', PRIMARY KEY ("problemId", "tagId"))`);
  
  // 迁移旧表：如果 ProblemTag 表没有 source 列，追加
  try {
    db.run("ALTER TABLE ProblemTag ADD COLUMN source TEXT NOT NULL DEFAULT 'MANUAL'");
  } catch {
    // 列已存在，忽略
  }
}

export function saveDb() {
  if (!_sqlJsDb || !_dbPath) return;
  const dir = path.dirname(_dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(_dbPath, Buffer.from(_sqlJsDb.export()));
}

export { eq, desc, and, inArray } from "drizzle-orm";
export * from "../drizzle/schema";
