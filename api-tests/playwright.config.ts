import { defineConfig } from "@playwright/test";

import { ENVIRONMENTS, baseUrl } from "../config/environments";
import { reportsFor } from "../config/reporting";

const { environment, url, overridden } = baseUrl("api", "local");

/** The stub is started only for the local row, on its port; an override is already running. */
const LOCAL_API = new URL(ENVIRONMENTS.local.api);
const STUB = {
  command: "npx tsx stub/server.ts",
  url: `${LOCAL_API.origin}/health`,
  env: { STUB_PORT: LOCAL_API.port || "80" },
  reuseExistingServer: !process.env.CI,
};

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  ...reportsFor("api"),
  use: {
    baseURL: url.replace(/\/?$/, "/"),
    extraHTTPHeaders: { accept: "application/json" },
    trace: "retain-on-failure",
  },
  webServer: environment === "local" && !overridden ? STUB : undefined,
});
