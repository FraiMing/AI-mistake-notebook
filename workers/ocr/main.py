"""OCR Worker — 消费 BullMQ 任务，调用 PaddleOCR 进行文字识别"""
import os
import json
import logging
from minio import Minio
from bullmq import Worker, Job
import redis.asyncio as redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ocr-worker")

# 配置
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
MINIO_ENDPOINT = os.environ.get("MINIO_ENDPOINT", "localhost")
MINIO_PORT = os.environ.get("MINIO_PORT", "9000")
MINIO_ACCESS_KEY = os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.environ.get("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.environ.get("MINIO_BUCKET", "ai-notebook-images")

# 延迟加载 PaddleOCR（避免导入时加载模型）
_paddle_ocr = None


def get_paddle_ocr():
    global _paddle_ocr
    if _paddle_ocr is None:
        from paddleocr import PaddleOCR
        _paddle_ocr = PaddleOCR(use_angle_cls=True, lang="ch")
    return _paddle_ocr


def get_minio_client():
    return Minio(
        f"{MINIO_ENDPOINT}:{MINIO_PORT}",
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False,
    )


async def process_ocr(job: Job, token: str):
    """处理 OCR 任务：下载图片 → PaddleOCR 推理 → 写回 Redis"""
    # BullMQ Python 库传入 Job 对象，数据在 job.data 中
    job_data = job.data
    image_key = job_data.get("imageKey", "")
    bucket = job_data.get("bucket", MINIO_BUCKET)

    logger.info(f"开始处理 OCR 任务 [{job.id}]: {image_key}")

    try:
        # 1. 从 MinIO 下载图片
        minio_client = get_minio_client()
        image_data = minio_client.get_object(bucket, image_key)

        # 将图片数据写入临时文件（PaddleOCR 需要文件路径）
        tmp_path = f"/tmp/{os.path.basename(image_key)}"
        with open(tmp_path, "wb") as f:
            f.write(image_data.read())

        # 2. PaddleOCR 推理
        ocr = get_paddle_ocr()
        results = ocr.ocr(tmp_path, cls=True)

        # 清理临时文件
        os.remove(tmp_path)

        # 3. 提取文本
        content_lines: list[str] = []
        if results and results[0]:
            for line in results[0]:
                text = line[1][0]
                content_lines.append(text)

        content = "\n".join(content_lines) if content_lines else ""
        answer = ""  # PaddleOCR 不区隔题目与答案，统一放 content

        result = json.dumps({
            "status": "completed",
            "content": content,
            "answer": answer,
        }, ensure_ascii=False)

        logger.info(f"OCR 识别完成: {image_key}, 识别行数: {len(content_lines)}")

    except Exception as e:
        logger.error(f"OCR 识别失败: {image_key}, 错误: {e}")
        result = json.dumps({
            "status": "failed",
            "error": str(e),
        }, ensure_ascii=False)

    # 4. 写回 Redis（TTL 600 秒）
    r = await redis.from_url(REDIS_URL)
    await r.set(f"ocr-result:{image_key}", result, ex=600)
    await r.close()


async def main():
    logger.info("OCR Worker 启动中...")

    # 初始化 PaddleOCR（预加载模型）
    logger.info("正在加载 PaddleOCR 模型...")
    get_paddle_ocr()
    logger.info("PaddleOCR 模型加载完成")

    # 创建 BullMQ Worker
    worker = Worker(
        "ocr-queue",
        process_ocr,
        {
            "connection": REDIS_URL,
        },
    )

    logger.info("OCR Worker 已就绪，等待任务...")
    await worker.run()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())