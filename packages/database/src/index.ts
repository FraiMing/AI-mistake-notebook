import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../drizzle/schema";
import * as path from "node:path";
import * as fs from "node:fs";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function initDb() {
  if (_db) return _db;

  const dbPath = path.resolve(
    (process.env.DATABASE_URL ?? "file:./data/ai-notebook.db").replace("file:", "")
  );

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  _db = drizzle(sqlite, { schema });
  return _db;
}

export { eq, desc, and, inArray } from "drizzle-orm";
export * from "../drizzle/schema";