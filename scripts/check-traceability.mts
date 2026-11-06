import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Ties docs/test-scenarios.md to tests/ by scenario ID and every test() to its folder, layer, priority and tier tags. */
const LAYERS = ["@happy-path", "@validation-error", "@error-case"];
const PRIORITIES = ["@p1", "@p2", "@p3"];
const TIERS = ["@smoke", "@sanity", "@regression", "@release-check"];
/** The tag families a test() carries exactly one of, next to its folder tag; the tier is e2e-tests only. */
const PARTS = [
  { part: "api-tests", families: [LAYERS, PRIORITIES] },
  { part: "e2e-tests", families: [LAYERS, PRIORITIES, TIERS] },
];
const SCENARIO_ID = /^[A-Z]{3,4}-\d{3}$/;
const PRIORITY = /^P[123]$/;
/** A test() call: title, optional options object, then the function; tags come from the tag property. */
const TEST_CALL =
  /\btest(?:\.(?:skip|fixme|only|fail))?\(\s*([`"'])(([A-Z]{3,4}-\d{3})(?:(?!\1).)*)\1\s*,\s*(?:(\{.*?\})\s*,\s*)?(?=async\b|function\b|\(|[\w$]+\s*\()/gs;
const TAG_OPTION = /\btag:\s*(\[[^\]]*\]|["'`][^"'`]*["'`])/;
const TAG = /@[a-z0-9-]+/g;

type Spec = { file: string; folder: string; id: string; title: string; tags: string[] };

type Row = { id: string; priority?: string };

/** A table line that names an implemented scenario: its ID cell and its Priority cell; a trailing "no" cell means designed only. */
function rowOf(line: string): Row | undefined {
  if (!line.startsWith("|")) return undefined;
  const cells = line
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);
  const id = cells.find((cell) => SCENARIO_ID.test(cell));
  if (!id || cells.at(-1)?.toLowerCase() === "no") return undefined;
  return { id, priority: cells.find((cell) => PRIORITY.test(cell)) };
}

/** Documented scenarios, ID to Priority cell; a grid cell names the ID without one, the scenario row wins wherever it sits. */
function documented(part: string): Map<string, string> {
  const file = join(part, "docs", "test-scenarios.md");
  const rows = new Map<string, string>();
  if (!existsSync(file)) return rows;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const row = rowOf(line);
    if (row) rows.set(row.id, row.priority ?? rows.get(row.id) ?? "none");
  }
  return rows;
}

/** The tags a test() options object declares. */
const tagsOf = (options: string): string[] => TAG_OPTION.exec(options)?.[1].match(TAG) ?? [];

/** Every test() under the part's tests/ with a scenario ID in its title: file, folder, title, tags. */
function specs(part: string): Spec[] {
  const dir = join(part, "tests");
  if (!existsSync(dir)) return [];
  const found: Spec[] = [];
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".spec.ts")) continue;
    const folder = relative(dir, entry.parentPath).split(sep)[0] || "<group>";
    const text = readFileSync(join(entry.parentPath, entry.name), "utf8");
    for (const [, , title, id, options = ""] of text.matchAll(TEST_CALL))
      found.push({ file: entry.name, folder, id, title, tags: tagsOf(options) });
  }
  return found;
}

/** The fault of a test's tags, if any: its folder tag and exactly one tag of each family are expected. */
function tagFault(spec: Spec, families: string[][]): string | undefined {
  const oneOfEach = families.every(
    (family) => spec.tags.filter((tag) => family.includes(tag)).length === 1,
  );
  if (spec.tags.includes(`@${spec.folder}`) && oneOfEach) return undefined;
  const carried = spec.tags.length ? spec.tags.join(" ") : "no tag";
  const expected = [`@${spec.folder}`, ...families.map((family) => `one of ${family.join(", ")}`)];
  return `"${spec.title}" in ${spec.file} carries ${carried}; expected ${expected.slice(0, -1).join(", ")} and ${expected.at(-1)}`;
}

/** The fault of a priority tag that is not the Priority cell of the docs row: the row decides, the tag copies it. */
function priorityFault(spec: Spec, rows: Map<string, string>): string | undefined {
  const row = rows.get(spec.id);
  const tag = spec.tags.find((tag) => PRIORITIES.includes(tag));
  if (row === undefined || tag === undefined || tag === `@${row.toLowerCase()}`) return undefined;
  const reason = row === "none" ? "its docs row has no Priority cell" : `docs say ${row}`;
  return `"${spec.title}" in ${spec.file} carries ${tag}; ${reason}`;
}

const missing = (from: Set<string>, inSet: Set<string>) =>
  [...from].filter((id) => !inSet.has(id)).sort();

let failures = 0;
for (const { part, families } of PARTS) {
  const rows = documented(part);
  const docs = new Set(rows.keys());
  const found = specs(part);
  const tests = new Set(found.map((spec) => spec.id));
  const faults = found
    .map((spec) => tagFault(spec, families) ?? priorityFault(spec, rows))
    .filter((fault) => fault !== undefined);
  for (const id of missing(docs, tests))
    console.error(`${part}: ${id} is documented but has no test`);
  for (const id of missing(tests, docs))
    console.error(`${part}: test ${id} is not in docs/test-scenarios.md`);
  for (const fault of faults) console.error(`${part}: ${fault}`);
  failures += missing(docs, tests).length + missing(tests, docs).length + faults.length;
  console.log(
    `${part}: ${docs.size} documented, ${tests.size} tested, ${found.length} test calls, ${faults.length} tag faults`,
  );
}
process.exit(failures === 0 ? 0 : 1);
