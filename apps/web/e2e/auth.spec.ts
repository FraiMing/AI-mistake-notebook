import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("认证流程", () => {
  test("登录成功 → 跳转到题目列表", async ({ page }) => {
    await login(page);
    await expect(page.locator("h2")).toContainText("错题本");
  });

  test("登录失败 → 显示错误提示", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // 应停留在 /login 或显示错误提示
    await expect(page.locator(".text-destructive")).toBeVisible({
      timeout: 5000,
    });
    // URL 不应跳转到 /problems
    expect(page.url()).not.toContain("/problems");
  });

  test("未登录访问受保护页面 → 重定向到登录页", async ({ page }) => {
    await page.goto("/problems");
    await page.waitForURL("**/login**", { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});
