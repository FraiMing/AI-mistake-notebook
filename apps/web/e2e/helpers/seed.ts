import { initDb, saveDb, users, eq } from "@ai-notebook/database";
import bcrypt from "bcryptjs";

export default async function globalSetup() {
  try {
    const db = await initDb();
    const existing = db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .get();
    if (existing) {
      console.log("[e2e seed] admin 用户已存在");
      return;
    }
    const passwordHash = await bcrypt.hash("admin123", 10);
    db.insert(users)
      .values({ username: "admin", passwordHash, createdAt: new Date() })
      .run();
    saveDb();
    console.log("[e2e seed] admin 用户已创建");
  } catch (e) {
    console.error("[e2e seed] 失败:", e);
    process.exit(1);
  }
}
