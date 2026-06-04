import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import * as path from "node:path";

const dbPath = path.resolve((process.env.DATABASE_URL ?? "file:./data/ai-notebook.db").replace("file:", ""));
const db = new Database(dbPath);

const username = process.env.AUTH_USERNAME ?? "admin";
const password = process.env.AUTH_PASSWORD ?? "admin123";
const hash = bcrypt.hashSync(password, 10);
const now = Date.now();

const existing = db.prepare("SELECT id FROM User WHERE username = ?").get(username);
if (!existing) {
  db.prepare("INSERT INTO User (username, passwordHash, createdAt) VALUES (?, ?, ?)").run(username, hash, now);
  console.log("预设用户已创建: " + username + " / " + password);
} else {
  console.log("预设用户已存在，跳过");
}
db.close();
console.log("种子数据写入完成");