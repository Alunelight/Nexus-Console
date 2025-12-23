import { expect, test } from "@playwright/test";

test.describe("用户管理", () => {
  test.beforeEach(async ({ page }) => {
    // 导航到用户页面
    await page.goto("/users");
  });

  test("应该显示用户列表", async ({ page }) => {
    // 等待用户列表加载
    await page.waitForSelector('[data-testid="user-list"]', {
      timeout: 5000,
    });

    // 验证列表存在
    const userList = page.locator('[data-testid="user-list"]');
    await expect(userList).toBeVisible();
  });

  test("应该能够创建新用户", async ({ page }) => {
    // 点击创建用户按钮
    await page.getByRole("button", { name: /create user/i }).click();

    // 填写表单
    const timestamp = Date.now();
    await page.fill('[name="email"]', `test${timestamp}@example.com`);
    await page.fill('[name="name"]', `Test User ${timestamp}`);

    // 提交表单
    await page.getByRole("button", { name: /submit|save/i }).click();

    // 验证成功消息
    await expect(page.getByText(/user created|success/i)).toBeVisible({
      timeout: 5000,
    });

    // 验证新用户出现在列表中
    await expect(page.getByText(`test${timestamp}@example.com`)).toBeVisible();
  });

  test("应该能够查看用户详情", async ({ page }) => {
    // 等待用户列表加载
    await page.waitForSelector('[data-testid="user-list"]');

    // 点击第一个用户
    await page.locator('[data-testid="user-item"]').first().click();

    // 验证详情页面
    await expect(page).toHaveURL(/\/users\/\d+/);
    await expect(
      page.getByRole("heading", { name: /user details/i })
    ).toBeVisible();
  });

  test("应该能够编辑用户", async ({ page }) => {
    // 等待用户列表加载
    await page.waitForSelector('[data-testid="user-list"]');

    // 点击编辑按钮
    await page.locator('[data-testid="edit-user-button"]').first().click();

    // 修改名称
    const timestamp = Date.now();
    await page.fill('[name="name"]', `Updated User ${timestamp}`);

    // 提交表单
    await page.getByRole("button", { name: /save|update/i }).click();

    // 验证成功消息
    await expect(page.getByText(/updated|success/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("应该能够删除用户", async ({ page }) => {
    // 等待用户列表加载
    await page.waitForSelector('[data-testid="user-list"]');

    // 获取初始用户数量
    const initialCount = await page
      .locator('[data-testid="user-item"]')
      .count();

    // 点击删除按钮
    await page.locator('[data-testid="delete-user-button"]').first().click();

    // 确认删除
    await page.getByRole("button", { name: /confirm|yes|delete/i }).click();

    // 验证成功消息
    await expect(page.getByText(/deleted|success/i)).toBeVisible({
      timeout: 5000,
    });

    // 验证用户数量减少
    const finalCount = await page.locator('[data-testid="user-item"]').count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test("应该验证表单输入", async ({ page }) => {
    // 点击创建用户按钮
    await page.getByRole("button", { name: /create user/i }).click();

    // 提交空表单
    await page.getByRole("button", { name: /submit|save/i }).click();

    // 验证错误消息
    await expect(page.getByText(/required|invalid/i)).toBeVisible();

    // 输入无效邮箱
    await page.fill('[name="email"]', "invalid-email");
    await page.getByRole("button", { name: /submit|save/i }).click();

    // 验证邮箱格式错误
    await expect(page.getByText(/invalid email|email format/i)).toBeVisible();
  });
});
