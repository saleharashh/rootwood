import { defineConfig } from "@playwright/test";
import { WEB_URL, createWebServers } from "./e2e/test-env";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: /screenshots[\\/]/,
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: WEB_URL,
    channel: process.env.CI ? undefined : "chrome",
    locale: "fa-IR",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: createWebServers(),
});
