import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { setupAiMocks } from "./helpers/mocks";
import { generateTestContent } from "./helpers/test-data";

test.describe("题目录入流程", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await setupAiMocks(page);
  });

  test("手动录入 → AI 标签确认 → 保存 → 列表可见", async ({ page }) => {
    const testContent = generateTestContent() + ": solve x^2 + 2x + 1 = 0";
    const testAnswer = "My answer: x = 1";

    await page.goto("/problems/new");
    await page.waitForURL("/problems/new");

    await page.fill("textarea#content", testContent);
    await page.fill("textarea#answer", testAnswer);

    // 点击下一步，短暂等待 React 状态转换
    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);

    // 等待确认面板出现（mock 瞬间返回，确认面板就是 confirm step）
    await expect(page.getByText("确认标签")).toBeVisible({
      timeout: 15000,
    });

    // 验证 AI 建议标签可见
    await expect(page.getByText("AI 建议标签")).toBeVisible();
    await expect(page.getByText("数学")).toBeVisible();

    // 确认并保存
    await page.getByText("确认并保存").click();
    await page.waitForURL("/problems");

    // 验证题目出现在列表中
    await expect(page.getByText(testContent).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(testAnswer).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("content 为空 → 显示校验提示", async ({ page }) => {
    await page.goto("/problems/new");
    await page.waitForURL("/problems/new");
    await page.fill("textarea#answer", "some answer");
    await page.click('button[type="submit"]');
    await expect(page.getByText("题目内容不能为空")).toBeVisible({
      timeout: 5000,
    });
  });

  test("answer 为空 → 显示校验提示", async ({ page }) => {
    await page.goto("/problems/new");
    await page.waitForURL("/problems/new");
    await page.fill("textarea#content", "some content");
    await page.click('button[type="submit"]');
    await expect(page.getByText("错误作答不能为空")).toBeVisible({
      timeout: 5000,
    });
  });
});
