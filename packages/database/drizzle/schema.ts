import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";

/** 鐢ㄦ埛琛?*/
export const users = sqliteTable("User", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

/** 棰樼洰琛紙涓氬姟鏍稿績锛?*/
export const problems = sqliteTable("Problem", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  answer: text("answer").notNull(),
  imageKey: text("imageKey"),
  correctAnswer: text("correctAnswer"),
  zone: text("zone").notNull().default("TEMPORARY"),
  masteryScore: real("masteryScore").notNull().default(50),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/** 鏍囩琛?*/
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

/** 棰樼洰-鏍囩鍏宠仈琛紙澶氬澶氾級锛宻ource 瀛楁鍖哄垎 AI 鑷姩鏍囨敞 / 鎵嬪姩鏍囨敞 */
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

/** 复倪记录表 */
export const reviewLogs = sqliteTable("ReviewLog", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  problemId: integer("problemId")
    .notNull()
    .references(() => problems.id),
  understood: integer("understood").notNull(),
  reviewedAt: integer("reviewedAt", { mode: "timestamp" }).notNull(),
  confusedText: text("confusedText"),
  similarQuestionGenerated: text("similarQuestionGenerated"),
});
