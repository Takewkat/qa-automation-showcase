import { mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { stripVTControlCharacters } from "node:util";

import { lastRun, PARTS, type Attempt, type Spec, type Test } from "./results.mts";

/** Sorts each failure of the last run by what its report proves: infra, contract or flaky; the rest is left to read, test, product, infra or unsure, by the /triage skill. `npm run triage -- api` reads one part. */
const ASKED = PARTS.filter((p) => process.argv.length < 3 || process.argv.includes(p));
if (ASKED.length === 0) throw new Error(`no part ${process.argv.slice(2).join(" ")}: ${PARTS}`);
/** A 429 a seeding or setup call received; a 429 the page met is the `rate-limited` annotation of src/utils/requests.ts. */
const RATE_LIMITED = /received 429\b/;
/** No answer from the target, or one that is not HTTP: a connection that never opened or broke, a timeout, a malformed response. */
const NO_ANSWER =
  /ECONNREFUSED|ECONNRESET|ENOTFOUND|ETIMEDOUT|EHOSTUNREACH|EAI_AGAIN|socket hang up|net::ERR_|apiRequestContext\.\w+: (Timeout|Parse Error)/;
/** The error text of a response outside its schema, from shared/api/contract.ts; `no schema for` is a test that expects an undocumented status, left to read. */
const CONTRACT = /\b[A-Z]+ \/\S* \d{3}: /;
/** The attachment a reader opens first: the screenshot (E2E), else error-context.md (API); the trace sits in the same folder. */
const ARTIFACTS = ["screenshot", "error-context", "trace"];
const ERROR_LENGTH = 140;

/** A test that did not pass on its first attempt: its title, part and project, where it failed, its whole error, what it left and logged. */
type Failure = {
  part: string;
  title: string;
  status: string;
  where: string;
  error: string;
  annotations: string[];
  artifact: string;
  console: string;
};
type Rule = { verdict: string; proves: (failure: Failure) => boolean; next: string };

/** First match wins; a failure no rule proves is to read. A contract fault stays one when a retry passed. */
const RULES: Rule[] = [
  {
    verdict: "infra",
    proves: (f) => f.annotations.includes("rate-limited") || RATE_LIMITED.test(f.error),
    next: "the target answered 429 during the test: wait for its window or rerun on TEST_ENV=local; no test change",
  },
  {
    verdict: "infra",
    proves: (f) => NO_ANSWER.test(f.error),
    next: "the target did not answer in HTTP: bring it up or switch TEST_ENV; no test change",
  },
  {
    verdict: "contract",
    proves: (f) => CONTRACT.test(f.error),
    next: "a response outside the spec: the service or the spec is wrong; spec/ is never edited",
  },
  {
    verdict: "flaky",
    proves: (f) => f.status === "flaky",
    next: "passed on retry: a race in a page object or a fixture; read the failed attempt",
  },
];
const TO_READ = { verdict: "read", next: "test, product, infra or unsure: /triage reads it" };
const VERDICTS = ["infra", "contract", "flaky", "read"];

/** The first line of a text, cut to fit a table cell. */
const cell = (text: string): string =>
  text.split("\n")[0].replace(/\|/g, "\\|").slice(0, ERROR_LENGTH);

/** A path the reader opens from the repo root. */
const local = (path: string): string => (isAbsolute(path) ? relative(process.cwd(), path) : path);

/** The first artifact of an attempt in ARTIFACTS order, or an empty cell. */
const artifactOf = (attempt: Attempt | undefined): string => {
  const paths = ARTIFACTS.map((name) => attempt?.attachments.find((a) => a.name === name)?.path);
  const path = paths.find(Boolean);
  return path ? local(path) : "";
};

/** The line of a file in an error stack, when the stack passes through it. */
const lineIn = (file: string, stack = ""): string | undefined => {
  const frame = stack.split("\n").find((line) => line.includes(`${file}:`));
  return frame && /:(\d+):\d+\)?$/.exec(frame)?.[1];
};

/** The spec line in the error's stack, else the test() line, then the helper that threw when it is not the spec. */
const whereOf = (part: string, spec: Spec, attempt: Attempt | undefined): string => {
  const file = join(`${part}-tests`, "tests", spec.file);
  const thrown = attempt?.error?.location;
  const helper =
    thrown && local(thrown.file) !== file ? ` via ${local(thrown.file)}:${thrown.line}` : "";
  return `${file}:${lineIn(file, attempt?.error?.stack) ?? spec.line}${helper}`;
};

/** The failure of one test, read from its last attempt with an error: for a flaky test, the attempt that failed. */
function failureOf(part: string, spec: Spec, test: Test): Failure {
  const failed = [...test.results].reverse().find((attempt) => attempt.error);
  const annotations = [test.annotations, ...test.results.map((a) => a.annotations ?? [])];
  return {
    part: [part, test.projectName].filter(Boolean).join("/"),
    title: spec.title,
    status: test.status,
    where: whereOf(part, spec, failed),
    error: stripVTControlCharacters(failed?.error?.message ?? ""),
    annotations: annotations.flat().map((annotation) => annotation.type),
    artifact: artifactOf(failed),
    console: (failed?.stdout ?? []).map((line) => line.text ?? "").join(""),
  };
}

/** Every test of one part that did not pass on its first attempt. */
const failures = (part: string, specs: Spec[]): Failure[] =>
  specs.flatMap((spec) =>
    spec.tests
      .filter((test) => test.status === "unexpected" || test.status === "flaky")
      .map((test) => failureOf(part, spec, test)),
  );

/** The verdict of the first rule that proves the failure, else to read, its table row and, to read, its console. */
function row(failure: Failure): { verdict: string; line: string; log: string[] } {
  const { verdict, next } = RULES.find((rule) => rule.proves(failure)) ?? TO_READ;
  const { title, part, where, error, artifact, console: logged } = failure;
  const log =
    verdict === "read" && logged
      ? ["", `### ${title} (${part})`, "", "```", logged.trimEnd(), "```"]
      : [];
  return {
    verdict,
    line: `| ${cell(title)} | ${part} | ${verdict} | ${where} | ${cell(error)} | ${artifact} | ${next} |`,
    log,
  };
}

const runs = ASKED.map((part) => ({ part, run: lastRun(part) }));
const read = runs.flatMap(({ part, run }) => (run ? [`${part}: the run of ${run.startTime}`] : []));
const rows = runs.flatMap(({ part, run }) => failures(part, run?.specs ?? [])).map(row);
const counts = VERDICTS.map((v) => `${rows.filter((r) => r.verdict === v).length} ${v}`);
const table = [
  "| Test | Part | Verdict | Where | Error | Artifact | Next |",
  "|---|---|---|---|---|---|---|",
  ...rows.map((r) => r.line),
  "",
  `triage: ${counts.join(", ")}`,
  ...rows.flatMap((r) => r.log),
];
const body = rows.length === 0 ? ["No failure; nothing to triage."] : table;
const output =
  read.length === 0
    ? "No results under reports/; run the suites first."
    : [...read, "", ...body].join("\n");
mkdirSync("reports", { recursive: true });
writeFileSync(join("reports", "triage.md"), `${output}\n`);
console.log(output);
