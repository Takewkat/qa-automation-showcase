import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Ties docs/test-scenarios.md to tests/ by scenario ID and every test() to its folder, layer and tier tags. */
const LAYERS = ["@happy-path", "@validation-error", "@error-case"];
const TIERS = ["@smoke", "@sanity", "@regression", "@release-check"];
/** The tag families a test() carries exactly one of, next to its folder tag: the layer in both parts, the tier in e2e-tests. */
const PARTS = [
  { part: "api-tests", families: [LAYERS] },
  { part: "e2e-tests", families: [LAYERS, TIERS] },
];
const SCENARIO_ID = /^[A-Z]{3,4}-\d{3}$/;
/** A test() call: title, optional options object, then the function; tags come from the tag property. */
const TEST_CALL =
  /\btest(?:\.(?:skip|fixme|only|fail))?\(\s*([`"'])(([A-Z]{3,4}-\d{3})(?:(?!\1).)*)\1\s*,\s*(?:(\{.*?\})\s*,\s*)?(?=async\b|function\b|\(|[\w$]+\s*\()/gs;
const TAG_OPTION = /\btag:\s*(\[[^\]]*\]|["'`][^"'`]*["'`])/;
const TAG = /@[a-z-]+/g;

type Spec = { file: string; folder: string; id: string; title: string; tags: string[] };

/** IDs of documented scenarios marked as implemented: the cell that is an ID, whatever its column; a trailing "no" cell means designed only. */
function documentedIds(part: string): Set<string> {
  const file = join(part, "docs", "test-scenarios.md");
  if (!existsSync(file)) return new Set();
  const ids = new Set<string>();
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    const id = cells.find((cell) => SCENARIO_ID.test(cell));
    if (id && cells.at(-1)?.toLowerCase() !== "no") ids.add(id);
  }
  return ids;
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

const missing = (from: Set<string>, inSet: Set<string>) =>
  [...from].filter((id) => !inSet.has(id)).sort();

let failures = 0;
for (const { part, families } of PARTS) {
  const docs = documentedIds(part);
  const found = specs(part);
  const tests = new Set(found.map((spec) => spec.id));
  const faults = found
    .map((spec) => tagFault(spec, families))
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
