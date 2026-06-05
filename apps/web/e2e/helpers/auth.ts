import { type Page } from "@playwright/test";

/**
 * 登录 helper：导航到 /login → 填写凭据 → 提交 → 等待跳转到 /problems
 */
export async function login(
  page: Page,
  username = "admin",
  password = "admin123",
) {
  await page.goto("/login");
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/problems");
}
