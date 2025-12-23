import { expect, test } from "@playwright/test";

test.describe("组件示例页面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples");
  });

  test("应该显示示例页面", async ({ page }) => {
    // 验证页面标题
    await expect(
      page.getByRole("heading", { name: /examples/i })
    ).toBeVisible();
  });

  test("应该能够触发 Toast 通知", async ({ page }) => {
    // 点击成功通知按钮
    await page.getByRole("button", { name: /success toast/i }).click();

    // 验证通知显示
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 2000 });

    // 等待通知消失
    await page.waitForTimeout(3000);
  });

  test("应该能够触发错误通知", async ({ page }) => {
    // 点击错误通知按钮
    await page.getByRole("button", { name: /error toast/i }).click();

    // 验证错误通知显示
    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 2000 });
  });

  test("应该能够触发 Promise 通知", async ({ page }) => {
    // 点击 Promise 通知按钮
    await page.getByRole("button", { name: /promise toast/i }).click();

    // 验证加载状态
    await expect(page.getByText(/loading/i)).toBeVisible({ timeout: 2000 });

    // 等待完成
    await expect(page.getByText(/success|complete/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("应该能够测试错误边界", async ({ page }) => {
    // 点击触发错误按钮
    await page.getByRole("button", { name: /trigger error/i }).click();

    // 验证错误边界显示
    await expect(page.getByText(/something went wrong/i)).toBeVisible({
      timeout: 2000,
    });
  });

  test("应该能够提交表单", async ({ page }) => {
    // 填写表单
    await page.fill('[name="username"]', "testuser");
    await page.fill('[name="email"]', "test@example.com");

    // 提交表单
    await page.getByRole("button", { name: /submit/i }).click();

    // 验证成功消息
    await expect(page.getByText(/form submitted|success/i)).toBeVisible({
      timeout: 2000,
    });
  });

  test("应该验证表单必填字段", async ({ page }) => {
    // 直接提交空表单
    await page.getByRole("button", { name: /submit/i }).click();

    // 验证错误消息
    await expect(page.getByText(/required/i)).toBeVisible();
  });
});
