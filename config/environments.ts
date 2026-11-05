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
const NEVER_A_TARGET_MESSAGE =
  "production is never a test target: the suites create and delete data.";
const NEVER_A_TARGET_HOSTS = Object.values(ENVIRONMENTS[NEVER_A_TARGET]).map(
  (url) => new URL(url).host,
);
const SUPPORTED = Object.keys(ENVIRONMENTS).filter((name) => name !== NEVER_A_TARGET);

/** Reads the root .env once; variables already set in the shell win. */
function loadDotEnv(): void {
  try {
    process.loadEnvFile(join(__dirname, "..", ".env"));
  } catch {
    return;
  }
}

/** The key of a table that an environment variable names; an unknown name fails with the supported list. */
export function lookup<T extends object>(
  table: T,
  name: string,
  variable: string,
  supported = Object.keys(table),
): keyof T {
  if (!Object.hasOwn(table, name))
    throw new Error(`Unknown ${variable}="${name}". Supported: ${supported.join(", ")}.`);
  return name as keyof T;
}

/** The environment TEST_ENV names, or the part's fallback; unknown names and production fail. */
export function resolveEnvironment(fallback: EnvironmentName): EnvironmentName {
  loadDotEnv();
  const name = lookup(ENVIRONMENTS, process.env.TEST_ENV || fallback, "TEST_ENV", SUPPORTED);
  if (name === NEVER_A_TARGET) throw new Error(NEVER_A_TARGET_MESSAGE);
  return name;
}

/** The <TARGET>_BASE_URL override, if set: it must parse as a URL and must not point at production. */
function overrideFor(target: Target): string | undefined {
  const variable = `${target.toUpperCase()}_BASE_URL`;
  const override = process.env[variable];
  if (!override) return undefined;
  const host = URL.parse(override)?.host;
  if (!host) throw new Error(`${variable} is not a URL: "${override}".`);
  if (NEVER_A_TARGET_HOSTS.includes(host)) throw new Error(NEVER_A_TARGET_MESSAGE);
  return override;
}

/** The base URL of one target in the resolved environment; <TARGET>_BASE_URL overrides it. */
export function baseUrl(
  target: Target,
  fallback: EnvironmentName,
): { environment: EnvironmentName; url: string; overridden: boolean } {
  const environment = resolveEnvironment(fallback);
  const override = overrideFor(target);
  const url = override || (ENVIRONMENTS[environment] as Partial<Record<Target, string>>)[target];
  if (!url) {
    throw new Error(
      `Environment "${environment}" has no ${target} target; pick another TEST_ENV or set ${target.toUpperCase()}_BASE_URL.`,
    );
  }
  return { environment, url, overridden: !!override };
}
