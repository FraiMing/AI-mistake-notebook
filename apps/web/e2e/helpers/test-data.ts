/**
 * 生成带时间戳的唯一测试内容字符串
 */
export function generateTestContent(): string {
  return "E2E-" + Date.now();
}
