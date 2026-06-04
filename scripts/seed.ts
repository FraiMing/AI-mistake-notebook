import initSqlJs from "sql.js";
import bcrypt from "bcryptjs";
import * as fs from "node:fs";
import * as path from "node:path";

const dbPath = path.resolve((process.env.DATABASE_URL ?? "file:./data/ai-notebook.db").replace("file:", ""));

async function run() {
  const SQL = await initSqlJs();

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let db: import("sql.js").Database;
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }

  const username = process.env.AUTH_USERNAME ?? "admin";
  const password = process.env.AUTH_PASSWORD ?? "admin123";
  const hash = bcrypt.hashSync(password, 10);
  const now = Date.now();

  const stmt = db.prepare("SELECT id FROM User WHERE username = ?");
  stmt.bind([username]);
  const existing = stmt.step();
  stmt.free();

  if (!existing) {
    db.run("INSERT INTO User (username, passwordHash, createdAt) VALUES (?, ?, ?)", [username, hash, now]);
    console.log("预设用户已创建: " + username + " / " + password);
  } else {
    console.log("预设用户已存在，跳过");
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();
  console.log("种子数据写入完成");
}

run().catch((e) => {
  console.error("种子脚本失败:", e);
  process.exit(1);
});