import { Client as MinioClient } from 'minio';
import { getEnv } from '@/lib/env';

let _minio: MinioClient | null = null;

/** 获取 MinIO 客户端单例 */
export function getMinioClient(): MinioClient {
  if (!_minio) {
    const env = getEnv();
    _minio = new MinioClient({
      endPoint: env.MINIO_ENDPOINT,
      port: Number(env.MINIO_PORT),
      useSSL: false,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }
  return _minio;
}

/** 上传图片到 MinIO，返回 imageKey（文件路径） */
export async function uploadImage(
  file: Buffer,
  fileName: string,
): Promise<string> {
  const env = getEnv();
  const client = getMinioClient();

  // 确保 bucket 存在
  const bucketExists = await client.bucketExists(env.MINIO_BUCKET);
  if (!bucketExists) {
    await client.makeBucket(env.MINIO_BUCKET);
  }

  await client.putObject(env.MINIO_BUCKET, fileName, file, file.length, {
    'Content-Type': fileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
  });

  return fileName;
}

/** 生成 MinIO 预签名 GET URL */
export async function getPresignedUrl(
  imageKey: string,
  expirySeconds: number = 300,
): Promise<string> {
  const env = getEnv();
  const client = getMinioClient();
  return client.presignedGetObject(env.MINIO_BUCKET, imageKey, expirySeconds);
}