import initSqlJs from "sql.js";
import * as fs from "node:fs";
import * as path from "node:path";

const dbPath = (process.env.DATABASE_URL ?? "file:./data/ai-notebook.db").replace("file:", "");
const migrationsDir = path.resolve("packages/database/drizzle/migrations");

async function run() {
  const SQL = await initSqlJs();

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let db: import("sql.js").Database;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      db.run(sql);
      console.log("  applied:", file);
    }
    console.log("迁移完成，" + files.length + " 个文件");
  } else {
    console.log("无迁移目录，将创建空数据库");
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
}

run().catch((e) => {
  console.error("迁移失败:", e);
  process.exit(1);
});
