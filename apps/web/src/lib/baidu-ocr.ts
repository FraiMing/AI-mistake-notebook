/**
 * 百度云文字识别 API 封装
 * 文档：https://cloud.baidu.com/doc/OCR/s/zk3h7xz52
 */

const TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";
const OCR_URL = "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic";

interface TokenCache {
  accessToken: string;
  expiresAt: number; // 毫秒时间戳
}

let _tokenCache: TokenCache | null = null;

/** 获取 Access Token（OAuth2，缓存 30 天） */
async function getAccessToken(): Promise<string | null> {
  // 检查缓存
  if (_tokenCache && _tokenCache.expiresAt > Date.now() + 60000) {
    return _tokenCache.accessToken;
  }

  const apiKey = process.env.BAIDU_OCR_API_KEY;
  const secretKey = process.env.BAIDU_OCR_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: secretKey,
    });

    const res = await fetch(`${TOKEN_URL}?${params.toString()}`, {
      method: "POST",
    });

    if (!res.ok) return null;

    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;

    _tokenCache = {
      accessToken: data.access_token,
      // 提前 1 小时过期避免边界问题
      expiresAt: Date.now() + (data.expires_in ?? 2592000) * 1000 - 3600000,
    };

    return data.access_token;
  } catch {
    return null;
  }
}

/** OCR 识别结果 */
export interface OcrResult {
  text: string | null;
  error?: string;
}

/** 调用百度云通用文字识别 API */
export async function recognizeText(imageBase64: string): Promise<OcrResult> {
  const token = await getAccessToken();
  if (!token) {
    return { text: null, error: "百度 API 鉴权失败，请检查 BAIDU_OCR_API_KEY/SECRET_KEY" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const params = new URLSearchParams({
      access_token: token,
    });

    const res = await fetch(`${OCR_URL}?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image: imageBase64,
        language_type: "CHN_ENG",
        detect_direction: "true",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as { error_msg?: string };
      return { text: null, error: errData.error_msg ?? `API 返回 ${res.status}` };
    }

    const data = await res.json() as {
      words_result?: Array<{ words: string }>;
      words_result_num?: number;
    };

    const words = data.words_result ?? [];
    if (words.length === 0) {
      return { text: "" };
    }

    const text = words.map((w) => w.words).join("\n");
    return { text };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { text: null, error: "OCR 识别超时" };
    }
    return { text: null, error: err instanceof Error ? err.message : "OCR 请求失败" };
  }
}