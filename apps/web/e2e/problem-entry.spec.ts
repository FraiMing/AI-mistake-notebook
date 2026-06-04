import { test, expect } from "@playwright/test";

test("手动录入题目 → 列表可见", async ({ page }) => {
  // 1. 登录
  await page.goto("/login");
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/problems");

  // 2. 进入录入页
  await page.click('a[href="/problems/new"]');
  await page.waitForURL("/problems/new");

  // 3. 填写内容
  const testContent = "Test: solve x^2 + 2x + 1 = 0";
  const testAnswer = "My answer: x = 1";
  await page.fill("textarea#content", testContent);
  await page.fill("textarea#answer", testAnswer);

  // 4. 提前注册 API 响应等待，再提交
  const apiResponse = page.waitForResponse(
    (resp) => resp.url().includes("/api/problems") && resp.status() === 200,
    { timeout: 15000 }
  );

  await page.click('button[type="submit"]');
  await page.waitForURL("/problems");
  await apiResponse;

  // 5. 验证数据可见
  await expect(page.locator(`text=${testContent}`)).toBeVisible();
  await expect(page.locator(`text=${testAnswer}`)).toBeVisible();
});