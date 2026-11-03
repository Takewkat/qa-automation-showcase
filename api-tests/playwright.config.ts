import { defineConfig } from "@playwright/test";

import { baseUrl } from "../config/environments";

const { environment, url } = baseUrl("api", "local");

/** The stub is started only for the local environment; any other target is already running. */
const STUB = {
  command: "npx tsx stub/server.ts",
  url: "http://127.0.0.1:8080/health",
  reuseExistingServer: !process.env.CI,
};

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: url, extraHTTPHeaders: { accept: "application/json" } },
  webServer: environment === "local" ? STUB : undefined,
});
