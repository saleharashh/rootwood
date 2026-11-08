import { defineConfig } from "@playwright/test";
import { WEB_URL, createWebServers } from "./e2e/test-env";

export default defineConfig({
  testDir: "./e2e/screenshots",
  outputDir: "test-results/screenshots",
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  reporter: [["list"]],
  use: {
    baseURL: WEB_URL,
    channel: process.env.CI ? undefined : "chrome",
    locale: "fa-IR",
    viewport: { width: 1440, height: 900 },
  },
  webServer: createWebServers(),
});
