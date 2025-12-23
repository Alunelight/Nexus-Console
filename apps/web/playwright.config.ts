import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

  // 测试超时时间
  timeout: 30 * 1000,

  // 每个测试的重试次数
  retries: process.env.CI ? 2 : 0,

  // 并行执行的 worker 数量
  workers: process.env.CI ? 1 : undefined,

  // 报告配置
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    ["list"],
  ],

  // 全局配置
  use: {
    // 基础 URL
    baseURL: "http://localhost:5173",

    // 截图配置
    screenshot: "only-on-failure",

    // 视频录制
    video: "retain-on-failure",

    // 追踪
    trace: "on-first-retry",
  },

  // 测试项目配置
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // 移动端测试（可选）
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // 开发服务器配置
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
