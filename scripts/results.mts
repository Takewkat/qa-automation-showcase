import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** The parts of the repo: `<part>-tests/`, its run under reports/<part>/. */
export const PARTS = ["api", "e2e"];

/** The scenario ID a test title starts with, as eslint and traceability require it. */
export const ID_PREFIX = /^([A-Z]{3,4}-\d{3})\b/;

/** An annotation of a test or of one attempt, `rate-limited` among them. */
export type Annotation = { type: string };
/** One attempt of a test: its error, its console and what it left on disk. */
export type Attempt = {
  error?: { message?: string; stack?: string; location?: { file: string; line: number } };
  annotations?: Annotation[];
  stdout?: { text?: string }[];
  attachments: { name: string; path?: string }[];
};
/** A test in one project; `status` is expected, unexpected, flaky or skipped. */
export type Test = {
  status: string;
  projectName: string;
  annotations: Annotation[];
  results: Attempt[];
};
/** A test() of a spec file: its title, its tags without the @, a test per project. */
export type Spec = { title: string; tags: string[]; file: string; line: number; tests: Test[] };
type Suite = { specs?: Spec[]; suites?: Suite[] };

/** Every spec of a suite and of the suites under it. */
const flat = (suite: Suite): Spec[] => [
  ...(suite.specs ?? []),
  ...(suite.suites ?? []).flatMap(flat),
];

/** The last run of one part, from the json reporter of config/reporting.ts: when it started, every spec; undefined when the part has not run. */
export function lastRun(report: string): { startTime: string; specs: Spec[] } | undefined {
  const file = join("reports", report, "results.json");
  if (!existsSync(file)) return undefined;
  const json = JSON.parse(readFileSync(file, "utf8"));
  return { startTime: json.stats.startTime, specs: flat(json) };
}
