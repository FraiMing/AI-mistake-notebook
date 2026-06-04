import Redis from "ioredis";

let _redis: Redis | null = null;

/** 获取 Redis 客户端单例 */
export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null, // BullMQ 要求
    });
  }
  return _redis;
}