import { type Page } from "@playwright/test";

/**
 * Mock 所有 AI 相关 API 端点，返回预设数据。
 * 仅拦截 Content-Type 为 application/json 的请求（不拦截服务器 Action）。
 */
export async function setupAiMocks(page: Page) {
  // Mock AI 标签分析 - 仅拦截 JSON 请求
  await page.route("**/api/problems", async (route) => {
    const ct = route.request().headers()["content-type"] ?? "";
    if (!ct.includes("application/json")) {
      return route.continue();
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        aiSuggestions: [
          { tagName: "数学", tagType: "SUBJECT", tagId: 999 },
          { tagName: "粗心", tagType: "ERROR_REASON", tagId: 998 },
        ],
      }),
    });
  });

  // review 页面期望 data.answer
  await page.route("**/api/review/correct-answer", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ answer: "x = -1（Mock 正确作答）" }),
    });
  });

  await page.route("**/api/review/explain", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        explanation:
          "这是 Mock AI 解答内容。解题思路：通过因式分解将方程化为标准形式，再利用求根公式计算。",
      }),
    });
  });

  await page.route("**/api/review/similar-question", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        question: "解方程 x² - 4x + 3 = 0（Mock 同类题）",
        correctAnswer: "x = 1 或 x = 3",
        knowledgePoint: "二次方程",
      }),
    });
  });
}

/**
 * Mock 图片上传 API，返回固定的 imageKey + OCR 内容。
 */
export async function setupUploadMock(page: Page) {
  await page.route("**/api/upload", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        imageKey: "test/e2e-mock-image.jpg",
        ocrContent: "E2E OCR 识别内容: 解方程 x²+2x+1=0",
      }),
    });
  });
}
