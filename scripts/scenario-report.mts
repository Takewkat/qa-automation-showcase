import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Joins each part's results.json with its scenario table: one line per scenario ID, totals per priority, a P1 gate. */
const PARTS = [
  { part: "api-tests", report: "api" },
  { part: "e2e-tests", report: "e2e" },
];
const DOC_ROW = /^\|\s*([A-Z]{3,4}-\d{3})\b/;
const PRIORITY = /^P[123]$/;
const ID_PREFIX = /^([A-Z]{3,4}-\d{3})\b/;
const WORST = ["unexpected", "flaky", "skipped", "expected"];

type Suite = { specs?: { title: string; tests: { status: string }[] }[]; suites?: Suite[] };

/** Scenario ID to priority from the docs table. */
function priorities(part: string): Map<string, string> {
  const file = join(part, "docs", "test-scenarios.md");
  const map = new Map<string, string>();
  if (!existsSync(file)) return map;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = DOC_ROW.exec(line);
    const cells = line.split("|").map((cell) => cell.trim());
    const priority = cells.find((cell) => PRIORITY.test(cell));
    if (match && priority) map.set(match[1], priority);
  }
  return map;
}

/** The worst of the statuses given, in WORST order; an undefined entry is a scenario not seen yet. */
function worst(statuses: (string | undefined)[]): string {
  return statuses
    .filter((status): status is string => status !== undefined)
    .sort((a, b) => WORST.indexOf(a) - WORST.indexOf(b))[0];
}

/** Worst status per scenario ID across every spec that carries it and ran at least once. */
function results(report: string): Map<string, string> {
  const file = join("reports", report, "results.json");
  const map = new Map<string, string>();
  if (!existsSync(file)) return map;
  const walk = (suite: Suite): void => {
    for (const spec of suite.specs ?? []) {
      const id = ID_PREFIX.exec(spec.title)?.[1];
      if (!id || spec.tests.length === 0) continue;
      map.set(id, worst([map.get(id), ...spec.tests.map((t) => t.status)]));
    }
    (suite.suites ?? []).forEach(walk);
  };
  walk(JSON.parse(readFileSync(file, "utf8")));
  return map;
}

const lines: string[] = [];
let p1Failures = 0;
for (const { part, report } of PARTS) {
  const docs = priorities(part);
  const run = results(report);
  if (run.size === 0) continue;
  lines.push(`## ${part}`, "", "| ID | Priority | Result |", "|---|---|---|");
  const totals = new Map<string, { passed: number; total: number }>();
  for (const [id, status] of [...run].sort()) {
    const priority = docs.get(id) ?? "?";
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
