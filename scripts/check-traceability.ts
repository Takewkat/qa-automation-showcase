import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Each part ties docs/test-scenarios.md to tests/ by scenario ID; drift in either direction fails. */
const PARTS = ["api-tests", "e2e-tests"];
const DOC_ROW = /^\|\s*([A-Z]{3,4}-\d{3})\b/;
const TEST_TITLE = /\btest(?:\.(?:skip|fixme|only|fail))?\(\s*[`"']([A-Z]{3,4}-\d{3})/g;

/** IDs of documented scenarios marked as implemented (a trailing "no" cell means designed only). */
function documentedIds(part: string): Set<string> {
  const file = join(part, "docs", "test-scenarios.md");
  if (!existsSync(file)) return new Set();
  const ids = new Set<string>();
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = DOC_ROW.exec(line);
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (match && cells.at(-1)?.toLowerCase() !== "no") ids.add(match[1]);
  }
  return ids;
}

/** IDs found at the start of test() titles under the part's tests/ folder. */
function testedIds(part: string): Set<string> {
  const dir = join(part, "tests");
  if (!existsSync(dir)) return new Set();
  const ids = new Set<string>();
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".spec.ts")) continue;
    const text = readFileSync(join(entry.parentPath, entry.name), "utf8");
    for (const match of text.matchAll(TEST_TITLE)) ids.add(match[1]);
  }
  return ids;
}

const missing = (from: Set<string>, inSet: Set<string>) =>
  [...from].filter((id) => !inSet.has(id)).sort();

let failures = 0;
for (const part of PARTS) {
  const docs = documentedIds(part);
  const tests = testedIds(part);
  for (const id of missing(docs, tests))
    console.error(`${part}: ${id} is documented but has no test`);
  for (const id of missing(tests, docs))
    console.error(`${part}: test ${id} is not in docs/test-scenarios.md`);
  failures += missing(docs, tests).length + missing(tests, docs).length;
  console.log(`${part}: ${docs.size} documented, ${tests.size} tested`);
}
process.exit(failures === 0 ? 0 : 1);
