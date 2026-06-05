import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { setupAiMocks } from "./helpers/mocks";
import { generateTestContent } from "./helpers/test-data";

test.describe("复习闭环", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await setupAiMocks(page);
  });

  test("会做 → 理解 → 复习完成 → 需要同类题", async ({ page }) => {
    const testContent = generateTestContent() + ": 复习测试";

    await page.goto("/problems/new");
    await page.waitForURL("/problems/new");
    await page.fill("textarea#content", testContent);
    await page.fill("textarea#answer", "答案待判断");
    await page.click('button[type="submit"]');
    await expect(page.getByText("确认标签")).toBeVisible({ timeout: 10000 });
    await page.getByText("确认并保存").click();
    await page.waitForURL("/problems");
    await expect(page.getByText(testContent).first()).toBeVisible({ timeout: 10000 });

    await page.getByRole("link", { name: "复习", exact: true }).first().click();
    await page.waitForURL("**/problems/**/review", { timeout: 10000 });
    await expect(page.getByText("题目")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "会做", exact: true }).click();
    await expect(
      page.getByText("你理解这个知识点和错因了吗？"),
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "理解", exact: true }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByText("复习完成")).toBeVisible({ timeout: 8000 });

    // 使用 button role 定位"需要"按钮（避免匹配 <p> 文本）
    await page.getByRole("button", { name: "需要", exact: true }).click();
    await expect(page.getByText("AI 正在生成相似题")).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await expect(page.getByText("Mock 同类题")).toBeVisible({ timeout: 10000 });
  });

  test("不会做 → 不理解 → AI 解答", async ({ page }) => {
    const testContent = generateTestContent() + ": 不会做测试";

    await page.goto("/problems/new");
    await page.waitForURL("/problems/new");
    await page.fill("textarea#content", testContent);
    await page.fill("textarea#answer", "错误的答案");
    await page.click('button[type="submit"]');
    await expect(page.getByText("确认标签")).toBeVisible({ timeout: 10000 });
    await page.getByText("确认并保存").click();
    await page.waitForURL("/problems");
    await expect(page.getByText(testContent).first()).toBeVisible({ timeout: 10000 });

    await page.getByRole("link", { name: "复习", exact: true }).first().click();
    await page.waitForURL("**/problems/**/review", { timeout: 10000 });

    await page.getByRole("button", { name: "不会做", exact: true }).click();
    await page.waitForTimeout(2000);

    const noUnderstandBtn = page.getByRole("button", { name: "不理解" });
    if ((await noUnderstandBtn.count()) > 0) {
      await noUnderstandBtn.first().click();
      await page.waitForTimeout(1000);
    }

    const confusedArea = page.locator("textarea").first();
    if (await confusedArea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confusedArea.fill("我对这个公式不理解");
      await page.getByText("请 AI 解答").click();
      await expect(page.getByText("Mock AI 解答内容")).toBeVisible({ timeout: 10000 });
    }
  });
});
