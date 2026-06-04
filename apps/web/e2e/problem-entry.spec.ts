import { test, expect } from "@playwright/test";

test("手动录入题目 → 列表可见", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/problems");

  await page.click('a[href="/problems/new"]');
  await page.waitForURL("/problems/new");

  const testContent = "Test: solve x^2 + 2x + 1 = 0";
  const testAnswer = "My answer: x = 1";
  await page.fill("textarea#content", testContent);
  await page.fill("textarea#answer", testAnswer);

  await page.click('button[type="submit"]');
  await page.waitForURL("/problems");

  // 等待 TanStack Query 获取数据并渲染
  await expect(page.locator(`text=${testContent}`)).toBeVisible({ timeout: 10000 });
  await expect(page.locator(`text=${testAnswer}`)).toBeVisible({ timeout: 5000 });
});