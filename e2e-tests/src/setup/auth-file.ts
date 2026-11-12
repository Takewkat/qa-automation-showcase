import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import type { User } from "@e2e/api";
import { resolveEnvironment } from "../../../config/environments";
import { REPORTS_ROOT } from "../../../config/reporting";

const AUTH_DIR = join(REPORTS_ROOT, "e2e", ".auth");
const ENVIRONMENT = resolveEnvironment("demo");
const KEY = "loggedUser";

/** The storageState of the run's user, one file per environment under the gitignored reports/: a local user is never sent to the demo. */
export const AUTH_FILE = join(AUTH_DIR, `${ENVIRONMENT}.json`);
/** The author the run's user follows (SOC-001), cached the same way; no browser starts from it. */
export const AUTHOR_FILE = join(AUTH_DIR, `${ENVIRONMENT}.author.json`);
/** A cached file as the logs name it, relative to the repo. */
export const labelOf = (file: string): string => relative(join(REPORTS_ROOT, ".."), file);
/** The run's user file as the logs name it. */
export const AUTH_FILE_LABEL = labelOf(AUTH_FILE);

type Stored = { headers: { Authorization: string }; isAuth: true; loggedUser: User };
type StoredOrigin = { origin: string; localStorage: { name: string; value: string }[] };
type StorageState = { cookies: never[]; origins: StoredOrigin[] };

/** The origin the user is cached for; the config sets baseURL on every project. */
export const originOf = (baseURL: string | undefined): string => new URL(String(baseURL)).origin;

/** When the file was written, for the logs. */
export const cachedSince = (file: string): string => statSync(file).mtime.toISOString();

/** What the app reads from localStorage at start: the header it will send, the auth flag, the user as the API returned it. */
const stored = (user: User): Stored => ({
  headers: { Authorization: `Token ${user.token}` },
  isAuth: true,
  loggedUser: user,
});

/** The user cached in that file for that base URL, or undefined when the file is absent or was written for another origin. */
export function readCachedUser(baseURL: string | undefined, file: string): User | undefined {
  if (!existsSync(file)) return undefined;
  const { origins }: StorageState = JSON.parse(readFileSync(file, "utf8"));
  const item = origins
    .find((entry) => entry.origin === originOf(baseURL))
    ?.localStorage.find((entry) => entry.name === KEY);
  return item ? (JSON.parse(item.value) as Stored).loggedUser : undefined;
}

/** Writes to that file the storageState a browser context starts from: the user logged in at that origin. */
export function writeCachedUser(baseURL: string | undefined, user: User, file: string): void {
  const localStorage = [{ name: KEY, value: JSON.stringify(stored(user)) }];
  const origins = [{ origin: originOf(baseURL), localStorage }];
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ cookies: [], origins } satisfies StorageState, null, 2));
}
