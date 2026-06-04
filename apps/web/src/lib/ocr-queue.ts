import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis-client";

let _ocrQueue: Queue | null = null;

/** 获取 OCR 任务队列单例 */
export function getOcrQueue(): Queue {
  if (!_ocrQueue) {
    _ocrQueue = new Queue("ocr-queue", { connection: getRedis() });
  }
  return _ocrQueue;
}

/** 添加 OCR 识别任务 */
export async function addOcrJob(imageKey: string, bucket?: string): Promise<void> {
  const queue = getOcrQueue();
  await queue.add("ocr", {
    imageKey,
    bucket: bucket ?? "ai-notebook-images",
  }, {
    attempts: 3,
    backoff: { type: "fixed", delay: 2000 },
  });
}