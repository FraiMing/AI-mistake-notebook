import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { setupAiMocks, setupUploadMock } from "./helpers/mocks";
import { generateTestContent } from "./helpers/test-data";

// 1x1 透明 PNG base64
const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("照片上传流程", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await setupAiMocks(page);
    await setupUploadMock(page);
  });

  test("照片上传 → OCR 回填 → 保存 → 列表缩略图", async ({ page }) => {
    await page.goto("/problems/new");
    await page.waitForURL("/problems/new");

    // 点击上传区域
    await page.getByText("拍照或选择图片").click();

    // 选择文件上传（1x1 空白 PNG）
    await page.locator('input[type="file"]').setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_1X1_BASE64, "base64"),
    });

    // 验证上传完成提示
    await expect(page.getByText("上传完成")).toBeVisible({
      timeout: 10000,
    });

    // 验证图片预览出现
    await expect(page.locator("img[alt='题目图片预览']")).toBeVisible({
      timeout: 10000,
    });

    // 验证 content 被 OCR 结果自动填入
    const contentValue = await page.locator("textarea#content").inputValue();
    expect(contentValue).toContain("E2E OCR");

    // 修改 answer
    await page.fill(
      "textarea#answer",
      generateTestContent() + ": photo e2e",
    );

    // 下一步 → 确认保存
    await page.click('button[type="submit"]');
    await expect(page.getByText("确认标签")).toBeVisible({
      timeout: 10000,
    });
    await page.getByText("确认并保存").click();
    await page.waitForURL("/problems");

    // 验证题目出现在列表中
    await expect(page.getByText(contentValue).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
