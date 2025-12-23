import { expect, test } from "@playwright/test";

test.describe("首页", () => {
  test("应该正确加载首页", async ({ page }) => {
    await page.goto("/");

    // 检查页面标题
    await expect(page).toHaveTitle(/Nexus Console/i);

    // 检查主要内容是否存在
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("应该能够导航到关于页面", async ({ page }) => {
    await page.goto("/");

    // 点击关于链接
    await page.getByRole("link", { name: /about/i }).click();

    // 验证 URL 变化
    await expect(page).toHaveURL(/\/about/);

    // 验证页面内容
    await expect(page.getByRole("heading", { name: /about/i })).toBeVisible();
  });

  test("应该能够导航到用户页面", async ({ page }) => {
    await page.goto("/");

    // 点击用户链接
    await page.getByRole("link", { name: /users/i }).click();

    // 验证 URL 变化
    await expect(page).toHaveURL(/\/users/);

    // 验证页面内容
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
  });
});
