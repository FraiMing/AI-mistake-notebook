import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { generateTestContent } from "./helpers/test-data";

test.describe("标签管理", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("创建标签 → 录入打标 → 按标签筛选 → 清除筛选", async ({ page }) => {
    const tagNames = ["数学-E2E", "粗心-E2E"];

    // 进入标签管理页，创建两个标签
    await page.goto("/tags");
    await page.waitForURL("/tags");

    // 创建数学标签
    await page.fill('input[placeholder="标签名称"]', tagNames[0]);
    await page.selectOption("select", "SUBJECT");
    await page.locator("button svg.lucide-plus").locator("..").click();
    await expect(page.getByText(tagNames[0]).first()).toBeVisible({
      timeout: 5000,
    });

    // 创建粗心标签
    await page.fill('input[placeholder="标签名称"]', tagNames[1]);
    await page.selectOption("select", "ERROR_REASON");
    await page.locator("button svg.lucide-plus").locator("..").click();
    await expect(page.getByText(tagNames[1]).first()).toBeVisible({
      timeout: 5000,
    });

    // 录入题目并打标
    await page.goto("/problems/new");
    await page.waitForURL("/problems/new");
    const testContent = generateTestContent() + ": 2x + 1 = 5";
    await page.fill("textarea#content", testContent);
    await page.fill("textarea#answer", "x = 3");

    // 选择学科标签
    await page.getByText("学科").click();
    const subjBtn = page.locator("button", { hasText: tagNames[0] });
    if ((await subjBtn.count()) > 0) await subjBtn.click();
    await page.locator("body").click({ position: { x: 0, y: 0 } });

    // 选择错因标签
    await page.getByText("错因").click();
    const errBtn = page.locator("button", { hasText: tagNames[1] });
    if ((await errBtn.count()) > 0) await errBtn.click();
    await page.locator("body").click({ position: { x: 0, y: 0 } });

    // 保存
    await page.click('button[type="submit"]');
    await page.waitForURL("/problems");

    // 验证题目出现
    await expect(page.getByText(testContent).first()).toBeVisible({
      timeout: 10000,
    });

    // 按标签筛选
    await page.locator("select").first().selectOption({ label: tagNames[0] });
    await expect(page.getByText(testContent).first()).toBeVisible({
      timeout: 5000,
    });

    // 清除筛选
    await page.getByText("清除筛选").click();
    await expect(page.getByText(testContent).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("编辑标签名", async ({ page }) => {
    await page.goto("/tags");
    await page.waitForURL("/tags");

    // 找到一个可编辑的标签行
    const editBtns = page.locator("button svg.lucide-pencil");
    if ((await editBtns.count()) === 0) {
      test.skip(true, "无现有标签可编辑");
    }

    await editBtns.first().locator("..").click();
    // 修改名称
    await page.fill('input[type="text"]', "已编辑-E2E");
    // 保存
    await page.getByText("保存").click();
    await expect(page.getByText("已编辑-E2E")).toBeVisible({ timeout: 5000 });
  });

  test("删除标签", async ({ page }) => {
    await page.goto("/tags");
    await page.waitForURL("/tags");

    // 找到一个可删除的标签行
    const deleteBtns = page.locator("button svg.lucide-trash2");
    if ((await deleteBtns.count()) === 0) {
      test.skip(true, "无现有标签可删除");
    }

    const beforeCount = await page.locator(".rounded-lg").count();
    await deleteBtns.first().locator("..").click();
    // 确认删除对话框
    const confirmBtn = page.getByText("确认");
    if (await confirmBtn.isVisible({ timeout: 2000 })) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(1000);
    const afterCount = await page.locator(".rounded-lg").count();
    expect(afterCount).toBeLessThan(beforeCount);
  });
});
