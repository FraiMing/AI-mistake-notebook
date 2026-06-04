import type { SQLJsDatabase } from "drizzle-orm/sql-js";
import * as schema from "../drizzle/schema";
import * as fs from "node:fs";
import * as path from "node:path";

let _db: SQLJsDatabase<typeof schema> | null = null;
let _sqlJsDb: import("sql.js").Database | null = null;
let _dbPath = "";

export async function initDb(
  forceReload = false
): Promise<SQLJsDatabase<typeof schema>> {
  if (_db && !forceReload) return _db;

  const [initSqlJsMod, { drizzle }] = await Promise.all([
    import("sql.js"),
    import("drizzle-orm/sql-js"),
  ]);

  const initSqlJs = initSqlJsMod.default;

  _dbPath = path.resolve(
    (process.env.DATABASE_URL ?? "file:./data/ai-notebook.db").replace(
      "file:",
      ""
    )
  );

  const wasmPath = path.resolve(process.cwd(), "public/sql-wasm.wasm");
  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  });
  const dir = path.dirname(_dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(_dbPath)) {
    _sqlJsDb = new SQL.Database(fs.readFileSync(_dbPath));
  } else {
    _sqlJsDb = new SQL.Database();
  }

  _db = drizzle(_sqlJsDb, { schema });
  return _db;
}

export function saveDb() {
  if (!_sqlJsDb || !_dbPath) return;
  const dir = path.dirname(_dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(_dbPath, Buffer.from(_sqlJsDb.export()));
}

export { eq, desc } from "drizzle-orm";
export * from "../drizzle/schema";