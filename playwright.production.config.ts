import { defineConfig, devices } from "@playwright/test";

if (!process.env.PRODUCTION_BASE_URL) {
  throw new Error("PRODUCTION_BASE_URL is required");
}

if (!process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  throw new Error("VERCEL_AUTOMATION_BYPASS_SECRET is required");
}

if (
  process.env.GITHUB_EVENT_NAME === "repository_dispatch" &&
  !process.env.PRODUCTION_EXPECTED_COMMIT_SHA
) {
  throw new Error("PRODUCTION_EXPECTED_COMMIT_SHA is required for deployments");
}

export default defineConfig({
  testDir: "./src/tests/production",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60 * 1000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PRODUCTION_BASE_URL,
    ...devices["Desktop Chrome"],
    screenshot: "only-on-failure",
    trace: "off",
    video: "off",
  },
});
