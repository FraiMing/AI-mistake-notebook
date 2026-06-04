/** 标签类型枚举 */
export const TagType = {
  SUBJECT: "SUBJECT",
  KNOWLEDGE_POINT: "KNOWLEDGE_POINT",
  ERROR_REASON: "ERROR_REASON",
} as const;
export type TagType = (typeof TagType)[keyof typeof TagType];

/** 分区枚举 */
export const Zone = {
  TEMPORARY: "TEMPORARY",
  ARCHIVED: "ARCHIVED",
} as const;
export type Zone = (typeof Zone)[keyof typeof Zone];

/** 题目（纯类型，无运行时依赖） */
export type Problem = {
  id: number;
  userId: number;
  content: string;
  answer: string;
  imageKey: string | null;
  zone: Zone;
  masteryScore: number;
  createdAt: Date;
  updatedAt: Date;
};
