import { test, expect } from "@playwright/test";

test("创建标签 → 录入打标 → 筛选", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/problems");

  // 创建两个标签
  await page.click('a[href="/tags"]');
  await page.waitForURL("/tags");

  await page.fill('input[placeholder="标签名称"]', "数学");
  await page.selectOption("select", "SUBJECT");
  await page.click('button:has(svg.lucide-plus)');
  // 等待标签出现在列表中
  await expect(page.locator("text=数学")).toBeVisible({ timeout: 5000 });

  await page.fill('input[placeholder="标签名称"]', "粗心");
  await page.selectOption("select", "ERROR_REASON");
  await page.click('button:has(svg.lucide-plus)');
  await expect(page.locator("text=粗心")).toBeVisible({ timeout: 5000 });

  // 录入题目并打标
  await page.click('a[href="/problems/new"]');
  await page.waitForURL("/problems/new");
  await page.fill("textarea#content", "Filter test: 2x + 1 = 5");
  await page.fill("textarea#answer", "x = 3");

  // 学科下拉：打开 → 点击"数学"按钮本身（toggleTag）
  await page.click('button:has-text("学科")');
  await page.locator('div[role="menu"] button:has-text("数学"), button:has-text("学科") + div button:has-text("数学"), .absolute button:has-text("数学")').waitFor({ timeout: 3000 });
  await page.locator('.absolute button:has-text("数学"), div:not([class*="hidden"]) button:has-text("数学")').first().click();
  // 用 force click 来点任何可见的"数学"按钮
  // 关闭下拉
  await page.click("body", { position: { x: 0, y: 0 } });

  // 错因下拉
  await page.click('button:has-text("错因")');
  await page.locator('.absolute button:has-text("粗心"), div:not([class*="hidden"]) button:has-text("粗心")').first().click();
  await page.click("body", { position: { x: 0, y: 0 } });

  await page.click('button[type="submit"]');
  await page.waitForURL("/problems");

  // 验证题目出现在列表中
  await expect(page.locator("text=Filter test: 2x + 1 = 5")).toBeVisible({ timeout: 10000 });

  // 筛选：选择学科=数学
  await page.selectOption('select >> nth=0', { label: "数学" });
  await expect(page.locator("text=Filter test: 2x + 1 = 5")).toBeVisible({ timeout: 5000 });

  // 清除筛选
  await page.click('button:has-text("清除筛选")');
  await expect(page.locator("text=Filter test: 2x + 1 = 5")).toBeVisible({ timeout: 5000 });
});