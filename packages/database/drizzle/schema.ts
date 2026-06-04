import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/** 用户表 */
export const users = sqliteTable("User", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

/** 题目表（业务核心） */
export const problems = sqliteTable("Problem", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  answer: text("answer").notNull(),
  imageKey: text("imageKey"),
  zone: text("zone").notNull().default("TEMPORARY"),
  masteryScore: real("masteryScore").notNull().default(50),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});
