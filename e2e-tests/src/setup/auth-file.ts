import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import type { User } from "@e2e/api";
import { resolveEnvironment } from "../../../config/environments";
import { REPORTS_ROOT } from "../../../config/reporting";

/** The storageState of the run's user, one file per environment under the gitignored reports/: a local user is never sent to the demo. */
export const AUTH_FILE = join(REPORTS_ROOT, "e2e", ".auth", `${resolveEnvironment("demo")}.json`);
/** The same file as the logs name it, relative to the repo. */
export const AUTH_FILE_LABEL = relative(join(REPORTS_ROOT, ".."), AUTH_FILE);
const KEY = "loggedUser";

type Stored = { headers: { Authorization: string }; isAuth: true; loggedUser: User };
type StoredOrigin = { origin: string; localStorage: { name: string; value: string }[] };
type StorageState = { cookies: never[]; origins: StoredOrigin[] };

/** The origin the user is cached for; the config sets baseURL on every project. */
export const originOf = (baseURL: string | undefined): string => new URL(String(baseURL)).origin;

/** When the file was written, for the logs. */
export const cachedSince = (): string => statSync(AUTH_FILE).mtime.toISOString();

/** What the app reads from localStorage at start: the header it will send, the auth flag, the user as the API returned it. */
const stored = (user: User): Stored => ({
  headers: { Authorization: `Token ${user.token}` },
  isAuth: true,
  loggedUser: user,
});

/** The user cached for that base URL, or undefined when the file is absent or was written for another origin. */
export function readCachedUser(baseURL: string | undefined): User | undefined {
  if (!existsSync(AUTH_FILE)) return undefined;
  const { origins }: StorageState = JSON.parse(readFileSync(AUTH_FILE, "utf8"));
  const item = origins
    .find((entry) => entry.origin === originOf(baseURL))
    ?.localStorage.find((entry) => entry.name === KEY);
  return item ? (JSON.parse(item.value) as Stored).loggedUser : undefined;
}

/** Writes the storageState a browser context starts from: the user logged in at that origin. */
export function writeCachedUser(baseURL: string | undefined, user: User): void {
  const localStorage = [{ name: KEY, value: JSON.stringify(stored(user)) }];
  const origins = [{ origin: originOf(baseURL), localStorage }];
  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  writeFileSync(
    AUTH_FILE,
    JSON.stringify({ cookies: [], origins } satisfies StorageState, null, 2),
  );
}
