import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Reads results.json per part: one line per scenario ID with the priority its tag carries, totals per priority, a P1 gate. */
const PARTS = [
  { part: "api-tests", report: "api" },
  { part: "e2e-tests", report: "e2e" },
];
const ID_PREFIX = /^([A-Z]{3,4}-\d{3})\b/;
/** The reporter writes tags without their @. */
const PRIORITY_TAG = /^p[123]$/;
const WORST = ["unexpected", "flaky", "skipped", "expected"];

type SpecResult = { title: string; tags: string[]; tests: { status: string }[] };
type Suite = { specs?: SpecResult[]; suites?: Suite[] };
type Scenario = { priority: string; status: string };

/** The worst of the statuses given, in WORST order; an undefined entry is a scenario not seen yet. */
function worst(statuses: (string | undefined)[]): string {
  return statuses
    .filter((status): status is string => status !== undefined)
    .sort((a, b) => WORST.indexOf(a) - WORST.indexOf(b))[0];
}

/** The scenario after one more of its specs: the priority tag the spec carries, the worst status so far. */
function merge(seen: Scenario | undefined, spec: SpecResult): Scenario {
  const tag = spec.tags.find((candidate) => PRIORITY_TAG.test(candidate));
  return {
    priority: tag?.toUpperCase() ?? seen?.priority ?? "?",
    status: worst([seen?.status, ...spec.tests.map((t) => t.status)]),
  };
}

/** Per scenario ID: its priority and the worst status across every spec that carries it and ran at least once. */
function results(report: string): Map<string, Scenario> {
  const file = join("reports", report, "results.json");
  const map = new Map<string, Scenario>();
  if (!existsSync(file)) return map;
  const walk = (suite: Suite): void => {
    for (const spec of suite.specs ?? []) {
      const id = ID_PREFIX.exec(spec.title)?.[1];
      if (!id || spec.tests.length === 0) continue;
      map.set(id, merge(map.get(id), spec));
    }
    (suite.suites ?? []).forEach(walk);
  };
  walk(JSON.parse(readFileSync(file, "utf8")));
  return map;
}

const lines: string[] = [];
let p1Failures = 0;
for (const { part, report } of PARTS) {
  const run = results(report);
  if (run.size === 0) continue;
  lines.push(`## ${part}`, "", "| ID | Priority | Result |", "|---|---|---|");
  const totals = new Map<string, { passed: number; total: number }>();
  for (const [id, { priority, status }] of [...run].sort(([a], [b]) => a.localeCompare(b))) {
    const bucket = totals.get(priority) ?? { passed: 0, total: 0 };
    bucket.total += 1;
    if (status === "expected") bucket.passed += 1;
    else if (priority === "P1") p1Failures += 1;
    totals.set(priority, bucket);
    lines.push(`| ${id} | ${priority} | ${status} |`);
  }
  lines.push("", ...[...totals].sort().map(([p, t]) => `${p}: ${t.passed}/${t.total} passed`), "");
}

const output =
  lines.length === 0 ? "No results under reports/; run the suites first." : lines.join("\n");
mkdirSync("reports", { recursive: true });
writeFileSync(join("reports", "scenarios.md"), `${output}\n`);
console.log(output);
if (p1Failures > 0) {
  console.error(`P1 gate: ${p1Failures} P1 scenario(s) not passed`);
  process.exit(1);
}
