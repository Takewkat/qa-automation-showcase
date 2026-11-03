import { defineConfig, devices } from "@playwright/test";

import { baseUrl } from "../config/environments";

const { url } = baseUrl("web", "demo");

/** BROWSERS=chromium,firefox,webkit picks the projects; the default keeps one browser. */
const DEVICES = {
  chromium: "Desktop Chrome",
  firefox: "Desktop Firefox",
  webkit: "Desktop Safari",
} as const;
const browsers = (process.env.BROWSERS ?? "chromium").split(",") as (keyof typeof DEVICES)[];

/** Two workers at most against the shared demo. */
const WORKERS = 2;
const TEST_TIMEOUT_MS = 60_000;
const EXPECT_TIMEOUT_MS = 10_000;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  workers: WORKERS,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: TEST_TIMEOUT_MS,
  expect: { timeout: EXPECT_TIMEOUT_MS },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: url,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: browsers.map((name) => ({ name, use: { ...devices[DEVICES[name]] } })),
});
