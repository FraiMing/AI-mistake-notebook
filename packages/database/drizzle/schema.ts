import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";

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

/** 标签表 */
export const tags = sqliteTable("Tag", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["SUBJECT", "KNOWLEDGE_POINT", "ERROR_REASON"] })
    .notNull(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

/** 题目-标签关联表（多对多），source 字段区分 AI 自动标注 / 手动标注 */
export const problemTags = sqliteTable(
  "ProblemTag",
  {
    problemId: integer("problemId")
      .notNull()
      .references(() => problems.id),
    tagId: integer("tagId")
      .notNull()
      .references(() => tags.id),
    source: text("source", { enum: ["AI", "MANUAL"] })
      .notNull()
      .default("MANUAL"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.problemId, table.tagId] }),
  })
);
