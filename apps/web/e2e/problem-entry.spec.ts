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

    // 进入录入页
    await page.goto("/problems/new");
    await page.waitForURL("/problems/new");

    // 填写表单
    await page.fill("textarea#content", testContent);
    await page.fill("textarea#answer", testAnswer);

    // 点击下一步触发 AI 分析
    await page.click('button[type="submit"]');

    // 验证 AI 加载态
    await expect(page.getByText("AI 正在分析错题")).toBeVisible({
      timeout: 5000,
    });

    // 等待确认面板出现
    await expect(page.getByText("确认标签")).toBeVisible({
      timeout: 10000,
    });

    // 验证 AI 建议标签可见
    await expect(page.getByText("AI 建议标签")).toBeVisible();
    await expect(page.getByText("数学")).toBeVisible();

    // 移除一个 AI 建议标签 - 查找 AI 建议区域中的关闭按钮
    const aiSection = page.locator(".rounded-md.border-blue-200");
    const removeBtn = aiSection.locator("button").filter({
      has: page.locator("svg.lucide-x"),
    });
    const removeCount = await removeBtn.count();
    if (removeCount > 0) {
      await removeBtn.first().click();
    }

    // 确认并保存
    await page.getByText("确认并保存").click();

    // 等待跳转到列表页
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

    // 不填 content，只填 answer
    await page.fill("textarea#answer", "some answer");

    // 提交
    await page.click('button[type="submit"]');

    // 应显示校验错误
    await expect(page.getByText("题目内容不能为空")).toBeVisible({
      timeout: 5000,
    });
  });

  test("answer 为空 → 显示校验提示", async ({ page }) => {
    await page.goto("/problems/new");
    await page.waitForURL("/problems/new");

    // 不填 answer，只填 content
    await page.fill("textarea#content", "some content");

    // 提交
    await page.click('button[type="submit"]');

    // 应显示校验错误
    await expect(page.getByText("错误作答不能为空")).toBeVisible({
      timeout: 5000,
    });
  });
});
