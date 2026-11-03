import { join } from "node:path";

export type Target = "api" | "web";

/** One row per environment; the api rows mirror the servers list of the OpenAPI document. */
export const ENVIRONMENTS = {
  local: { api: "http://127.0.0.1:8080/api/v1", web: "http://localhost:3000" },
  demo: { web: "https://conduit-realworld-example-app.fly.dev" },
  staging: { api: "https://api.staging.example.com/job-offers/v1" },
  production: { api: "https://api.example.com/job-offers/v1" },
} as const satisfies Record<string, Partial<Record<Target, string>>>;

export type EnvironmentName = keyof typeof ENVIRONMENTS;

const NEVER_A_TARGET: EnvironmentName = "production";
const SUPPORTED = Object.keys(ENVIRONMENTS).join(", ");

/** Reads the root .env once; variables already set in the shell win. */
function loadDotEnv(): void {
  try {
    process.loadEnvFile(join(__dirname, "..", ".env"));
  } catch {
    return;
  }
}

/** The environment TEST_ENV names, or the part's fallback; unknown names and production fail. */
export function resolveEnvironment(fallback: EnvironmentName): EnvironmentName {
  loadDotEnv();
  const name = process.env.TEST_ENV || fallback;
  if (!(name in ENVIRONMENTS))
    throw new Error(`Unknown TEST_ENV="${name}". Supported: ${SUPPORTED}.`);
  if (name === NEVER_A_TARGET)
    throw new Error("production is never a test target: the suites create and delete data.");
  return name as EnvironmentName;
}

/** The base URL of one target in the resolved environment; <TARGET>_BASE_URL overrides it. */
export function baseUrl(
  target: Target,
  fallback: EnvironmentName,
): { environment: EnvironmentName; url: string } {
  const environment = resolveEnvironment(fallback);
  const override = process.env[`${target.toUpperCase()}_BASE_URL`];
  const url = override || (ENVIRONMENTS[environment] as Partial<Record<Target, string>>)[target];
  if (!url) {
    throw new Error(
      `Environment "${environment}" has no ${target} target; pick another TEST_ENV or set ${target.toUpperCase()}_BASE_URL.`,
    );
  }
  return { environment, url };
}
