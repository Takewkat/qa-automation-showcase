import { defineConfig, devices } from "@playwright/test";

import { baseUrl, lookup } from "../config/environments";
import { reportsFor } from "../config/reporting";

const { environment, url } = baseUrl("web", "demo");

/** No retry on the shared demo: a 429 would only get another 429 and spend the window. */

const DEVICES = {
  chromium: "Desktop Chrome",
  firefox: "Desktop Firefox",
  webkit: "Desktop Safari",
} as const;

/** BROWSERS=chromium,firefox,webkit picks the projects; the default keeps one browser. */
const browsers = (process.env.BROWSERS || "chromium")
  .split(",")
  .map((entry) => lookup(DEVICES, entry.trim(), "BROWSERS"));

/** Two workers at most against the shared demo. */
const WORKERS = 2;
const TEST_TIMEOUT_MS = 60_000;
const EXPECT_TIMEOUT_MS = 10_000;

/** The project every browser project depends on: src/setup/auth.setup.ts caches the run's user, outside tests/ so the scenario rules do not apply to it. */
const SETUP = "setup";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  workers: WORKERS,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI && environment !== "demo" ? 1 : 0,
  timeout: TEST_TIMEOUT_MS,
  expect: { timeout: EXPECT_TIMEOUT_MS },
  ...reportsFor("e2e"),
  use: {
    baseURL: url,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: SETUP, testDir: "src/setup", testMatch: /auth\.setup\.ts/ },
    ...browsers.map((name) => ({
      name,
      use: { ...devices[DEVICES[name]] },
      dependencies: [SETUP],
    })),
  ],
});
