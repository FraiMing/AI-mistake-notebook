import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./data/ai-notebook.db"),
  AUTH_SECRET: z.string().min(8, "AUTH_SECRET 至少 8 个字符"),
  AUTH_USERNAME: z.string().min(1, "AUTH_USERNAME 不能为空"),
  AUTH_PASSWORD: z.string().min(1, "AUTH_PASSWORD 不能为空"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.string().default("9000"),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET: z.string().default("ai-notebook-images"),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("环境变量校验失败:", parsed.error.flatten());
      throw new Error("环境变量配置错误，请检查 .env 文件");
    }
    _env = parsed.data;
  }
  return _env;
}
